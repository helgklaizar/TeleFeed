# 📋 Project Tasks & Audit Findings: TeleFeed

## 📊 Summary of Findings

TeleFeed is a macOS-only, Tauri-based desktop Telegram client monorepo featuring a Rust backend, a Vite/React frontend, a Python-based extractor utility, and experimental Apple-native SwiftUI ports. It dynamically links to TDLib (`libtdjson.dylib`) using `libloading`. 

Our comprehensive audit revealed critical findings:
1. **Broken Feed History Pagination:** The backend `FeedCache` enforces a hard cutoff timestamp (5:00 AM of the current day) and immediately discards any incoming message older than this cutoff. Even when the frontend requests older history, the messages are fetched from TDLib but silently dropped by the cache, breaking pagination.
2. **Forwarding Inconsistency:** The backend cache drops all messages containing forwarding information (`forward_info`), rendering the frontend's complex forward-badge rendering logic completely unreachable.
3. **Severe Local Network Security Exposure:** The embedded Axum server used for mobile PWA streaming binds to `0.0.0.0:7474`, exposing the user's private Telegram feeds and downloaded media files to anyone on the same local network without authentication.
4. **Local Database Privacy Risks:** The TDLib SQLite database initializes with an empty encryption key (`""`), exposing sensitive chat histories and user data in plain text on the local disk.
5. **High Memory Overhead:** The PWA media streaming API reads entire files (including large videos) into memory using `tokio::fs::read` before sending them, threatening OOM crashes.
6. **a11y & Static Event Handlers:** Many React components attach `onClick` handlers to static elements (`div`, `span`, `a`) without matching keyboard event handlers or ARIA roles, rendering the application unusable for keyboard-only or screen-reader users.

---

## 🛠️ Actionable Tasks

### 🔒 Security, Compliance & Dependencies
- [ ] **Lock Down PWA Server Binding (P0):** Modify `backend/src/mobile_server.rs:48` to bind to `127.0.0.1:7474` by default. Implement optional token-based authentication (query parameter or headers) if external device access is enabled.
- [ ] **Secure Local SQLite Database Encryption (P0):** Update backend initialization in `backend/src/tdlib/handlers/auth.rs:43` to use a secure, user-defined or automatically generated database encryption key instead of passing an empty string (`"encryption_key": ""`).
- [ ] **Stream Media Files to Prevent Memory Exhaustion (P1):** Refactor `backend/src/mobile_server.rs:124` to stream files in chunks or support range requests, replacing `tokio::fs::read` to prevent loading multi-gigabyte media into memory.
- [ ] **Mitigate Subprocess Untrusted Input Vulnerability (P1):** Secure subprocess executions flagged by Bandit (`B404`/`B603`) in `extractor/ext_groups.py:84` and `extractor/extract_folder.py:80`. Sanitize or remove raw shell execution wrappers.
- [ ] **Clean Up Frontend Dependency Coupling (P2):** Resolve React Doctor warning regarding the unused dependency `@prebuilt-tdlib/darwin-arm64` in `frontend/package.json`. Document its purpose (binary retrieval for compilation) in a comment or separate configuration file.
- [ ] **De-duplicate Rust Crates (P2):** Resolve Cargo duplicate dependency warnings for crates like `base64` (versions `0.21.7` and `0.22.1`) in `backend/Cargo.toml`.

### ♿ Accessibility & SEO (WCAG 2.2 / a11y)
> [!NOTE]
> Since TeleFeed is a native Tauri desktop app and not a publicly indexable website, search engine optimization (Crawl4ai SEO) is **Not Applicable (N/A)**. However, semantic HTML layout, zoom scaling, and keyboard accessibility remain vital.

- [ ] **Fix Keyboard Navigation in Feed Items (P0):** Refactor static `onClick` handlers in `frontend/features/feed/components/FeedCard.jsx` (avatar container at line 149 and channel name at line 158) to use interactive keyboard triggers (e.g. `onKeyDown`) and add `role="button"` and `tabIndex={0}`.
- [ ] **Fix Navigation in Media Modal Overlay (P1):** Add keyboard closing capabilities to `MediaModal` in `frontend/app/App.tsx:29` (overlay click) so screen readers can dismiss the lightbox using standard keys.
- [ ] **Add Missing Button Type Attributes (P1):** Ensure all button elements specify `type="button"` to avoid default form submission behaviors. Key files include:
  - `frontend/app/App.tsx` (lines 30, 36, 49)
  - `frontend/features/feed/components/FeedCard.jsx` (lines 172, 183)
  - `frontend/features/media/components/VideoPlayer.jsx` (lines 240, 261, 279, 307)
  - `frontend/pages/ChannelListPage.jsx` (lines 38, 64)
