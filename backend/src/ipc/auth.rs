use tauri::State;
use serde_json::json;
use crate::AppState;

#[tauri::command]
pub async fn init_tdlib(
    api_id: i64,
    api_hash: String,
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let mut client = state.client.lock().await;
    if client.is_some() {
        return Ok(());
    }
    let manager = crate::tdlib::TdlibManager::new(
        app,
        api_id,
        api_hash,
        state.feed_cache.clone(),
        state.feed_dirty.clone(),
    );
    *client = Some(manager);
    Ok(())
}

#[tauri::command]
pub async fn submit_phone(phone: String, state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({
            "@type": "setAuthenticationPhoneNumber",
            "phone_number": phone
        })).await;
    }
    Ok(())
}

#[tauri::command]
pub async fn submit_code(code: String, state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({ "@type": "checkAuthenticationCode", "code": code })).await;
    }
    Ok(())
}

#[tauri::command]
pub async fn submit_password(password: String, state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({ "@type": "checkAuthenticationPassword", "password": password })).await;
    }
    Ok(())
}
