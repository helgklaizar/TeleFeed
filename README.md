# 🚀 TeleFeed

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

## 📜 License

TeleFeed is licensed under the MIT License. Copyright (c) 2026 TeleFeed.