- [ ] **Add Video/Audio Captions Support (P1):** Resolve the `media-has-caption` violation in `frontend/features/media/components/VideoPlayer.jsx:224` by adding a `<track kind="captions">` fallback tag.
- [ ] **Correct Small Text & AutoFocus (P2):** Refactor `frontend/pages/AuthPage.jsx` to replace text sizes below 12px (lines 123 and 214 use 11px) and remove accessibility-breaking `autoFocus` properties (lines 92 and 204) in favor of programmatic layout focus.
- [ ] **Add Missing Labels for Icon Buttons (P2):** Add `aria-label` or `aria-labelledby` to the back navigation button in `frontend/pages/ChannelListPage.jsx:38` to make its purpose clear to screen readers.

### ⚙️ Technical Debt & Assumptions
- [ ] **Fix Feed Cache Cutoff and Pagination (P0):** Refactor `backend/src/feed_cache.rs` to allow caching and retrieval of messages older than 5:00 AM. Stop discarding messages in `add_message` if `date < cutoff` when they are returned from historical queries.
- [ ] **Align Frontend and Backend Forwarding Logics (P0):** Fix the discrepancy where `FeedCache::add_message` discards all messages containing `forward_info` (lines 147-149), while `FeedCard.jsx` has active code to render forward badges. Update the filter to allow forwarded channel posts.
- [ ] **Convert Blocking Commands to Async (P1):** Replace synchronous filesystem checks and command spawns (like `std::path::Path::exists` and `std::process::Command` in `backend/src/ipc/system.rs` for updates) with tokio equivalents (`tokio::fs::metadata` and `tokio::process::Command`).
- [ ] **Refactor Complex TDLib Event Router Loops (P1):** Reduce the high cyclomatic complexity (radon/clippy warnings) of `handle_chat_event` and `handle_update` in `backend/src/tdlib/handlers/chats.rs` (complexity rating 36). Split the event routing into smaller, well-typed matching methods.
- [ ] **Coordinate Thread Destruction in TDLib (P1):** In `backend/src/tdlib.rs`, protect the client pointer with a mutex or state check to ensure `client_destroy` is never called concurrently with a running write loop, preventing potential Use-After-Free/Segfault crashes.
- [ ] **Remove Inline React Styles (P2):** Migrate extensive inline style properties in `frontend/pages/ChannelListPage.jsx` and `frontend/pages/AuthPage.jsx` into standalone CSS modules or CSS classes.
- [ ] **Resolve Unused Effect Leaks (P2):** Audit and ensure robust cleanup of `AppHeader.jsx`'s effects to prevent memory leaks during view transitions.
- [ ] **Clean Up Frontend Dead Code (P2):** Delete 11 reported unused components in the frontend, including `BubbleMessage.jsx` and `BaseBubbleLayout.jsx`.

### 🧪 QA & Testing Strategy (Unit, Integration, E2E, Load, A/B)

#### 1. QA & Testing Strategy Document
- [ ] **Extend Store & UI Testing (P1):** Set up React Testing Library within the existing Vitest configuration to write integration tests for React components, verifying that click event handlers and keyboard controls trigger correctly (e.g., in `FeedCard.jsx` and `VideoPlayer.jsx`).
- [ ] **Rust Backend Cache Testing (P1):** Write Rust unit tests in `backend/src/feed_cache.rs` to validate cache eviction, cutoff boundaries, and message inclusion/exclusion rules.
- [ ] **Implement Tauri IPC Mocks (P2):** Create a mock IPC adaptation layer on the frontend so developers can test UI layouts and flows directly in a web browser without launching Tauri/TDLib.

#### 2. Load Testing Plan
- [ ] **Virtual Infinite Scroll Performance (P1):** Profile the virtual scrolling viewport (`react-virtuoso`) when rendering 1,000+ posts containing image grids and video players. Ensure frame rate holds stable above 58 FPS, and DOM node size remains capped.
- [ ] **PWA Server Benchmark (P2):** Configure a `k6` or `wrk` load script targeting the local Axum endpoints (`/api/feed` and `/api/media/:file_id`). Measure request latencies and memory footprint under 5-10 concurrent local PWA clients downloading video files ranging from 1MB to 100MB.

#### 3. A/B Testing Planner
- [ ] **Scroll Interaction & Read-Tracking Flow (P2):** Implement a local A/B feature flag (`tg_feed_scroll_variant`) in `localStorage`. 
  - *Variant A:* Automatically archive/hide posts as they are scrolled out of the viewport.
  - *Variant B:* Keep posts in the feed, requiring manual action (swipe or click) to mark as read.
  - *Metrics:* Compare reading session durations, retention, and manual click-rates.
- [ ] **AI Summarization Interface (P2):** 
  - *Variant A:* Display a single consolidated AI digest at the top of a folder.
  - *Variant B:* Provide individual "Summarize" buttons on individual chat card groups.
  - *Metrics:* Compare overall click-through rates and tool engagement.
