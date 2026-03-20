use serde_json::{json, Value};
use tokio::sync::mpsc;
use tauri::{AppHandle, Emitter};
use std::sync::{Arc, RwLock};
use std::sync::atomic::{AtomicBool, Ordering};
use std::collections::HashSet;
use crate::feed_cache::FeedCache;

/// Определяет кастомный тип чата по данным TDLib.
pub fn determine_custom_type(chat_type_obj: &Value) -> &'static str {
    match chat_type_obj["@type"].as_str().unwrap_or("") {
        "chatTypePrivate" => "private",
        "chatTypeBasicGroup" => "group",
        "chatTypeSupergroup" => {
            if chat_type_obj["is_channel"].as_bool().unwrap_or(false) {
                "channel"
            } else {
                "group"
            }
        }
        _ => "private", // chatTypeSecret и прочие → не добавляем в ленту
    }
}

/// Отправляет запрос в TDLib через канал (не await).
pub fn send_sync(tx: &mpsc::Sender<Value>, req: Value) {
    let tx = tx.clone();
    tokio::spawn(async move { let _ = tx.send(req).await; });
}

/// Запускает loadChats — правильный способ загрузить ВСЕ чаты.
/// TDLib идёт на сервер, синхронизирует, шлёт updateNewChat для каждого.
/// Повторяем при получении "ok" @extra="loadChats_main" пока не получим error (всё загружено).
pub fn trigger_load_chats(tx: &mpsc::Sender<Value>) {
    send_sync(
        tx,
        json!({
            "@type": "loadChats",
            "chat_list": { "@type": "chatListMain" },
            "limit": 100,
            "@extra": "loadChats_main"
        }),
    );
}

/// Контекст для обработки обновлений TDLib.
/// Вынесено в структуру чтобы избежать clippy::too_many_arguments.
pub struct UpdateContext<'a> {
    pub app: &'a AppHandle,
    pub tx: &'a mpsc::Sender<Value>,
    pub subscribed_ids: &'a Arc<RwLock<HashSet<i64>>>,
    pub my_user_id: &'a Arc<RwLock<Option<i64>>>,
    pub auth_ready: &'a Arc<RwLock<bool>>,
    pub api_id: i64,
    pub api_hash: &'a str,
    pub feed_cache: &'a Arc<FeedCache>,
    /// Флаг для батчинга feed_updated — таймер в lib.rs читает и сбрасывает каждые 500ms.
    pub feed_dirty: &'a Arc<AtomicBool>,
}

