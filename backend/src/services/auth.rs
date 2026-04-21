use serde_json::json;
use crate::tdlib::TdlibManager;

pub struct AuthService<'a> {
    pub client: &'a TdlibManager,
}

impl<'a> AuthService<'a> {
    pub fn new(client: &'a TdlibManager) -> Self {
        Self { client }
    }

    pub async fn submit_phone(&self, phone: &str) {
        self.client.send(json!({
            "@type": "setAuthenticationPhoneNumber",
            "phone_number": phone
        })).await;
    }

    pub async fn submit_code(&self, code: &str) {
        self.client.send(json!({ "@type": "checkAuthenticationCode", "code": code })).await;
    }

    pub async fn submit_password(&self, password: &str) {
        self.client.send(json!({ "@type": "checkAuthenticationPassword", "password": password })).await;
    }
}
