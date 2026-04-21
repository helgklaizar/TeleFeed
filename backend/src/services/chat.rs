use serde_json::json;
use crate::tdlib::TdlibManager;
use crate::feed_cache::FeedCache;

pub struct ChatService<'a> {
    pub client: &'a TdlibManager,
}

impl<'a> ChatService<'a> {
    pub fn new(client: &'a TdlibManager) -> Self {
        Self { client }
    }

    pub async fn mark_as_read(&self, chat_id: i64, message_ids: Vec<i64>) {
        self.client.send(json!({
            "@type": "viewMessages",
            "chat_id": chat_id,
            "message_ids": message_ids,
            "force_read": true
        })).await;
    }

    pub async fn forward_to_stena(&self, stena_chat_id: i64, from_chat_id: i64, message_ids: Vec<i64>) {
        self.client.send(json!({
            "@type": "forwardMessages",
            "chat_id": stena_chat_id,
            "from_chat_id": from_chat_id,
            "message_ids": message_ids
        })).await;
    }

    pub async fn load_more_history(&self, chat_id: i64, from_message_id: i64) {
        self.client.send(json!({
            "@type": "getChatHistory",
            "chat_id": chat_id,
            "from_message_id": from_message_id,
            "offset": 0,
            "limit": 200,
            "only_local": false,
            "@extra": format!("history_{}", chat_id)
        })).await;
    }

    pub async fn get_chat_info(&self, chat_id: i64) {
        self.client.send(json!({ "@type": "getChat", "chat_id": chat_id })).await;
    }

    pub async fn send_reply(&self, chat_id: i64, reply_to_id: i64, text: &str) {
        self.client.send(json!({
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

    pub async fn get_chat_folder(&self, folder_id: i64) {
        self.client.send(json!({
            "@type": "getChatFolder",
            "chat_folder_id": folder_id,
            "@extra": format!("folder_{}", folder_id)
        })).await;
    }

    pub async fn sync_chats(&self) {
        self.client.send(json!({
            "@type": "getChats",
            "chat_list": { "@type": "chatListMain" },
            "limit": 500,
            "@extra": "sync_chats"
        })).await;
    }

    pub async fn get_contacts(&self) {
        self.client.send(json!({ "@type": "getContacts", "@extra": "getContacts" })).await;
    }

    pub async fn get_user(&self, user_id: i64) {
        self.client.send(json!({ "@type": "getUser", "user_id": user_id })).await;
    }

    pub async fn create_private_chat(&self, user_id: i64) {
        self.client.send(json!({
            "@type": "createPrivateChat",
            "user_id": user_id,
            "force": false
        })).await;
    }

    pub async fn leave_chat(&self, chat_id: i64, feed_cache: &FeedCache) {
        self.client.send(json!({ "@type": "leaveChat", "chat_id": chat_id })).await;
        // Cache management is domain logic.
        feed_cache.remove_feed_channel(chat_id);
    }
}
