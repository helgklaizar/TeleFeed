# Codex Project Context: tele-feed

Zone: PROD
Path: /Users/klaizar/Projects/PROD/tele-feed

## Purpose

Stable Tauri v2 Telegram feed reader using Rust/Tokio, TDLib, React, and Zustand.

## Risk Posture

Production/stable desktop app: keep heavy Telegram/TDLib logic in Rust.

## How Codex Should Start

1. Read this `.codex/PROJECT_CONTEXT.md`.
2. Read `.gemini/ARCHITECTURE.md`, `.gemini/STATE.md`, and `.gemini/ACTIVE_TASK.md` if present.
3. Check README/DESIGN/ROADMAP/docs for current product intent.
4. Inspect real source files before editing.
5. Keep changes scoped to the user request.

## Current Architecture Snapshot

- **Стек:** Tauri v2 (Rust/Tokio) + React 19 (Vite, Zustand, Router 7)
- **Подход:** High-performance Telegram feed reader (использует TDLib через Rust bridge). FSD Architecture.

## Key Patterns

1. **Разделение логики:** Держим тяжелую логику и работу с TDLib на Rust. Zustand для UI-стейта (зеркалирование важных стейтов из Rust через эвенты).
2. **Компоненты:** Использование паттерна `shared/ui` для переиспользуемых элементов. Ванильный CSS с кастомными токенами.
3. **Строгость:** Запускать `pnpm lint:fix` перед коммитами. Архитектурный дрейф контролируется `dependency-cruiser`.

## Manifests And Entrypoints

- package.json
- backend/Cargo.toml
- backend/tauri.conf.json

## Package Summaries

- package.json: telefeed-root
  - scripts: dev, tauri, install, build, test, lint:fsd
  - notable deps: dependency-cruiser

## README Snapshot

# Tele-feed

A blazing fast, highly optimized Telegram feed reader desktop application built with **Tauri**, **Rust**, **React**, and **TDLib (Telegram Database Library)**.

TeleFeed is designed to provide you with a unified scrolling experience for all your favorite Telegram channels, filtering out the noise and offering you pure information streams organized exactly how you need them.

## 🌟 Key Features

- **Unified Smart Feed**: Read all your channels visually as a single scrollable feed without jumping between chats.
- **Native Performance**: Powered by **Rust** & **Tauri** for maximum speed and minimal RAM/CPU footprint compared to Electron.
- **Flawless Infinite Scroll**: Engineered with snap-scrolling and intelligent caching (Zustand + BTreeMap LRU cache in Rust) to handle thousands of posts effortlessly.
- **Graceful TDLib Integration**: Direct integration via FFI natively on background threads ensures robust synchronization and zero data corruption.
- **Beautiful Media Handling**: Seamless support for multi-photo albums, videos, UI transitions, and native macOS design cues.
- **Offline Capable**: Stores historical feeds compactly locally using TDLib's internal SQLite.

## 🛠 Tech Stack

- **Core Framework**: [Tauri v2](https://v2.tauri.app/)
- **Backend**: Rust 1.85+, TDLib (Official C++ Telegram client library integration)
- **Frontend**: React 19, Vite, Zustand 5, Tailwind CSS / Vanilla Modules
- **Architecture**: Modular Feature-Sliced Design (FSD) + robust IPC Events.

## 📦 Installation & Setup (macOS only)

Currently, the project is configured and compiled specifically for macOS (darwin-arm64).

1. Clone the repository:
   ```bash
   git clone git@github.com:helgklaizar/TeleFeed.git
   cd TeleFeed
   ```
2. Install npm dependencies for the frontend:
   ```bash
   cd frontend
   npm install
   ```
3. Run the complete Tauri application in dev mode:
   ```bash
   npm run tauri dev
   ```

*Note: Building TDLib can require significant RAM. The repository usually expects pre-compiled linking libraries inside the `backend/lib` directory based on your architecture.*

## 🔨 Production Build

To create the release `.app` bundle:
```bash
cd backend
../frontend/node_modules/.bin/tauri build
```
The compiled application will be located at: `target/release/bundle/macos/TeleFeed.app`

⚠️ **IMPORTANT INSTALLATION STEP**: You MUST move `TeleFeed.app` to your `/Applications` folder before opening it. Running the application directly from the build directory will trigger macOS App Translocation (App Sandboxing / Gatekeeper), which will prevent TDLib from correctly initializing or saving its local SQLite database.

## 🔒 Privacy & Security

TeleFeed stores all authentication and session data completely locally on your machine via the official TDLib. 
It never routes your messages through any third-party servers. 
Your `.env` and TDLib local database components are carefully `.gitignore`'d. You retain 100% control over your Telegram session data.

## Design Snapshot

---
name: "TeleFeed Visual Standard"
version: "1.0.0"
colors:
  background: "#17212b"
  surface: "#242f3d"
  accent: "#5288c1"
  text-primary: "#f5f5f5"
  text-muted: "#7f91a4"
  danger: "#ff4757"
  glass-effect: "rgba(36, 47, 61, 0.9)"
typography:
  main:
    fontFamily: "Inter, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: "400"
  header:
    fontFamily: "Inter, -apple-system, sans-serif"
    fontSize: "17px"
    fontWeight: "600"
  detail:
    fontFamily: "Inter, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: "400"
spacing:
  base: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
rounded:
  md: "8px"
  lg: "10px"
  xl: "12px"
  full: "50%"
components:
  btn-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
  btn-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
---

## 🏛 Overview


## Antigravity Memory Status

- `.gemini/ARCHITECTURE.md`: present
- `.gemini/STATE.md`: present
- `.gemini/ACTIVE_TASK.md`: present

If these files contain placeholders, prefer source files and current user instruction.
