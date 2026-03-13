# SRS — Software Requirements Specification

**Project:** TG-Feed v3  
**Version:** 0.1.0-beta.1  
**Date:** 2026-02-25

---

## 1. Introduction

### 1.1 Purpose
TG-Feed is a desktop application for aggregated reading of Telegram channels, groups, and private chats. Works as an alternative client focused on the channel feed.

### 1.2 Scope
- Single Telegram account
- macOS only (darwin-arm64)
- Read-only + basic actions (mark as read, forward, reply)

### 1.3 Definitions
- **TDLib** — Telegram Database Library (C++ with JSON interface)
- **Tauri** — Desktop application framework (Rust + WebView)
- **Wall** — Special Telegram channel/chat for saving favorite posts

---

## 2. Functional Requirements

### 2.1 Onboarding & Authorization (FR-AUTH)
| ID | Requirement | Priority |
|---|---|---|
| FR-AUTH-00 | Enter Telegram API credentials (api_id, api_hash) on first launch | Must |
| FR-AUTH-01 | Enter phone number | Must |
| FR-AUTH-02 | Enter SMS/Telegram code | Must |
| FR-AUTH-03 | Enter cloud password (2FA) | Must |
| FR-AUTH-04 | Auto-login on restart (TDLib session) | Must |

### 2.2 Channel Feed (FR-FEED)
| ID | Requirement | Priority |
|---|---|---|
| FR-FEED-01 | Display posts from subscribed channels chronologically | Must |
| FR-FEED-02 | Support content types: text, photo, video, GIF | Must |
| FR-FEED-03 | Render entities: bold, italic, url, mention, code | Must |
| FR-FEED-04 | Filter by Telegram folders | Should |
| FR-FEED-05 | Mark as read (with animation) | Must |
| FR-FEED-06 | Add to favorites (forward to "Wall") | Should |
| FR-FEED-07 | List virtualization (react-virtuoso) | Must |
| FR-FEED-08 | Fullscreen media viewer | Should |
| FR-FEED-09 | Albums (grouped by media_album_id) | Should |

### 2.3 Groups & Private (FR-CHAT)
| ID | Requirement | Priority |
|---|---|---|
| FR-CHAT-01 | Chat list with avatar and name | Must |
| FR-CHAT-02 | Navigate to chat → bubble conversation | Must |
| FR-CHAT-03 | Load history on scroll up | Must |
| FR-CHAT-04 | Send text messages | Should |
| FR-CHAT-05 | Back button | Must |

### 2.4 Settings (FR-SETTINGS)
| ID | Requirement | Priority |
|---|---|---|
| FR-SET-01 | User profile (avatar, name) | Must |
| FR-SET-02 | AI agent management (CRUD) | Could |
| FR-SET-03 | AI instructions | Could |
| FR-SET-04 | Channel list (blacklist) | Should |
| FR-SET-05 | Themes (blue/green/bordeaux) | Should |
| FR-SET-06 | Logout | Must |

### 2.5 UI (FR-UI)
| ID | Requirement | Priority |
|---|---|---|
| FR-UI-01 | Navigation: 4 tabs (Channels, Groups, Private, AI) + Menu | Must |
| FR-UI-02 | Zoom (Cmd+/-/0) | Should |
| FR-UI-03 | Keyboard shortcuts (Cmd+1/2/3, Esc) | Should |
| FR-UI-04 | i18n (EN/RU) | Should |

---

## 3. Non-Functional Requirements

| ID | Requirement | Metric |
|---|---|---|
| NFR-01 | Startup time to ready | < 5 sec (with existing session) |
| NFR-02 | Feed: render 500 posts | No noticeable lag (virtualization) |
| NFR-03 | Memory: messageStore | MAX 100 messages/chat |
| NFR-04 | Security: API keys | Not in source code (runtime input) |
| NFR-05 | Security: CSP | Configured (not null) |
| NFR-06 | Linting | ESLint 0 errors |
| NFR-07 | Tests | Vitest: minimum 30 unit tests |

---

## 4. Constraints

- Single account only (no multi-account)
- macOS only (darwin-arm64, libtdjson.dylib)
- No public channel search
- No media sending (text only)
- No voice/video calls

---

## 5. Out of Scope (v1)

- iOS / Android / Windows
- Multi-account
- Secret chats (TDLib supports it, UI doesn't)
- Stickers / reactions / polls
- Push notifications
