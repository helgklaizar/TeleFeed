use crate::AppState;
use serde_json::json;
use tauri::State;

#[tauri::command]
pub async fn optimize_storage(state: State<'_, AppState>) -> Result<(), String> {
    let client = state.client.lock().await;
    if let Some(c) = client.as_ref() {
        c.send(json!({
            "@type": "optimizeStorage",
            "size_limit": 0,
            "ttl": 0,
            "count_limit": 0,
            "immunity_delay": 0,
            "file_types": [],
            "chat_ids": [],
            "exclude_chat_ids": [],
            "return_deleted_file_statistics": false,
            "chat_limit": 0
        }))
        .await;
    }
    Ok(())
}

#[tauri::command]
pub async fn check_local_update(app_handle: tauri::AppHandle) -> Result<bool, String> {
    let app_version = app_handle.package_info().version.to_string();
    let src_package_path = format!("{}/../frontend/package.json", env!("CARGO_MANIFEST_DIR"));
    if let Ok(content) = std::fs::read_to_string(&src_package_path) {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
            if let Some(src_version) = json["version"].as_str() {
                return Ok(src_version != app_version);
            }
        }
    }
    Ok(false)
}

#[tauri::command]
pub async fn apply_local_update() -> Result<(), String> {
    use std::process::Command;

    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let src_dir = format!("{}/..", manifest_dir);
    let updater_script = format!("{}/backend/local_updater.sh", src_dir);
    let dest_app = "/Applications/TeleFeed.app";
    let bundle_path = format!(
        "{}/backend/target/release/bundle/macos/TeleFeed.app",
        src_dir
    );

    let _ = Command::new("chmod")
        .arg("+x")
        .arg(&updater_script)
        .status();

    let _ = Command::new("sh")
        .arg("-c")
        .arg(format!(
            "nohup sh '{}' '{}' '{}' '{}' > updater.log 2>&1 &",
            updater_script, src_dir, dest_app, bundle_path
        ))
        .spawn()
        .map_err(|e| format!("Failed to start updater: {}", e))?;

    std::process::exit(0);
}
