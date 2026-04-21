use crate::AppState;
use serde_json::{json, Value};
use tauri::State;

#[tauri::command]
pub async fn download_file(file_id: i64, state: State<'_, AppState>) -> Result<Value, String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({
            "@type": "downloadFile",
            "file_id": file_id,
            "priority": 1,
            "offset": 0,
            "limit": 0,
            "synchronous": false
        }))
        .await;
    }
    Ok(json!({ "success": true }))
}

#[tauri::command]
pub async fn delete_local_file(file_id: i64, state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({ "@type": "deleteFile", "file_id": file_id }))
            .await;
    }
    Ok(())
}
