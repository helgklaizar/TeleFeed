use tauri::State;
use serde_json::json;
use crate::AppState;

#[tauri::command]
pub async fn mark_as_read(
    chat_id: i64,
    message_ids: Vec<i64>,
    state: State<'_, AppState>,
) -> Result<(), String> {
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
pub async fn forward_to_stena(
    stena_chat_id: i64,
    from_chat_id: i64,
    message_ids: Vec<i64>,
    state: State<'_, AppState>,
) -> Result<(), String> {
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
pub async fn load_more_history(
    chat_id: i64,
    from_message_id: i64,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({
            "@type": "getChatHistory",
            "chat_id": chat_id,
            "from_message_id": from_message_id,
            "offset": 0,
            "limit": 200,
            "only_local": false,
            "@extra": format!("history_{}", chat_id)
        })).await;
    }
    Ok(())
}

#[tauri::command]
pub async fn get_chat_info(chat_id: i64, state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({ "@type": "getChat", "chat_id": chat_id })).await;
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
        c.send(json!({
            "@type": "sendMessage",
            "chat_id": chat_id,
            "reply_to": {
                "@type": "inputMessageReplyToMessage",
                "message_id": reply_to_id
            },
            "input_message_content": {
                "@type": "inputMessageText",
                "text": { "@type": "formattedText", "text": text }
            }
        })).await;
    }
    Ok(())
}

#[tauri::command]
pub async fn get_chat_folder(folder_id: i64, state: State<'_, AppState>) -> Result<(), String> {
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
pub async fn sync_chats(state: State<'_, AppState>) -> Result<(), String> {
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

#[tauri::command]
pub async fn get_contacts(state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({ "@type": "getContacts", "@extra": "getContacts" })).await;
    }
    Ok(())
}

#[tauri::command]
pub async fn get_user(user_id: i64, state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({ "@type": "getUser", "user_id": user_id })).await;
    }
    Ok(())
}

#[tauri::command]
pub async fn create_private_chat(
    user_id: i64,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({
            "@type": "createPrivateChat",
            "user_id": user_id,
            "force": false
        })).await;
    }
    Ok(())
}

#[tauri::command]
pub async fn leave_chat(chat_id: i64, state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({ "@type": "leaveChat", "chat_id": chat_id })).await;
    }
    drop(client);
    state.feed_cache.remove_feed_channel(chat_id);
    Ok(())
}
