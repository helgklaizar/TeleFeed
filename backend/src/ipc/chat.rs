use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn mark_as_read(
    chat_id: i64,
    message_ids: Vec<i64>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        crate::services::chat::ChatService::new(c).mark_as_read(chat_id, message_ids).await;
    }
    Ok(())
}

#[tauri::command]
pub async fn forward_to_stena(
    stena_chat_id: i64,
    from_chat_id: i64,
    message_ids: Vec<i64>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        crate::services::chat::ChatService::new(c).forward_to_stena(stena_chat_id, from_chat_id, message_ids).await;
    }
    Ok(())
}

#[tauri::command]
pub async fn load_more_history(
    chat_id: i64,
    from_message_id: i64,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        crate::services::chat::ChatService::new(c).load_more_history(chat_id, from_message_id).await;
    }
    Ok(())
}

#[tauri::command]
pub async fn get_chat_info(chat_id: i64, state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        crate::services::chat::ChatService::new(c).get_chat_info(chat_id).await;
    }
    Ok(())
}

#[tauri::command]
pub async fn send_reply(
    chat_id: i64,
    reply_to_id: i64,
    text: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        crate::services::chat::ChatService::new(c).send_reply(chat_id, reply_to_id, &text).await;
    }
    Ok(())
}

#[tauri::command]
pub async fn get_chat_folder(folder_id: i64, state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        crate::services::chat::ChatService::new(c).get_chat_folder(folder_id).await;
    }
    Ok(())
}

#[tauri::command]
pub async fn sync_chats(state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        crate::services::chat::ChatService::new(c).sync_chats().await;
    }
    Ok(())
}

#[tauri::command]
pub async fn get_contacts(state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        crate::services::chat::ChatService::new(c).get_contacts().await;
    }
    Ok(())
}

#[tauri::command]
pub async fn get_user(user_id: i64, state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        crate::services::chat::ChatService::new(c).get_user(user_id).await;
    }
    Ok(())
}

#[tauri::command]
pub async fn create_private_chat(user_id: i64, state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        crate::services::chat::ChatService::new(c).create_private_chat(user_id).await;
    }
    Ok(())
}

#[tauri::command]
pub async fn leave_chat(chat_id: i64, state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        crate::services::chat::ChatService::new(c).leave_chat(chat_id, &state.feed_cache).await;
    }
    Ok(())
}
