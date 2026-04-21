use serde_json::Value;
use std::sync::atomic::Ordering;
use tauri::Emitter;

use super::common::UpdateContext;

pub fn handle_feed_event(type_str: &str, update: &Value, ctx: &UpdateContext) {
    match type_str {
        "updateNewMessage" => {
            let chat_id = update["message"]["chat_id"].as_i64().unwrap_or(0);

            if let Some(msg) = update.get("message") {
                ctx.feed_cache.add_message(msg.clone());
                ctx.feed_notify.notify_waiters();
            }

            if ctx
                .subscribed_ids
                .read()
                .map(|w| w.contains(&chat_id))
                .unwrap_or(false)
            {
                let _ = ctx.app.emit("tdlib_event", update.clone());
            }
        }

        "updateMessageContent" => {
            // Пост отредактирован — обновляем содержимое в кеше и сигнализируем обновление
            let chat_id = update["chat_id"].as_i64().unwrap_or(0);
            let msg_id = update["message_id"].as_i64().unwrap_or(0);
            if let Some(new_content) = update.get("new_content") {
                ctx.feed_cache
                    .update_message_content(chat_id, msg_id, new_content.clone());
                ctx.feed_notify.notify_waiters();
            }
            let _ = ctx.app.emit("tdlib_event", update.clone());
        }

        "messages" => {
            if let Some(messages) = update["messages"].as_array() {
                let mut added = false;
                for msg in messages {
                    ctx.feed_cache.add_message(msg.clone());
                    added = true;
                }
                if added {
                    ctx.feed_notify.notify_waiters();
                }
            }
            let _ = ctx.app.emit("tdlib_event", update.clone());
        }

        "updateFile" => {
            let f = &update["file"];
            let file_id = f["id"].as_i64().unwrap_or(0);
            let path = f["local"]["path"].as_str().unwrap_or("");
            let done = f["local"]["is_downloading_completed"]
                .as_bool()
                .unwrap_or(false);
            if done && file_id != 0 && !path.is_empty() {
                ctx.feed_cache.update_file_path(file_id, path.to_string());
            }
            let _ = ctx.app.emit("tdlib_event", update.clone());
        }

        _ => {}
    }
}
