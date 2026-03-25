use tokio::sync::Mutex;
use tauri::Emitter;
use serde_json::json;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

mod tdlib;
mod feed_cache;
mod mobile_server;
mod ipc;

use tdlib::TdlibManager;
use feed_cache::FeedCache;

pub struct AppState {
    pub client: Mutex<Option<TdlibManager>>,
    pub feed_cache: Arc<FeedCache>,
    /// Флаг: пришли новые посты — нужно уведомить фронтенд.
    /// Опрашивается каждые 500ms и сбрасывается.
    pub feed_dirty: Arc<AtomicBool>,
}

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
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                use tauri::Manager;
                api.prevent_close();
                let handle = window.app_handle().clone();
                tauri::async_runtime::spawn(async move {
                    let state: tauri::State<'_, AppState> = handle.state::<AppState>();
                    let guard = state.inner().client.lock().await;
                    if let Some(client) = guard.as_ref() {
                        client.shutdown().await;
                        // Даём TDLib время на сохранение БД и остановку потоков
                        tokio::time::sleep(tokio::time::Duration::from_millis(1500)).await;
                    }
                    std::process::exit(0);
                });
            }
            _ => {}
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
            // Auth
            ipc::auth::init_tdlib,
            ipc::auth::submit_phone,
            ipc::auth::submit_code,
            ipc::auth::submit_password,
            // Feed
            ipc::feed::get_channel_feed,
            ipc::feed::get_new_feed_since,
            ipc::feed::fetch_more_feed_history,
            // Chat
            ipc::chat::mark_as_read,
            ipc::chat::forward_to_stena,
            ipc::chat::load_more_history,
            ipc::chat::get_chat_info,
            ipc::chat::send_reply,
            ipc::chat::get_chat_folder,
            ipc::chat::sync_chats,
            ipc::chat::get_contacts,
            ipc::chat::get_user,
            ipc::chat::create_private_chat,
            ipc::chat::leave_chat,
            // Files
            ipc::files::download_file,
            ipc::files::delete_local_file,
            // System
            ipc::system::optimize_storage,
            ipc::system::check_local_update,
            ipc::system::apply_local_update,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
