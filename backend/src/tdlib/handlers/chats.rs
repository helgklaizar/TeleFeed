use serde_json::{json, Value};
use tauri::Emitter;

use super::common::{determine_custom_type, send_sync, trigger_load_chats, UpdateContext};

pub fn handle_error(update: &Value, ctx: &UpdateContext) {
    let extra = update["@extra"].as_str().unwrap_or("");
    if extra == "loadChats_main" {
        println!(
            "[TDLib] loadChats завершён — ждём 2с чтобы все updateChatPosition обработались..."
        );
        let feed_cache_clone = ctx.feed_cache.clone();
        let tx_clone = ctx.tx.clone();
        tokio::spawn(async move {
            // Даём время TDLib доставить все updateChatPosition (race condition fix)
            tokio::time::sleep(tokio::time::Duration::from_millis(2000)).await;
            let channels: Vec<i64> = {
                feed_cache_clone
                    .feed_channels
                    .read()
                    .unwrap()
                    .iter()
                    .cloned()
                    .collect()
            };
            println!("[TDLib] Загружаем историю для {} каналов", channels.len());
            for chat_id in channels {
                let _ = tx_clone
                    .send(json!({
                        "@type": "getChatHistory",
                        "chat_id": chat_id,
                        "from_message_id": 0,
                        "offset": 0,
                        "limit": 50,
                        "only_local": true
                    }))
                    .await;
                tokio::time::sleep(tokio::time::Duration::from_millis(30)).await;
            }
        });
    } else {
        println!("[TDLib] ERROR: {}", update);
        let _ = ctx.app.emit("auth_error", update.clone());
    }
}

pub fn handle_ok(update: &Value, ctx: &UpdateContext) {
    let extra = update["@extra"].as_str().unwrap_or("");
    if extra == "loadChats_main" {
        // Ещё одна порция — продолжаем пока не получим error
        trigger_load_chats(ctx.tx);
    }
    let _ = ctx.app.emit("tdlib_event", update.clone());
}

