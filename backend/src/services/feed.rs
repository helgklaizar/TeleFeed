use serde_json::{json, Value};
use crate::tdlib::TdlibManager;
use crate::feed_cache::FeedCache;

pub struct FeedService<'a> {
    pub client: &'a TdlibManager,
    pub feed_cache: &'a FeedCache,
}

impl<'a> FeedService<'a> {
    pub fn new(client: &'a TdlibManager, feed_cache: &'a FeedCache) -> Self {
        Self { client, feed_cache }
    }

    pub fn get_channel_feed(&self, folder_id: Option<i32>, limit: usize, before_date: Option<i64>, before_msg_id: Option<i64>) -> Vec<Value> {
        self.feed_cache.get_feed(folder_id, limit, before_date, before_msg_id)
    }

    pub fn get_new_feed_since(&self, folder_id: Option<i32>, since_date: i64) -> Vec<Value> {
        self.feed_cache.get_new_since(folder_id, since_date)
    }

    pub async fn fetch_more_feed_history(&self) {
        let requests: Vec<(i64, i64)> = {
            let channels: Vec<i64> = self.feed_cache
                .feed_channels
                .read()
                .unwrap()
                .iter()
                .cloned()
                .collect();
            let messages_snap = self.feed_cache.messages.read().unwrap();

            channels
                .into_iter()
                .map(|chat_id| {
                    let oldest_id = messages_snap
                        .iter()
                        .filter(|(_, msg)| msg["chat_id"].as_i64().unwrap_or(0) == chat_id)
                        .map(|(_, msg)| msg["id"].as_i64().unwrap_or(0))
                        .min()
                        .unwrap_or(0);
                    (chat_id, oldest_id)
                })
                .collect()
        };

        for (chat_id, from_id) in requests {
            self.client.send(json!({
                "@type": "getChatHistory",
                "chat_id": chat_id,
                "from_message_id": from_id,
                "offset": 0,
                "limit": 50,
                "only_local": true
            })).await;
        }
    }
}
