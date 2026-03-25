pub mod common;
pub mod auth;
pub mod chats;
pub mod feed;

use serde_json::Value;
use tauri::Emitter;

pub use common::UpdateContext;

pub fn handle_update(update: &Value, ctx: &UpdateContext) {
    let type_str = match update["@type"].as_str() {
        Some(t) => t,
        None => return,
    };

    if type_str == "error" {
        chats::handle_error(update, ctx);
        return;
    }

    match type_str {
        "updateAuthorizationState" => auth::handle_auth(update, ctx),
        
        "ok" => chats::handle_ok(update, ctx),

        "updateNewChat"
        | "updateChatPosition"
        | "chat"
        | "chats"
        | "chatFolder"
        | "updateChatFolders"
        | "user" => chats::handle_chat_event(type_str, update, ctx),

        "updateNewMessage"
        | "updateMessageContent"
        | "messages"
        | "updateFile" => feed::handle_feed_event(type_str, update, ctx),

        _ => {
            let _ = ctx.app.emit("tdlib_event", update.clone());
        }
    }
}
