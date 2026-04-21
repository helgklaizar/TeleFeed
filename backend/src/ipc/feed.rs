use crate::AppState;
use serde_json::Value;
use tauri::State;

#[tauri::command]
pub async fn get_channel_feed(
    folder_id: Option<i32>,
    limit: usize,
    before_date: Option<i64>,
    before_msg_id: Option<i64>,
    state: State<'_, AppState>,
) -> Result<Vec<Value>, String> {
    let client = state.client.lock().await;
    let fallback = client.as_ref().map(|c| crate::services::feed::FeedService::new(c, &state.feed_cache));
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
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        crate::services::feed::FeedService::new(c, &state.feed_cache).fetch_more_feed_history().await;
    }
    Ok(())
}
