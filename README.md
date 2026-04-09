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


## 📂 File Structure

```text
.
├── api/                # IPC Events and Data Types definitions
├── backend/            # Rust/Tauri backend (TDLib integration)
├── docs/               # Project documentation & architecture
├── extractor/          # Extra background automation scripts
└── frontend/           # React 19 UI with Vite & Zustand
```


## 📦 Installation & Setup (macOS only)

Currently, the project is configured and compiled specifically for macOS (darwin-arm64).

1. Clone the repository:
   ```bash
   git clone git@github.com:helgklaizar/TeleFeed.git
   cd TeleFeed
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the complete Tauri application in dev mode:
   ```bash
   npm run dev
   ```

---

## 🍏 The Mac AI Ecosystem
This project is part of a large-scale initiative to build high-performance AI tools specifically for Apple Silicon developers. Check out our other open-source adaptations:

- [🍏 **LLM Env Selector**](https://github.com/helgklaizar/llm-env-selector) — The ultimate UI configurator.
- [🌉 **CUDA2MLX Bridge**](https://github.com/helgklaizar/cuda2mlx-bridge) — Drop-in replacement for CUDA projects.
- [🚀 **TurboQuant MLX**](https://github.com/helgklaizar/turboquant_mlx) — Extreme KV Cache Compression (1-3 bit).
- [🔥 **MLX Flamegraph**](https://github.com/helgklaizar/mlx-flamegraph) — Energy UI profiler for neural networks.
- [🧠 **APFS Vector Indexer**](https://github.com/helgklaizar/apfs-rag-indexer) — Native system RAG with zero battery drain.
- [⚒️ **MLX Forge**](https://github.com/helgklaizar/mlx-forge) — Blazing-fast memory-efficient LLM Fine-Tuning.
- [🔳 **MLX BitNet**](https://github.com/helgklaizar/mlx-bitnet) — Native Ternary (1.58-bit) Matrix Multiplication Kernels.
- [👁️ **MLX OmniParser**](https://github.com/helgklaizar/mlx-omni-parser) — Blazing-fast visual GUI agent.
- [⚡️ **MLX Flash Attention**](https://github.com/helgklaizar/mlx-flash-attention) — Native FA3 for Metal.
- [🌿 **MLX SageAttention**](https://github.com/helgklaizar/mlx-sage-attention) — 5x faster quantized attention.
- [🧬 **MLX Attention Matching**](https://github.com/helgklaizar/mlx-attention-matching) — 50x context compression.
- [🚀 **MLX RocketKV**](https://github.com/helgklaizar/mlx-rocket-kv) — 400x extreme pruning.
- [📡 **MLX KVTC**](https://github.com/helgklaizar/mlx-kvtc) — Transform coding for KV cache.
- [🌌 **MLX AETHER**](https://github.com/helgklaizar/mlx-aether) — Geometric Sparse Attention.
- [🌌 **MLX DeepSeek Engine**](https://github.com/helgklaizar/mlx-deepseek-engine) — Massive 671B model inference on Mac.
- [🎞 **MLX Open-Sora**](https://github.com/helgklaizar/mlx-open-sora) — Text-to-Video generation pipeline.
- [🗣 **MLX Moshi Voice**](https://github.com/helgklaizar/mlx-moshi-voice) — Realtime Voice-to-Voice agents.
- [🎲 **MLX MCTS Batched RL**](https://github.com/helgklaizar/mlx-mcts-rl) — Highly parallel MCTS framework.

