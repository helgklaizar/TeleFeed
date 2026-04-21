use libloading::Library;
use serde_json::{json, Value};
use std::collections::HashSet;
use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_double, c_void};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, RwLock};
use tauri::{AppHandle, Emitter, Manager};
use tokio::sync::mpsc;
use tokio::sync::Notify;

pub mod handlers;
use crate::feed_cache::FeedCache;

pub struct TdlibManager {
    sender: mpsc::Sender<Value>,
    _running: Arc<AtomicBool>,
}

impl TdlibManager {
    pub fn new(
        app_handle: AppHandle,
        api_id: i64,
        api_hash: String,
        feed_cache: Arc<FeedCache>,
        feed_notify: Arc<Notify>,
    ) -> Self {
        let (tx, mut rx) = mpsc::channel::<Value>(200);
        let init_tx = tx.clone();
        let running = Arc::new(AtomicBool::new(true));
        let running_task = running.clone();

        let subscribed_ids: Arc<RwLock<HashSet<i64>>> = Arc::new(RwLock::new(HashSet::new()));
        let my_user_id: Arc<RwLock<Option<i64>>> = Arc::new(RwLock::new(None));
        let auth_ready: Arc<RwLock<bool>> = Arc::new(RwLock::new(false));
        let auth_ready_for_read = auth_ready.clone();
        // api_id: i64 имеет Copy — Arc не нужен
        // api_hash: String — клонируем один раз для spawn_blocking
        let api_hash_for_read = api_hash;

        tokio::spawn(async move {
            let mut lib_path = format!(
                "{}/../frontend/node_modules/@prebuilt-tdlib/darwin-arm64/libtdjson.dylib",
                env!("CARGO_MANIFEST_DIR")
            );

            // Fallback for production (Resources)
            if !std::path::Path::new(&lib_path).exists() {
                if let Ok(res_dir) = app_handle.path().resource_dir() {
                    // Tauri bundles resources maintaining folder structure if they have ".."
                    // but often it's easier to check a few known locations.
                    let prod_path = res_dir.join("libtdjson.dylib");
                    if prod_path.exists() {
                        lib_path = prod_path.to_string_lossy().to_string();
                    } else {
                        // Check nested path if bundled with structure
                        let nested = res_dir.join("_up_/_up_/frontend/node_modules/@prebuilt-tdlib/darwin-arm64/libtdjson.dylib");
                        if nested.exists() {
                            lib_path = nested.to_string_lossy().to_string();
                        }
                    }
                }
            }

            println!("[TDLib] Loading from: {}", lib_path);

            // SAFETY: Loading TDLib shared library via FFI.
            let lib = unsafe {
                match Library::new(&lib_path) {
                    Ok(l) => Arc::new(l),
                    Err(e) => {
                        let error_msg = format!("Не удалось загрузить TDLib: {:?}", e);
                        println!("[TDLib ERROR] {}", error_msg);
                        let _ =
                            app_handle.emit::<Value>("auth_error", json!({ "message": error_msg }));
                        return;
                    }
                }
            };

            // SAFETY: These symbols are part of TDLib's public C API and are
            // guaranteed to exist in a valid libtdjson build. The function signatures
            // match TDLib's documented C interface.
            let client_create: unsafe extern "C" fn() -> *mut c_void =
                unsafe { *lib.get(b"td_json_client_create").unwrap() };
            let client_send: unsafe extern "C" fn(*mut c_void, *const c_char) =
                unsafe { *lib.get(b"td_json_client_send").unwrap() };
            let client_receive: unsafe extern "C" fn(*mut c_void, c_double) -> *const c_char =
                unsafe { *lib.get(b"td_json_client_receive").unwrap() };
            let client_destroy: unsafe extern "C" fn(*mut c_void) =
                unsafe { *lib.get(b"td_json_client_destroy").unwrap() };

            // SAFETY: client_create returns a valid opaque pointer per TDLib docs.
            let client_ptr = unsafe { client_create() };
            println!("[TDLib] Клиент создан");

            let log_req =
                json!({ "@type": "setLogVerbosityLevel", "new_verbosity_level": 1 }).to_string();
            // SAFETY: client_ptr is valid (just created), CString is null-terminated.
            unsafe { client_send(client_ptr, CString::new(log_req).unwrap().as_ptr()) };

            let ptr_usize = client_ptr as usize;
            let ids_for_read = subscribed_ids.clone();
            let my_uid_for_read = my_user_id.clone();
            let tx_for_read = init_tx.clone();

            // Read thread
            let feed_cache_for_read = feed_cache.clone();
            let feed_notify_for_read = feed_notify.clone();
            let running_for_read = running_task.clone();

            let running_loop = running_for_read.clone();
            tokio::task::spawn_blocking(move || {
                let client = ptr_usize as *mut c_void;
                while running_loop.load(Ordering::Relaxed) {
                    // SAFETY: client pointer is valid for the lifetime of the app.
                    // client_receive returns either null or a valid C string owned by TDLib
                    // that remains valid until the next client_receive call.
                    let res = unsafe { client_receive(client, 1.0) };
                    if !res.is_null() {
                        let c_str = unsafe { CStr::from_ptr(res) };
                        if let Ok(json_str) = c_str.to_str() {
                            if let Ok(parsed) = serde_json::from_str::<Value>(json_str) {
                                handlers::handle_update(
                                    &parsed,
                                    &handlers::UpdateContext {
                                        app: &app_handle,
                                        tx: &tx_for_read,
                                        subscribed_ids: &ids_for_read,
                                        my_user_id: &my_uid_for_read,
                                        auth_ready: &auth_ready_for_read,
                                        api_id,
                                        api_hash: &api_hash_for_read,
                                        feed_cache: &feed_cache_for_read,
                                        feed_notify: &feed_notify_for_read,
                                        running: &running_for_read,
                                    },
                                );
                            }
                        }
                    }
                }

                unsafe { client_destroy(ptr_usize as *mut c_void) };
                println!("[TDLib] Loop stopped, client destroyed.");
            });

            // Write thread
            let _keep_lib = lib;
            let ptr_write = client_ptr as usize;
            let running_for_write = running_task.clone();
            while let Some(request) = rx.recv().await {
                if !running_for_write.load(Ordering::Relaxed) {
                    break;
                }
                let client = ptr_write as *mut c_void;
                if let Ok(json_string) = serde_json::to_string(&request) {
                    println!("[TDLib SEND] {}", json_string);
                    if let Ok(c_string) = CString::new(json_string) {
                        // SAFETY: client pointer valid, c_string is null-terminated and
                        // lives long enough (owned by this scope until after the call).
                        unsafe { client_send(client, c_string.as_ptr()) };
                    }
                }
            }
        });

        Self {
            sender: tx,
            _running: running,
        }
    }

    pub async fn send(&self, request: Value) {
        let _ = self.sender.send(request).await;
    }

    pub async fn shutdown(&self) {
        println!("[TDLib] Начинаем Graceful Shutdown...");
        self.send(json!({ "@type": "close" })).await;
        // Поток чтения сам установит running=false при получении authorizationStateClosed
    }
}
