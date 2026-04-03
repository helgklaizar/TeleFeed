use tauri::State;
use serde_json::{json, Value};
use crate::AppState;

#[tauri::command]
pub async fn get_channel_feed(
    folder_id: Option<i32>,
    limit: usize,
    before_date: Option<i64>,
    before_msg_id: Option<i64>,
    state: State<'_, AppState>,
) -> Result<Vec<Value>, String> {
    Ok(state.feed_cache.get_feed(folder_id, limit, before_date, before_msg_id))
}

#[tauri::command]
pub async fn get_new_feed_since(
    folder_id: Option<i32>,
    since_date: i64,
    state: State<'_, AppState>,
) -> Result<Vec<Value>, String> {
    Ok(state.feed_cache.get_new_since(folder_id, since_date))
}

#[tauri::command]
pub async fn fetch_more_feed_history(
    _before_date: i64,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let requests: Vec<(i64, i64)> = {
        let channels: Vec<i64> = state.feed_cache.feed_channels.read().unwrap()
            .iter().cloned().collect();
        let messages_snap = state.feed_cache.messages.read().unwrap();

        channels.into_iter().map(|chat_id| {
            let oldest_id = messages_snap.iter()
                .filter(|(_, msg)| msg["chat_id"].as_i64().unwrap_or(0) == chat_id)
                .map(|(_, msg)| msg["id"].as_i64().unwrap_or(0))
                .min()
                .unwrap_or(0);
            (chat_id, oldest_id)
        }).collect()
    };

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
