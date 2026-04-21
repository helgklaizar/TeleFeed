use chrono::{Local, Timelike};
use serde_json::Value;
use std::collections::{BTreeMap, HashMap, HashSet};
use std::sync::RwLock;
use std::time::Instant;

/// Максимум сообщений в кеше ленты.
const MAX_MESSAGES: usize = 10_000;
/// TTL для буфера pending: сообщения старше этого значения удаляем.
const PENDING_TTL_SECS: u64 = 60;
/// Лимит pending-сообщений на чат (защита от переполнения памяти при старте).
const MAX_PENDING_PER_CHAT: usize = 20;

pub struct FeedCache {
    /// Whitelist ленты: ID каналов из chatListMain.
    pub feed_channels: RwLock<HashSet<i64>>,

    /// folder_id → Vec<chat_id>
    pub folders: RwLock<HashMap<i32, Vec<i64>>>,

    /// (date, message_id) → message  (только feed-посты)
    pub messages: RwLock<BTreeMap<(i64, i64), Value>>,

    /// chat_id → полный объект чата (используется как known_chats + chats_info)
    pub chats_info: RwLock<HashMap<i64, Value>>,

    /// Буфер: chat_id → (msgs, first_seen)
    /// Сообщения пришедшие до регистрации чата (race condition при старте).
    pub pending: RwLock<HashMap<i64, (Vec<Value>, Instant)>>,

    /// file_id → local path
    pub file_paths: RwLock<HashMap<i64, String>>,
}

fn get_cutoff_timestamp() -> i64 {
    let now = Local::now();
    let mut cutoff = now
        .date_naive()
        .and_hms_opt(5, 0, 0)
        .unwrap()
        .and_local_timezone(Local)
        .unwrap();
    if now.hour() < 5 {
        cutoff = cutoff - chrono::Duration::try_days(1).unwrap_or(chrono::Duration::days(1));
    }
    cutoff.timestamp()
}

impl FeedCache {
    pub fn new() -> Self {
        Self {
            feed_channels: RwLock::new(HashSet::new()),
            folders: RwLock::new(HashMap::new()),
            messages: RwLock::new(BTreeMap::new()),
            chats_info: RwLock::new(HashMap::new()),
            pending: RwLock::new(HashMap::new()),
            file_paths: RwLock::new(HashMap::new()),
        }
    }

    pub fn update_file_path(&self, file_id: i64, path: String) {
        if !path.is_empty() {
            self.file_paths.write().unwrap().insert(file_id, path);
        }
    }

    pub fn get_file_path(&self, file_id: i64) -> Option<String> {
        self.file_paths.read().unwrap().get(&file_id).cloned()
    }

    /// Регистрирует чат и сохраняет его данные.
    /// `is_feed_channel = true` → посты этого канала идут в ленту.
    pub fn add_chat(&self, chat_id: i64, is_feed_channel: bool, chat_obj: Value) {
        self.chats_info.write().unwrap().insert(chat_id, chat_obj);

        if is_feed_channel {
            self.feed_channels.write().unwrap().insert(chat_id);
        }

        // Flush буфера pending
        let pending_msgs = {
            let mut pb = self.pending.write().unwrap();
            pb.remove(&chat_id)
                .map(|(msgs, _)| msgs)
                .unwrap_or_default()
        };
        for msg in pending_msgs {
            self.add_message(msg);
        }
    }

    /// Удаляет канал из whitelist ленты (при отписке).
    pub fn remove_feed_channel(&self, chat_id: i64) {
        self.feed_channels.write().unwrap().remove(&chat_id);
        self.messages
            .write()
            .unwrap()
            .retain(|_, msg| msg["chat_id"].as_i64().unwrap_or(0) != chat_id);
    }

    pub fn update_folder(&self, folder_id: i32, chat_ids: Vec<i64>) {
        self.folders.write().unwrap().insert(folder_id, chat_ids);
    }

