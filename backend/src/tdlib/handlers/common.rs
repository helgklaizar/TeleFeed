use serde_json::{json, Value};
use tokio::sync::mpsc;
use tauri::AppHandle;
use std::sync::{Arc, RwLock};
use std::sync::atomic::AtomicBool;
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
    /// Флаг для graceful shutdown
    pub running: &'a Arc<AtomicBool>,
}
