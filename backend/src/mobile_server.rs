use axum::{
    extract::{Path, Query, State},
    http::{Method, StatusCode},
    response::{Html, IntoResponse},
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;
use serde_json::{json, Value};
use tauri::{AppHandle, Manager};
use tower_http::cors::{Any, CorsLayer};

use crate::AppState;

#[derive(Deserialize)]
pub struct FeedQuery {
    pub folder: Option<String>,
    pub limit: Option<usize>,
    pub before_date: Option<i64>,
    pub before_msg_id: Option<i64>,
}

#[derive(Deserialize)]
pub struct MarkReadBody {
    pub chat_id: i64,
    pub message_ids: Vec<i64>,
}

static PWA_HTML: &str = include_str!("mobile_pwa/index.html");

pub async fn start_mobile_server(app: AppHandle) {
    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST])
        .allow_origin(Any)
        .allow_headers(Any);

    let router = Router::new()
        .route("/", get(serve_pwa))
        .route("/manifest.json", get(serve_manifest))
        .route("/api/feed", get(get_feed))
        .route("/api/mark-read", post(mark_read))
        .route("/api/ping", get(ping))
        .route("/api/media/:file_id", get(serve_media))
        .with_state(app)
        .layer(cors);

    println!("[Mobile] HTTP сервер запущен: http://0.0.0.0:7474");
    match tokio::net::TcpListener::bind("0.0.0.0:7474").await {
        Ok(listener) => {
            if let Err(e) = axum::serve(listener, router).await {
                println!("[Mobile] Сервер завершился с ошибкой: {}", e);
            }
        }
        Err(e) => {
            println!(
                "[Mobile] Не удалось запустить сервер (порт 7474 занят?): {}",
                e
            );
        }
    }
}

async fn serve_pwa() -> Html<&'static str> {
    Html(PWA_HTML)
}

async fn serve_manifest() -> impl IntoResponse {
    let manifest = serde_json::json!({
        "name": "TeleFeed",
        "short_name": "TeleFeed",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#0d0d0f",
        "theme_color": "#0d0d0f",
        "orientation": "portrait",
        "icons": []
    });
    (
        [(
            axum::http::header::CONTENT_TYPE,
            "application/manifest+json",
        )],
        manifest.to_string(),
    )
}

async fn ping() -> Json<Value> {
    Json(json!({ "ok": true, "service": "telefeed-mobile" }))
}

async fn serve_media(State(app): State<AppHandle>, Path(file_id): Path<i64>) -> impl IntoResponse {
    let state = app.state::<AppState>();

    // Пытаемся получить путь, если он ещё не скачан — даём запрос на загрузку
    let mut path_opt = state.feed_cache.get_file_path(file_id);

    if path_opt.is_none() {
        if let Some(c) = state.client.lock().await.as_ref() {
            c.send(json!({
                "@type": "downloadFile",
                "file_id": file_id,
                "priority": 1,
                "offset": 0,
                "limit": 0,
                "synchronous": false
            }))
            .await;
        }

        // Ждём до 8 секунд пока файл скачается (раз в 200 мс)
        for _ in 0..40 {
            tokio::time::sleep(std::time::Duration::from_millis(200)).await;
            if let Some(p) = state.feed_cache.get_file_path(file_id) {
                path_opt = Some(p);
                break;
            }
        }
    }

    let Some(path) = path_opt else {
        return StatusCode::NOT_FOUND.into_response();
    };

    match tokio::fs::read(&path).await {
        Ok(bytes) => {
            let mime = if path.ends_with(".jpg") || path.ends_with(".jpeg") {
                "image/jpeg"
            } else if path.ends_with(".png") {
                "image/png"
            } else if path.ends_with(".webp") {
                "image/webp"
            } else if path.ends_with(".gif") {
                "image/gif"
            } else if path.ends_with(".mp4") {
                "video/mp4"
            } else {
                "image/jpeg"
            };
            (
                StatusCode::OK,
                [
                    (axum::http::header::CONTENT_TYPE, mime),
                    (
                        axum::http::header::CACHE_CONTROL,
                        "public, max-age=31536000",
                    ),
                ],
                bytes,
            )
                .into_response()
        }
        Err(_) => StatusCode::NOT_FOUND.into_response(),
    }
}

async fn get_feed(
    State(app): State<AppHandle>,
    Query(params): Query<FeedQuery>,
) -> Result<Json<Vec<Value>>, StatusCode> {
    let folder_id = params
        .folder
        .as_deref()
        .filter(|s| *s != "all")
        .and_then(|s| s.parse().ok());
    let limit = params.limit.unwrap_or(30).min(100);
    let state = app.state::<AppState>();
    let result =
        state
            .feed_cache
            .get_feed(folder_id, limit, params.before_date, params.before_msg_id);
    Ok(Json(result))
}

async fn mark_read(State(app): State<AppHandle>, Json(body): Json<MarkReadBody>) -> Json<Value> {
    app.state::<AppState>()
        .feed_cache
        .remove_messages(body.chat_id, &body.message_ids);
    Json(json!({ "ok": true }))
}