    pub fn add_message(&self, msg: Value) {
        let chat_id = msg["chat_id"].as_i64().unwrap_or(0);

        // Чат ещё не зарегистрирован → буферизируем
        if !self.chats_info.read().unwrap().contains_key(&chat_id) {
            let now = Instant::now();
            let mut pb = self.pending.write().unwrap();
            // TTL-очистка stale pending за один write-lock
            pb.retain(|_, (_, ts)| now.duration_since(*ts).as_secs() <= PENDING_TTL_SECS);
            let entry = pb.entry(chat_id).or_insert_with(|| (Vec::new(), now));
            if entry.0.len() < MAX_PENDING_PER_CHAT {
                entry.0.push(msg);
            }
            return;
        }

        // Не в whitelist → выбрасываем
        if !self.feed_channels.read().unwrap().contains(&chat_id) {
            return;
        }

        // Фильтр по типу контента — пропускаем системные/служебные
        let type_str = msg["content"]["@type"].as_str().unwrap_or("");
        if ![
            "messageText",
            "messagePhoto",
            "messageVideo",
            "messageAnimation",
            "messageWebPage",
            "messageDocument",
            "messagePoll",
            "messageAudio",
            "messageVoiceNote",
            "messageVideoNote",
            "messageSticker",
        ]
        .contains(&type_str)
        {
            return;
        }

        // Filter out forwarded messages
        if !msg["forward_info"].is_null() {
            return;
        }

        let msg_id = msg["id"].as_i64().unwrap_or(0);
        let date = msg["date"].as_i64().unwrap_or(0);

        {
            let cutoff = get_cutoff_timestamp();
            let mut w = self.messages.write().unwrap();
            
            // Garbage collection of old messages
            while let Some((&(d, _), _)) = w.first_key_value() {
                if d < cutoff {
                    w.pop_first();
                } else {
                    break;
                }
            }

            if date >= cutoff {
                w.insert((date, msg_id), msg);
            }
            
            // Ограничение размера: удаляем самые старые
            while w.len() > MAX_MESSAGES {
                w.pop_first();
            }
        }
    }

    /// Обновляет содержимое существующего сообщения (при редактировании поста).
    pub fn update_message_content(&self, chat_id: i64, msg_id: i64, new_content: Value) {
        let mut w = self.messages.write().unwrap();
        // Линейный поиск по msg_id (date неизвестна, вызывается редко)
        for (_, msg) in w.iter_mut() {
            if msg["id"].as_i64().unwrap_or(0) == msg_id
                && msg["chat_id"].as_i64().unwrap_or(0) == chat_id
            {
                msg["content"] = new_content;
                break;
            }
        }
    }

    /// Вспомогательный: набор chat_id для фильтрации по папке.
    /// None → показывать все каналы (нет фильтра).
    fn folder_filter(&self, folder_id: Option<i32>) -> Option<HashSet<i64>> {
        folder_id.map(|f_id| {
            self.folders
                .read()
                .unwrap()
                .get(&f_id)
                .cloned()
                .unwrap_or_default()
                .into_iter()
                .collect()
        })
    }

    pub fn get_feed(
        &self,
        folder_id: Option<i32>,
        limit: usize,
        before_date: Option<i64>,
        before_msg_id: Option<i64>,
    ) -> Vec<Value> {
        let r_msgs = self.messages.read().unwrap();
        let r_chats = self.chats_info.read().unwrap();
        let valid_chats = self.folder_filter(folder_id);

        let mut results = Vec::new();
        let mut current_album_id: Option<String> = None;
        let mut current_album_group: Vec<Value> = Vec::new();

        // Пагинация: O(log N) поиск позиции через range
        let upper = (
            before_date.unwrap_or(i64::MAX),
            before_msg_id.unwrap_or(i64::MAX),
        );

        let cutoff = get_cutoff_timestamp();

        let iter: Box<dyn Iterator<Item = (&(i64, i64), &Value)>> = if before_date.is_some() {
            Box::new(r_msgs.range(..upper).rev())
        } else {
            Box::new(r_msgs.iter().rev())
        };

        for (&(date, _msg_id), msg) in iter {
            if date < cutoff {
                break; // Because we are iterating in descending order of date
            }

            let chat_id = msg["chat_id"].as_i64().unwrap_or(0);
            if let Some(ref valid) = valid_chats {
                if !valid.contains(&chat_id) {
                    continue;
                }
            }

            let album_id = msg["media_album_id"].as_str().unwrap_or("0");

            if album_id != "0" {
                let a_key = format!("{}_{}", chat_id, album_id);
                if let Some(ref cur_id) = current_album_id {
                    if *cur_id == a_key {
                        current_album_group.push(msg.clone());
                        continue;
                    } else if !current_album_group.is_empty() {
                        let chat_ref = r_chats.get(&chat_id);
                        results.push(Self::create_group_static(
                            &current_album_group,
                            true,
                            chat_ref,
                        ));
                        current_album_group.clear();
                    }
                }
                current_album_id = Some(a_key);
                current_album_group.push(msg.clone());
            } else {
                if !current_album_group.is_empty() {
                    let last_chat_id = current_album_group[0]["chat_id"].as_i64().unwrap_or(0);
                    let chat_ref = r_chats.get(&last_chat_id);
                    results.push(Self::create_group_static(
                        &current_album_group,
                        true,
                        chat_ref,
                    ));
                    current_album_group.clear();
                    current_album_id = None;
                }
                let chat_ref = r_chats.get(&chat_id);
                results.push(Self::create_group_static(
                    std::slice::from_ref(msg),
                    false,
                    chat_ref,
                ));
            }

            if results.len() >= limit {
                break;
            }
        }

        if !current_album_group.is_empty() && results.len() < limit {
            let last_chat_id = current_album_group[0]["chat_id"].as_i64().unwrap_or(0);
            let chat_ref = r_chats.get(&last_chat_id);
            results.push(Self::create_group_static(
                &current_album_group,
                true,
                chat_ref,
            ));
        }

        results
    }

