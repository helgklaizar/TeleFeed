use tokio::sync::Mutex;
use tauri::{AppHandle, Emitter, State};
use serde_json::{json, Value};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

mod tdlib;
mod handlers;
mod feed_cache;
mod mobile_server;

use tdlib::TdlibManager;
use feed_cache::FeedCache;

struct AppState {
    client: Mutex<Option<TdlibManager>>,
    feed_cache: Arc<FeedCache>,
    /// Флаг: пришли новые посты — нужно уведомить фронтенд.
    /// Опрашивается каждые 500ms и сбрасывается.
    feed_dirty: Arc<AtomicBool>,
}

// ── Init ──

#[tauri::command]
async fn init_tdlib(api_id: i64, api_hash: String, state: State<'_, AppState>, app: AppHandle) -> Result<(), String> {
    let mut client = state.client.lock().await;
    if client.is_some() {
        return Ok(());
    }
    let manager = TdlibManager::new(app, api_id, api_hash, state.feed_cache.clone(), state.feed_dirty.clone());
    *client = Some(manager);
    Ok(())
}

// ── Auth ──

#[tauri::command]
async fn submit_phone(phone: String, state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({ "@type": "setAuthenticationPhoneNumber", "phone_number": phone })).await;
    }
    Ok(())
}

#[tauri::command]
async fn submit_code(code: String, state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({ "@type": "checkAuthenticationCode", "code": code })).await;
    }
    Ok(())
}

#[tauri::command]
async fn submit_password(password: String, state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({ "@type": "checkAuthenticationPassword", "password": password })).await;
    }
    Ok(())
}

// ── Feed ──

#[tauri::command]
async fn mark_as_read(chat_id: i64, message_ids: Vec<i64>, state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({
            "@type": "viewMessages",
            "chat_id": chat_id,
            "message_ids": message_ids,
            "force_read": true
        })).await;
    }
    Ok(())
}

#[tauri::command]
async fn forward_to_stena(stena_chat_id: i64, from_chat_id: i64, message_ids: Vec<i64>, state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({
            "@type": "forwardMessages",
            "chat_id": stena_chat_id,
            "from_chat_id": from_chat_id,
            "message_ids": message_ids
        })).await;
    }
    Ok(())
}

#[tauri::command]
async fn download_file(file_id: i64, state: State<'_, AppState>) -> Result<Value, String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({
            "@type": "downloadFile",
            "file_id": file_id,
            "priority": 1,
            "offset": 0,
            "limit": 0,
            "synchronous": false
        })).await;
    }
    Ok(json!({ "success": true }))
}

#[tauri::command]
async fn delete_local_file(file_id: i64, state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({ "@type": "deleteFile", "file_id": file_id })).await;
    }
    Ok(())
}

#[tauri::command]
async fn load_more_history(chat_id: i64, from_message_id: i64, state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({
            "@type": "getChatHistory",
            "chat_id": chat_id,
            "from_message_id": from_message_id,
            "offset": 0,
            "limit": 200,
            "only_local": false
        })).await;
    }
    Ok(())
}

#[tauri::command]
async fn get_chat_info(chat_id: i64, state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({ "@type": "getChat", "chat_id": chat_id })).await;
    }
    Ok(())
}

#[tauri::command]
async fn send_reply(chat_id: i64, reply_to_id: i64, text: String, state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({
            "@type": "sendMessage",
            "chat_id": chat_id,
            "reply_to": { "@type": "inputMessageReplyToMessage", "message_id": reply_to_id },
            "input_message_content": {
                "@type": "inputMessageText",
                "text": { "@type": "formattedText", "text": text }
            }
        })).await;
    }
    Ok(())
}

#[tauri::command]
async fn get_chat_folder(folder_id: i64, state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({
            "@type": "getChatFolder",
            "chat_folder_id": folder_id,
            "@extra": format!("folder_{}", folder_id)
        })).await;
    }
    Ok(())
}

#[tauri::command]
async fn get_channel_feed(folder_id: Option<i32>, limit: usize, before_date: Option<i64>, before_msg_id: Option<i64>, state: State<'_, AppState>) -> Result<Vec<Value>, String> {
    Ok(state.feed_cache.get_feed(folder_id, limit, before_date, before_msg_id))
}

#[tauri::command]
async fn get_new_feed_since(folder_id: Option<i32>, since_date: i64, state: State<'_, AppState>) -> Result<Vec<Value>, String> {
    Ok(state.feed_cache.get_new_since(folder_id, since_date))
}

#[tauri::command]
async fn fetch_more_feed_history(before_date: i64, state: State<'_, AppState>) -> Result<(), String> {
    // Собираем данные синхронно (без await) под блокировкой
    let requests: Vec<(i64, i64)> = {
        let channels: Vec<i64> = state.feed_cache.feed_channels.read().unwrap()
            .iter().cloned().collect();
        let messages_snap = state.feed_cache.messages.read().unwrap();

        channels.into_iter().map(|chat_id| {
            // Ищем самое старое сообщение этого канала в кэше (старше before_date)
            let oldest_id = messages_snap.iter()
                .filter(|(_, msg)| {
                    msg["chat_id"].as_i64().unwrap_or(0) == chat_id
                    && msg["date"].as_i64().unwrap_or(0) <= before_date
                })
                .map(|(_, msg)| msg["id"].as_i64().unwrap_or(0))
                .min()
                .unwrap_or(0);
            (chat_id, oldest_id)
        }).collect()
    }; // <- все блокировки сброшены здесь

    // Теперь async без lock
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        for (chat_id, from_id) in requests {
            c.send(json!({
                "@type": "getChatHistory",
                "chat_id": chat_id,
                "from_message_id": from_id,
                "offset": 0,
                "limit": 50,
                "only_local": true
            })).await;
        }
    }
    Ok(())
}