/// Обрабатывает одно обновление от TDLib.
pub fn handle_update(update: &Value, ctx: &UpdateContext) {
    let app = ctx.app;
    let tx = ctx.tx;
    let subscribed_ids = ctx.subscribed_ids;
    let my_user_id = ctx.my_user_id;
    let feed_cache = ctx.feed_cache;
    let auth_ready = ctx.auth_ready;
    let api_id = ctx.api_id;
    let api_hash = ctx.api_hash;
    let feed_dirty = ctx.feed_dirty;
    let type_str = match update["@type"].as_str() {
        Some(t) => t,
        None => return,
    };

    if type_str == "error" {
        let extra = update["@extra"].as_str().unwrap_or("");
        if extra == "loadChats_main" {
            println!("[TDLib] loadChats завершён — ждём 2с чтобы все updateChatPosition обработались...");
            let feed_cache_clone = feed_cache.clone();
            let tx_clone = tx.clone();
            tokio::spawn(async move {
                // Даём время TDLib доставить все updateChatPosition (race condition fix)
                tokio::time::sleep(tokio::time::Duration::from_millis(2000)).await;
                let channels: Vec<i64> = {
                    feed_cache_clone.feed_channels.read().unwrap().iter().cloned().collect()
                };
                println!("[TDLib] Загружаем историю для {} каналов", channels.len());
                for chat_id in channels {
                    let _ = tx_clone.send(json!({
                        "@type": "getChatHistory",
                        "chat_id": chat_id,
                        "from_message_id": 0,
                        "offset": 0,
                        "limit": 100,
                        "only_local": false
                    })).await;
                    tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
                }
            });
        } else {
            println!("[TDLib] ERROR: {}", update);
        }
        return;
    }

    match type_str {
        "updateAuthorizationState" => {
            let state = match update["authorization_state"]["@type"].as_str() {
                Some(s) => s,
                None => return,
            };
            println!("[TDLib] Auth: {}", state);
            match state {
                "authorizationStateWaitTdlibParameters" => {
                    let home =
                        std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
                    let db_dir =
                        format!("{}/Library/Application Support/TG-Feed-v3", home);
                    app.emit("auth_update", json!({ "state": "wait_params" })).ok();
                    send_sync(
                        tx,
                        json!({
                            "@type": "setTdlibParameters",
                            "database_directory": db_dir,
                            "use_message_database": true,
                            "use_secret_chats": true,
                            "api_id": api_id,
                            "api_hash": api_hash,
                            "system_language_code": "en",
                            "device_model": "Desktop",
                            "system_version": "Unknown",
                            "application_version": "3.0",
                            "enable_storage_optimizer": true
                        }),
                    );
                }
                "authorizationStateWaitEncryptionKey" => {
                    send_sync(
                        tx,
                        json!({ "@type": "checkDatabaseEncryptionKey", "encryption_key": "" }),
                    );
                }
                "authorizationStateWaitPhoneNumber" => {
                    app.emit("auth_update", json!({ "state": "wait_phone" })).ok();
                }
                "authorizationStateWaitCode" => {
                    app.emit("auth_update", json!({ "state": "wait_code" })).ok();
                }
                "authorizationStateWaitPassword" => {
                    app.emit("auth_update", json!({ "state": "wait_password" })).ok();
                }
                "authorizationStateReady" => {
                    if let Ok(mut r) = auth_ready.write() {
                        *r = true;
                    }
                    app.emit("auth_update", json!({ "state": "ready" })).ok();
                    println!("[TDLib] Авторизация успешна. Запускаем loadChats loop...");
                    send_sync(tx, json!({ "@type": "getMe", "@extra": "getMe" }));
                    // loadChats (не getChats!) — TDLib идёт на сервер, синхронизирует список
                    trigger_load_chats(tx);
                }
                "authorizationStateLoggingOut" | "authorizationStateClosed" => {
                    app.emit("auth_update", json!({ "state": "logged_out" })).ok();
                }
                _ => {}
            }
        }

        // Direct responses from getAuthorizationState
        "authorizationStateWaitTdlibParameters" => {
            app.emit("auth_update", json!({ "state": "wait_params" })).ok();
        }
        "authorizationStateWaitPhoneNumber" => {
            app.emit("auth_update", json!({ "state": "wait_phone" })).ok();
        }
        "authorizationStateWaitCode" => {
            app.emit("auth_update", json!({ "state": "wait_code" })).ok();
        }
        "authorizationStateWaitPassword" => {
            app.emit("auth_update", json!({ "state": "wait_password" })).ok();
        }
        "authorizationStateReady" => {
            if let Ok(mut r) = auth_ready.write() {
                *r = true;
            }
            app.emit("auth_update", json!({ "state": "ready" })).ok();
            send_sync(tx, json!({ "@type": "getMe", "@extra": "getMe" }));
        }
        "authorizationStateLoggingOut" | "authorizationStateClosed" => {
            app.emit("auth_update", json!({ "state": "logged_out" })).ok();
        }

        // ok — ответ на loadChats: порция загружена, запускаем следующую
        "ok" => {
            let extra = update["@extra"].as_str().unwrap_or("");
            if extra == "loadChats_main" {
                // Ещё одна порция — продолжаем пока не получим error
                trigger_load_chats(tx);
            }
            app.emit("tdlib_event", update.clone()).ok();
        }

        // updateNewChat — TDLib шлёт при loadChats и при появлении нового чата
        // ВСЕ чаты в chatListMain считаются подписанными
        "updateNewChat" => {
            if let Some(chat) = update.get("chat") {
                let chat_id = chat["id"].as_i64().unwrap_or(0);
                let custom_type = determine_custom_type(&chat["type"]);
                let mut chat_data = chat.clone();
                chat_data["_customType"] = Value::String(custom_type.to_string());

                // Проверяем: реально ли пользователь подписан на этот чат
                // (есть хотя бы одна позиция в chatListMain с ненулевым order)
                let in_main_list = chat["positions"].as_array()
                    .map(|positions| positions.iter().any(|pos| {
                        pos["list"]["@type"].as_str().unwrap_or("") == "chatListMain"
                        && pos["order"].as_str().unwrap_or("0") != "0"
                    }))
                    .unwrap_or(false);

                let is_feed_channel = in_main_list && custom_type == "channel";

                if in_main_list {
                    if let Ok(mut ids) = subscribed_ids.write() {
                        ids.insert(chat_id);
                    }
                }
                feed_cache.add_chat(chat_id, is_feed_channel, chat_data.clone());

                println!(
                    "[TDLib] updateNewChat: {} [{}] main={} feed={}",
                    chat["title"].as_str().unwrap_or("?"),
                    custom_type,
                    in_main_list,
                    is_feed_channel
                );

                // Отправляем на фронт только подписанные чаты
                if in_main_list {
                    let mut payload = update.clone();
                    payload["chat"] = chat_data;
                    app.emit("tdlib_event", payload).ok();
                }
            }
        }

        // updateChatPosition — ключевое событие синхронизации подписок
        // Когда ты отписался/подписался с другого клиента — TDLib шлёт это событие
        "updateChatPosition" => {
            let chat_id = update["chat_id"].as_i64().unwrap_or(0);
            let list_type = update["position"]["list"]["@type"].as_str().unwrap_or("");
            let order = update["position"]["order"].as_str().unwrap_or("0");

            if list_type == "chatListMain" {
                if order == "0" {
                    // order=0 → чат УБРАН из основного списка (отписка)
                    println!("[TDLib] updateChatPosition: {} УБРАН (order=0)", chat_id);
                    feed_cache.remove_feed_channel(chat_id);
                    if let Ok(mut ids) = subscribed_ids.write() {
                        ids.remove(&chat_id);
                    }
                    app.emit("tdlib_event", json!({
                        "@type": "chatRemovedFromFeed",
                        "chat_id": chat_id
                    })).ok();
                } else {
                    // order!=0 → чат ДОБАВЛЕН в основной список (подписка)
                    println!("[TDLib] updateChatPosition: {} ДОБАВЛЕН", chat_id);
                    if let Ok(mut ids) = subscribed_ids.write() {
                        ids.insert(chat_id);
                    }
                    // Запрашиваем детали чтобы знать тип и title
                    send_sync(tx, json!({ "@type": "getChat", "chat_id": chat_id }));
                }
            }

            app.emit("tdlib_event", update.clone()).ok();
        }

        // getChat ответ — single chat lookup (при updateChatPosition или sync_chats)
        "chat" => {
            let chat_id = update["id"].as_i64().unwrap_or(0);
            let custom_type = determine_custom_type(&update["type"]);
            let mut chat_data = update.clone();
            chat_data["_customType"] = Value::String(custom_type.to_string());

            let is_subscribed = subscribed_ids
                .read()
                .map(|w| w.contains(&chat_id))
                .unwrap_or(false);

            let is_feed_channel = is_subscribed && custom_type == "channel";

            println!(
                "[TDLib] chat: {} [{}] subscribed={} feed={}",
                update["title"].as_str().unwrap_or("?"),
                custom_type,
                is_subscribed,
                is_feed_channel
            );

            feed_cache.add_chat(chat_id, is_feed_channel, chat_data.clone());

            if is_subscribed {
                app.emit(
                    "tdlib_event",
                    json!({ "@type": "updateNewChat", "chat": chat_data }),
                ).ok();
            }

            // Private-чат созданный через createPrivateChat
            if !is_subscribed && custom_type == "private" {
                if let Ok(mut whitelist) = subscribed_ids.write() {
                    whitelist.insert(chat_id);
                }
                app.emit(
                    "tdlib_event",
                    json!({ "@type": "updateNewChat", "chat": chat_data }),
                ).ok();
            }
        }

        // chats — ответ getChats (используется в sync_chats команде)
        "chats" => {
            let extra = update["@extra"].as_str().unwrap_or("");
            if let Some(chat_ids) = update["chat_ids"].as_array() {
                let ids: Vec<i64> =
                    chat_ids.iter().filter_map(|id| id.as_i64()).collect();
                println!("[TDLib] getChats (sync): {} чатов, extra={}", ids.len(), extra);

                // При полной синхронизации — обнуляем старые данные
                if extra == "sync_chats" {
                    if let Ok(mut whitelist) = subscribed_ids.write() {
                        whitelist.clear();
                        for id in &ids {
                            whitelist.insert(*id);
                        }
                    }
                    // Сбрасываем feed_channels — они будут заново заполнены через getChat-ответы
                    feed_cache.feed_channels.write().unwrap().clear();
                } else if let Ok(mut whitelist) = subscribed_ids.write() {
                    for id in &ids {
                        whitelist.insert(*id);
                    }
                }

                let tx_clone = tx.clone();
                tokio::spawn(async move {
                    for chat_id in ids {
                        let _ = tx_clone
                            .send(json!({ "@type": "getChat", "chat_id": chat_id }))
                            .await;
                        tokio::time::sleep(tokio::time::Duration::from_millis(20)).await;
                    }
                });
            }
        }

        "updateNewMessage" => {
            let chat_id = update["message"]["chat_id"].as_i64().unwrap_or(0);

            if let Some(msg) = update.get("message") {
                feed_cache.add_message(msg.clone());
                // Батчинг: ставим флаг, таймер в lib.rs соберёт и эмитнет один feed_updated через 500ms
                feed_dirty.store(true, Ordering::Relaxed);
            }

            if subscribed_ids
                .read()
                .map(|w| w.contains(&chat_id))
                .unwrap_or(false)
            {
                app.emit("tdlib_event", update.clone()).ok();
            }
        }

        "updateMessageContent" => {
            // Пост отредактирован — обновляем содержимое в кеше и сигнализируем обновление
            let chat_id = update["chat_id"].as_i64().unwrap_or(0);
            let msg_id = update["message_id"].as_i64().unwrap_or(0);
            if let Some(new_content) = update.get("new_content") {
                feed_cache.update_message_content(chat_id, msg_id, new_content.clone());
                feed_dirty.store(true, Ordering::Relaxed);
            }
            app.emit("tdlib_event", update.clone()).ok();
        }

        "user" => {
            let user_id = update["id"].as_i64().unwrap_or(0);
            let first = update["first_name"].as_str().unwrap_or("");
            let last = update["last_name"].as_str().unwrap_or("");
            let name = format!("{} {}", first, last).trim().to_string();

            let is_me = {
                let uid = my_user_id.read().unwrap();
                match *uid {
                    Some(id) => id == user_id,
                    None => true,
                }
            };

            if is_me {
                if let Ok(mut uid) = my_user_id.write() {
                    *uid = Some(user_id);
                }
                println!("[TDLib] My profile: {} (id={})", name, user_id);
                let mut profile_data = update.clone();
                profile_data["@type"] = Value::String("myProfile".to_string());
                app.emit("tdlib_event", profile_data).ok();
            } else {
                app.emit("tdlib_event", update.clone()).ok();
            }
        }

        "messages" => {
            if let Some(messages) = update["messages"].as_array() {
                let mut added = false;
                for msg in messages {
                    feed_cache.add_message(msg.clone());
                    added = true;
                }
                if added {
                    feed_dirty.store(true, Ordering::Relaxed);
                }
            }
            app.emit("tdlib_event", update.clone()).ok();
        }

        "updateFile" => {
            let f = &update["file"];
            let file_id = f["id"].as_i64().unwrap_or(0);
            let path = f["local"]["path"].as_str().unwrap_or("");
            let done = f["local"]["is_downloading_completed"].as_bool().unwrap_or(false);
            if done && file_id != 0 && !path.is_empty() {
                feed_cache.update_file_path(file_id, path.to_string());
            }
            app.emit("tdlib_event", update.clone()).ok();
        }

        "chatFolder" => {
            let mut data = update.clone();
            if let Some(extra) = update["@extra"].as_str() {
                if let Some(id_str) = extra.strip_prefix("folder_") {
                    if let Ok(folder_id) = id_str.parse::<i32>() {
                        data["_folder_id"] = Value::Number(folder_id.into());

                        if let Some(included) = update["included_chat_ids"].as_array() {
                            let mapped_ids: Vec<i64> = included.iter().filter_map(|v| v.as_i64()).collect();
                            feed_cache.update_folder(folder_id, mapped_ids);
                        }
                    }
                }
            }
            app.emit("tdlib_event", data).ok();
        }

        "updateChatFolders" => {
            app.emit("tdlib_event", update.clone()).ok();
        }

        _ => {
            app.emit("tdlib_event", update.clone()).ok();
        }
    }
}
