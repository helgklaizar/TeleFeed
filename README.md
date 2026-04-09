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

---

## 🍏 The Mac AI Ecosystem
This project is part of a large-scale initiative to build high-performance AI tools specifically for Apple Silicon developers. Check out our other open-source adaptations:

- [🍏 **LLM Env Selector**](https://github.com/helgklaizar/llm-env-selector) — The ultimate UI configurator.
- [🌉 **CUDA2MLX Bridge**](https://github.com/helgklaizar/cuda2mlx-bridge) — Drop-in replacement for CUDA projects.
- [🚀 **TurboQuant MLX**](https://github.com/helgklaizar/turboquant_mlx) — Extreme KV Cache Compression (1-3 bit).
- [🔥 **Flamegraph-MLX**](https://github.com/helgklaizar/flamegraph-mlx) — Energy UI profiler for neural networks.
- [🧠 **APFS Vector Indexer**](https://github.com/helgklaizar/apfs-rag-indexer) — Native system RAG with zero battery drain.
- [⚒️ **Forge-MLX**](https://github.com/helgklaizar/forge-mlx) — Blazing-fast memory-efficient LLM Fine-Tuning.
- [🔳 **BitNet-MLX**](https://github.com/helgklaizar/bitnet-mlx) — Native Ternary (1.58-bit) Matrix Multiplication Kernels.
- [👁️ **OmniParser-MLX**](https://github.com/helgklaizar/omni-parser-mlx) — Blazing-fast visual GUI agent.
- [⚡️ **Flash-Attention-MLX**](https://github.com/helgklaizar/flash-attention-mlx) — Native FA3 for Metal.
- [🌿 **SageAttention-MLX**](https://github.com/helgklaizar/sage-attention-mlx) — 5x faster quantized attention.
- [🧬 **Attention-Matching-MLX**](https://github.com/helgklaizar/attention-matching-mlx) — 50x context compression.
- [🚀 **RocketKV-MLX**](https://github.com/helgklaizar/rocket-kv-mlx) — 400x extreme pruning.
- [📡 **KVTC-MLX**](https://github.com/helgklaizar/kvtc-mlx) — Transform coding for KV cache.
- [🌌 **AETHER-MLX**](https://github.com/helgklaizar/aether-mlx) — Geometric Sparse Attention.
- [🌌 **DeepSeek-MLX**](https://github.com/helgklaizar/deepseek-mlx) — Massive 671B model inference on Mac.
- [🎞 **Open-Sora-MLX**](https://github.com/helgklaizar/open-sora-mlx) — Text-to-Video generation pipeline.
- [🗣 **Moshi-Voice-MLX**](https://github.com/helgklaizar/moshi-voice-mlx) — Realtime Voice-to-Voice agents.
- [🎲 **MCTS-RL-MLX**](https://github.com/helgklaizar/mcts-rl-mlx) — Highly parallel MCTS framework.