#[tauri::command]
async fn optimize_storage(state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({
            "@type": "optimizeStorage",
            "size_limit": 0,
            "ttl": 0,
            "count_limit": 0,
            "immunity_delay": 0,
            "file_types": [],
            "chat_ids": [],
            "exclude_chat_ids": [],
            "return_deleted_file_statistics": false,
            "chat_limit": 0
        })).await;
    }
    Ok(())
}

#[tauri::command]
async fn get_contacts(state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({ "@type": "getContacts", "@extra": "getContacts" })).await;
    }
    Ok(())
}


#[tauri::command]
async fn get_user(user_id: i64, state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({ "@type": "getUser", "user_id": user_id })).await;
    }
    Ok(())
}


#[tauri::command]
async fn create_private_chat(user_id: i64, state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({ "@type": "createPrivateChat", "user_id": user_id, "force": false })).await;
    }
    Ok(())
}

#[tauri::command]
async fn leave_chat(chat_id: i64, state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({ "@type": "leaveChat", "chat_id": chat_id })).await;
    }
    // Немедленно убираем канал из ленты
    state.feed_cache.remove_feed_channel(chat_id);
    Ok(())
}

/// Синхронизирует актуальный список подписок с TDLib.
/// Запрашивает getChats (chatListMain, limit=500) → TDLib вернёт
/// объект "chats" с реальными ID, затем для каждого дополнительно
/// запрашиваем getChat чтобы обновить данные.
#[tauri::command]
async fn sync_chats(state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({
            "@type": "getChats",
            "chat_list": { "@type": "chatListMain" },
            "limit": 500,
            "@extra": "sync_chats"
        })).await;
    }
    Ok(())
}

// ── Local Updater ──

#[tauri::command]
async fn check_local_update(app_handle: tauri::AppHandle) -> Result<bool, String> {
    let app_version = app_handle.package_info().version.to_string();

    // CARGO_MANIFEST_DIR → src-tauri/, поднимаемся на уровень выше в tauri/
    let src_package_path = format!("{}/../../tauri/package.json", env!("CARGO_MANIFEST_DIR"));
    if let Ok(content) = std::fs::read_to_string(&src_package_path) {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
            if let Some(src_version) = json["version"].as_str() {
                // Return true if the version in the repo differs from the running app version.
                return Ok(src_version != app_version);
            }
        }
    }
    Ok(false)
}

#[tauri::command]
async fn apply_local_update() -> Result<(), String> {
    use std::process::Command;

    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let src_dir = format!("{}/../../tauri", manifest_dir);
    let updater_script = format!("{}/src-tauri/local_updater.sh", src_dir);
    let dest_app = "/Applications/TG-Feed.app";
    let bundle_path = format!("{}/src-tauri/target/release/bundle/macos/TG-Feed.app", src_dir);

    let _ = Command::new("chmod")
        .arg("+x")
        .arg(&updater_script)
        .status();

    let _ = Command::new("sh")
        .arg("-c")
        .arg(format!("nohup sh '{}' '{}' '{}' '{}' > updater.log 2>&1 &", updater_script, src_dir, dest_app, bundle_path))
        .spawn()
        .map_err(|e| format!("Failed to start updater: {}", e))?;

    std::process::exit(0);
}



// ── Entry ──

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let feed_dirty: Arc<AtomicBool> = Arc::new(AtomicBool::new(false));
    let feed_dirty_for_setup = feed_dirty.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .manage(AppState {
            client: Mutex::new(None),
            feed_cache: Arc::new(FeedCache::new()),
            feed_dirty,
        })
        .setup(move |app| {
            // Мобильный HTTP-сервер
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                mobile_server::start_mobile_server(app_handle).await;
            });

            // Батчинг feed_updated: опрашиваем флаг каждые 500ms вместо emit-спама
            let app_handle2 = app.handle().clone();
            let dirty = feed_dirty_for_setup;
            tauri::async_runtime::spawn(async move {
                loop {
                    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
                    if dirty.swap(false, Ordering::Relaxed) {
                        app_handle2.emit("feed_updated", json!({})).ok();
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            init_tdlib,
            submit_phone,
            submit_code,
            submit_password,
            mark_as_read,
            forward_to_stena,
            download_file,
            delete_local_file,
            load_more_history,
            get_chat_info,
            send_reply,
            get_chat_folder,
            get_channel_feed,
            get_new_feed_since,
            fetch_more_feed_history,
            optimize_storage,
            get_contacts,
            create_private_chat,
            get_user,
            leave_chat,
            check_local_update,
            apply_local_update,
            sync_chats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