pub fn handle_chat_event(type_str: &str, update: &Value, ctx: &UpdateContext) {
    match type_str {
        // updateNewChat — TDLib шлёт при loadChats и при появлении нового чата
        "updateNewChat" => {
            if let Some(chat) = update.get("chat") {
                let chat_id = chat["id"].as_i64().unwrap_or(0);
                let custom_type = determine_custom_type(&chat["type"]);
                let mut chat_data = chat.clone();
                chat_data["_customType"] = Value::String(custom_type.to_string());

                // Проверяем: реально ли пользователь подписан на этот чат
                let in_main_list = chat["positions"]
                    .as_array()
                    .map(|positions| {
                        positions.iter().any(|pos| {
                            pos["list"]["@type"].as_str().unwrap_or("") == "chatListMain"
                                && pos["order"].as_str().unwrap_or("0") != "0"
                        })
                    })
                    .unwrap_or(false);

                let is_feed_channel = in_main_list && custom_type == "channel";

                if in_main_list {
                    if let Ok(mut ids) = ctx.subscribed_ids.write() {
                        ids.insert(chat_id);
                    }
                }
                ctx.feed_cache
                    .add_chat(chat_id, is_feed_channel, chat_data.clone());

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
                    let _ = ctx.app.emit("tdlib_event", payload);
                }
            }
        }

        // updateChatPosition — ключевое событие синхронизации подписок
        "updateChatPosition" => {
            let chat_id = update["chat_id"].as_i64().unwrap_or(0);
            let list_type = update["position"]["list"]["@type"].as_str().unwrap_or("");
            let order = update["position"]["order"].as_str().unwrap_or("0");

            if list_type == "chatListMain" {
                if order == "0" {
                    println!("[TDLib] updateChatPosition: {} УБРАН (order=0)", chat_id);
                    ctx.feed_cache.remove_feed_channel(chat_id);
                    if let Ok(mut ids) = ctx.subscribed_ids.write() {
                        ids.remove(&chat_id);
                    }
                    let _ = ctx.app.emit(
                        "tdlib_event",
                        json!({
                            "@type": "chatRemovedFromFeed",
                            "chat_id": chat_id
                        }),
                    );
                } else {
                    println!("[TDLib] updateChatPosition: {} ДОБАВЛЕН", chat_id);
                    if let Ok(mut ids) = ctx.subscribed_ids.write() {
                        ids.insert(chat_id);
                    }
                    send_sync(ctx.tx, json!({ "@type": "getChat", "chat_id": chat_id }));
                }
            }
            let _ = ctx.app.emit("tdlib_event", update.clone());
        }

        // getChat ответ — single chat lookup
        "chat" => {
            let chat_id = update["id"].as_i64().unwrap_or(0);
            let custom_type = determine_custom_type(&update["type"]);
            let mut chat_data = update.clone();
            chat_data["_customType"] = Value::String(custom_type.to_string());

            let is_subscribed = ctx
                .subscribed_ids
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

            ctx.feed_cache
                .add_chat(chat_id, is_feed_channel, chat_data.clone());

            if is_subscribed {
                let _ = ctx.app.emit(
                    "tdlib_event",
                    json!({ "@type": "updateNewChat", "chat": chat_data }),
                );
            }

            // Private-чат созданный через createPrivateChat
            if !is_subscribed && custom_type == "private" {
                if let Ok(mut whitelist) = ctx.subscribed_ids.write() {
                    whitelist.insert(chat_id);
                }
                let _ = ctx.app.emit(
                    "tdlib_event",
                    json!({ "@type": "updateNewChat", "chat": chat_data }),
                );
            }
        }

        "chats" => {
            let extra = update["@extra"].as_str().unwrap_or("");
            if let Some(chat_ids) = update["chat_ids"].as_array() {
                let ids: Vec<i64> = chat_ids.iter().filter_map(|id| id.as_i64()).collect();
                println!(
                    "[TDLib] getChats (sync): {} чатов, extra={}",
                    ids.len(),
                    extra
                );

                if extra == "sync_chats" {
                    if let Ok(mut whitelist) = ctx.subscribed_ids.write() {
                        whitelist.clear();
                        for id in &ids {
                            whitelist.insert(*id);
                        }
                    }
                    ctx.feed_cache.feed_channels.write().unwrap().clear();
                } else if let Ok(mut whitelist) = ctx.subscribed_ids.write() {
                    for id in &ids {
                        whitelist.insert(*id);
                    }
                }

                let tx_clone = ctx.tx.clone();
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

        "chatFolder" => {
            let mut data = update.clone();
            if let Some(extra) = update["@extra"].as_str() {
                if let Some(id_str) = extra.strip_prefix("folder_") {
                    if let Ok(folder_id) = id_str.parse::<i32>() {
                        data["_folder_id"] = Value::Number(folder_id.into());
                        if let Some(included) = update["included_chat_ids"].as_array() {
                            let mapped_ids: Vec<i64> =
                                included.iter().filter_map(|v| v.as_i64()).collect();
                            ctx.feed_cache.update_folder(folder_id, mapped_ids);
                        }
                    }
                }
            }
            let _ = ctx.app.emit("tdlib_event", data);
        }

        "updateChatFolders" => {
            let _ = ctx.app.emit("tdlib_event", update.clone());
        }

        "user" => {
            let user_id = update["id"].as_i64().unwrap_or(0);
            let first = update["first_name"].as_str().unwrap_or("");
            let last = update["last_name"].as_str().unwrap_or("");
            let name = format!("{} {}", first, last).trim().to_string();

            let is_me = {
                let uid = ctx.my_user_id.read().unwrap();
                match *uid {
                    Some(id) => id == user_id,
                    None => true,
                }
            };

            if is_me {
                if let Ok(mut uid) = ctx.my_user_id.write() {
                    *uid = Some(user_id);
                }
                println!("[TDLib] My profile: {} (id={})", name, user_id);
                let mut profile_data = update.clone();
                profile_data["@type"] = Value::String("myProfile".to_string());
                let _ = ctx.app.emit("tdlib_event", profile_data);
            } else {
                let _ = ctx.app.emit("tdlib_event", update.clone());
            }
        }

        _ => {}
    }
}