    /// Возвращает посты строго НОВЕЕ since_date (инкрементальное обновление ленты).
    pub fn get_new_since(&self, folder_id: Option<i32>, since_date: i64) -> Vec<Value> {
        let r_msgs = self.messages.read().unwrap();
        let r_chats = self.chats_info.read().unwrap();
        let valid_chats = self.folder_filter(folder_id);

        let cutoff = get_cutoff_timestamp();
        let effective_since = if since_date < cutoff {
            cutoff
        } else {
            since_date + 1
        };
        let lower = (effective_since, i64::MIN);

        let mut results = Vec::new();
        let mut current_album_id: Option<String> = None;
        let mut current_album_group: Vec<Value> = Vec::new();

        for (&(_date, _msg_id), msg) in r_msgs.range(lower..).rev() {
            let chat_id = msg["chat_id"].as_i64().unwrap_or(0);
            if let Some(ref valid) = valid_chats {
                if !valid.contains(&chat_id) {
                    continue;
                }
            }

            let album_id = msg["media_album_id"].as_str().unwrap_or("0");

            if album_id != "0" {
                let a_key = format!("{}_{}", chat_id, album_id);
                if let Some(ref cur_id) = current_album_id {
                    if *cur_id == a_key {
                        current_album_group.push(msg.clone());
                        continue;
                    } else if !current_album_group.is_empty() {
                        let last_chat_id = current_album_group[0]["chat_id"].as_i64().unwrap_or(0);
                        let chat_ref = r_chats.get(&last_chat_id);
                        results.push(Self::create_group_static(
                            &current_album_group,
                            true,
                            chat_ref,
                        ));
                        current_album_group.clear();
                    }
                }
                current_album_id = Some(a_key);
                current_album_group.push(msg.clone());
            } else {
                if !current_album_group.is_empty() {
                    let last_chat_id = current_album_group[0]["chat_id"].as_i64().unwrap_or(0);
                    let chat_ref = r_chats.get(&last_chat_id);
                    results.push(Self::create_group_static(
                        &current_album_group,
                        true,
                        chat_ref,
                    ));
                    current_album_group.clear();
                    current_album_id = None;
                }
                let chat_ref = r_chats.get(&chat_id);
                results.push(Self::create_group_static(
                    std::slice::from_ref(msg),
                    false,
                    chat_ref,
                ));
            }
        }

        if !current_album_group.is_empty() {
            let last_chat_id = current_album_group[0]["chat_id"].as_i64().unwrap_or(0);
            let chat_ref = r_chats.get(&last_chat_id);
            results.push(Self::create_group_static(
                &current_album_group,
                true,
                chat_ref,
            ));
        }

        results
    }

    fn create_group_static(msgs: &[Value], is_album: bool, chat: Option<&Value>) -> Value {
        let mut main_post = msgs
            .iter()
            .find(|m| {
                let t = m["content"]["@type"].as_str().unwrap_or("");
                t == "messageText"
                    || m["content"]["caption"].is_object()
                    || m["content"]["text"].is_object()
            })
            .unwrap_or(&msgs[0])
            .clone();

        if let Some(c) = chat {
            main_post["_chat"] = c.clone();
        }

        serde_json::json!({
            "isAlbum": is_album,
            "posts": msgs,
            "mainPost": main_post,
            "channel": chat
        })
    }

    pub fn remove_messages(&self, chat_id: i64, message_ids: &[i64]) {
        let ids: HashSet<i64> = message_ids.iter().cloned().collect();
        self.messages.write().unwrap().retain(|_, msg| {
            let cid = msg["chat_id"].as_i64().unwrap_or(0);
            let mid = msg["id"].as_i64().unwrap_or(0);
            !(cid == chat_id && ids.contains(&mid))
        });
    }
}
