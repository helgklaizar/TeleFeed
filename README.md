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


---

## 🍏 The Mac AI Ecosystem
This initiative aims to build a world-class, high-performance AI toolkit natively for Apple Silicon.

- [🍏 **Env-Selector-MLX**](https://github.com/helgklaizar/env-selector-mlx) — UI configurator.
- [🌉 **Cuda-Bridge-MLX**](https://github.com/helgklaizar/cuda-bridge-mlx) — Run CUDA projects natively.
- [🚀 **TurboQuant-MLX**](https://github.com/helgklaizar/turboquant-mlx) — Extreme KV Cache Compression (1-3 bit).
- [🔥 **Flamegraph-MLX**](https://github.com/helgklaizar/flamegraph-mlx) — Energy & Performance Visual Profiler.
- [🧠 **Rag-Indexer-MLX**](https://github.com/helgklaizar/rag-indexer-mlx) — Native system RAG with zero battery drain.
- [⚒️ **Forge-MLX**](https://github.com/helgklaizar/forge-mlx) — Fast memory-efficient Fine-Tuning.
- [🔳 **BitNet-MLX**](https://github.com/helgklaizar/bitnet-mlx) — Native Ternary (1.58-bit) Kernels.
- [👁️ **OmniParser-MLX**](https://github.com/helgklaizar/omni-parser-mlx) — visual GUI understanding.
- [⚡️ **Flash-Attention-MLX**](https://github.com/helgklaizar/flash-attention-mlx) — Native FA3 for Metal.
- [🌿 **SageAttention-MLX**](https://github.com/helgklaizar/sage-attention-mlx) — Ultra-fast Quantized Attention.
- [🧬 **Attention-Matching-MLX**](https://github.com/helgklaizar/attention-matching-mlx) — Recursive 50x context compression.
- [🚀 **RocketKV-MLX**](https://github.com/helgklaizar/rocket-kv-mlx) — Extreme 400x cache pruning.
- [📡 **KVTC-MLX**](https://github.com/helgklaizar/kvtc-mlx) — Transform Coding for KV cache.
- [🌌 **AETHER-MLX**](https://github.com/helgklaizar/aether-mlx) — Geometric Sparse Attention.
- [🌌 **DeepSeek-MLX**](https://github.com/helgklaizar/deepseek-mlx) — High-throughput inference engine.
- [🎞 **Open-Sora-MLX**](https://github.com/helgklaizar/open-sora-mlx) — Text-to-Video generation pipeline.
- [🗣 **Moshi-Voice-MLX**](https://github.com/helgklaizar/moshi-voice-mlx) — Realtime Voice-to-Voice agents.
- [🎲 **MCTS-RL-MLX**](https://github.com/helgklaizar/mcts-rl-mlx) — Parallel reasoning at scale.

