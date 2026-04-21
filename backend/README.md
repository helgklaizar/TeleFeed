# TeleFeed Backend (Rust + TDLib)

The Rust processing layer of the TeleFeed application. It acts as a bridge between TDLib (via FFI) and the React frontend via Tauri IPC.

## 🏗 Directory Structure
- `lib.rs`: AppState setup and IPC command registration.
- `tdlib.rs`: TDLib Manager – handles FFI, send-loop, and receive-loop.
- `handlers.rs`: Update handler translating TDLib events into Tauri emits.
- `feed_cache.rs`: High-performance in-process feed cache using BTreeMap and LRU logic.
- `mobile_server.rs`: HTTP server for mobile entry points.

## ⚡ Event Batching
To optimize performance, we batch feed updates instead of emitting on every message:
- `handlers.rs` sets a `feed_dirty` flag.
- `lib.rs` main loop checks this flag every 500ms and emits a single `feed_updated` event if true.

## 🕹 IPC Command Reference
| Command | Module | Description |
|---|---|---|
| `init_tdlib` | auth | Initialize TDLib with api_id/api_hash |
| `submit_phone` | auth | Submit phone number |
| `submit_code` | auth | Submit SMS code |
| `get_channel_feed` | feed | Get feed slice (paginated) |
| `sync_chats` | chat | Sync chat list from Telegram |
| `download_file` | files | Download media files via TDLib |

## 📦 Feed Cache Features
- Stores up to 1500 messages in a `BTreeMap`.
- O(log N) pagination via `.range()`.
- Album grouping logic for unified feed display.
