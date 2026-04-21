use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Serialize, Deserialize, TS, Clone, Debug)]
#[ts(export, export_to = "../../frontend/shared/api/bindings.ts")]
pub struct UserProfile {
    pub id: i64,
    pub first_name: String,
    pub last_name: Option<String>,
    pub username: Option<String>,
    pub phone_number: Option<String>,
}

#[derive(Serialize, Deserialize, TS, Clone, Debug)]
#[ts(export, export_to = "../../frontend/shared/api/bindings.ts")]
pub struct ChatInfo {
    pub chat_id: i64,
    pub title: String,
    pub is_channel: bool,
    pub unread_count: i32,
}

#[derive(Serialize, Deserialize, TS, Clone, Debug)]
#[ts(export, export_to = "../../frontend/shared/api/bindings.ts")]
pub struct SyncChatsCommand {
    pub limit: u32,
    pub only_local: bool,
}
