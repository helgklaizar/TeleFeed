use serde_json::{json, Value};
use std::sync::atomic::Ordering;
use tauri::Emitter;

use super::common::{send_sync, trigger_load_chats, UpdateContext};

pub fn handle_auth(update: &Value, ctx: &UpdateContext) {
    let state = match update["authorization_state"]["@type"].as_str() {
        Some(s) => s,
        None => return,
    };
    println!("[TDLib] Auth: {}", state);
    match state {
        "authorizationStateWaitTdlibParameters" => {
            let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
            let db_dir = format!("{}/Library/Application Support/TeleFeed-v3", home);
            ctx.app.emit("auth_update", json!({ "state": "wait_params" })).ok();
            send_sync(
                ctx.tx,
                json!({
                    "@type": "setTdlibParameters",
                    "database_directory": db_dir,
                    "use_message_database": true,
                    "use_secret_chats": true,
                    "api_id": ctx.api_id,
                    "api_hash": ctx.api_hash,
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
                ctx.tx,
                json!({ "@type": "checkDatabaseEncryptionKey", "encryption_key": "" }),
            );
        }
        "authorizationStateWaitPhoneNumber" => {
            ctx.app.emit("auth_update", json!({ "state": "wait_phone" })).ok();
        }
        "authorizationStateWaitCode" => {
            ctx.app.emit("auth_update", json!({ "state": "wait_code" })).ok();
        }
        "authorizationStateWaitPassword" => {
            ctx.app.emit("auth_update", json!({ "state": "wait_password" })).ok();
        }
        "authorizationStateReady" => {
            if let Ok(mut r) = ctx.auth_ready.write() {
                *r = true;
            }
            ctx.app.emit("auth_update", json!({ "state": "ready" })).ok();
            println!("[TDLib] Авторизация успешна. Запускаем loadChats loop...");
            send_sync(ctx.tx, json!({ "@type": "getMe", "@extra": "getMe" }));
            // loadChats (не getChats!) — TDLib идёт на сервер, синхронизирует список
            trigger_load_chats(ctx.tx);
        }
        "authorizationStateLoggingOut" | "authorizationStateClosed" => {
            ctx.app.emit("auth_update", json!({ "state": "logged_out" })).ok();
            if state == "authorizationStateClosed" {
                println!("[TDLib] authorizationStateClosed получено. Останавливаем потоки.");
                ctx.running.store(false, Ordering::Relaxed);
            }
        }
        _ => {}
    }
}
