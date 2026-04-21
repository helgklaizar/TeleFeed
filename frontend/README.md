# TeleFeed Frontend (React + Zustand)

This is the UI layer of the TeleFeed desktop application. Built with React 19, TailwindCSS, and Zustand for state management. Optimized for high-performance Telegram feed rendering.

## 🏗 Directory Structure
- `shared/`: Shared logic between components.
  - `ipc/`: Typified invoke-wrappers for Tauri IPC – use these everywhere.
  - `tdlib/`: Tdlib event listeners and handlers.
- `ui/`: Reusable components (ChatAvatar, Toast, ExpandableText, etc.).
- `styles/`: Global CSS tokens and layout.
- `toastStore.js`: Global toast notification store.

## 🚀 Key Rules
### IPC – Only via `shared/ipc`
Always use the typified wrappers instead of raw `invoke` calls.
### Actions – Only via `actions.js`
Avoid duplicating business logic in page components.
### Stores – No cross-dependencies
Stores should not import each other. Coordination happens through event listeners.

## 📦 State Management (What goes where)
- **Auth**: `authStore`
- **Theme/UI Style**: `uiStore`
- **User Profile**: `uiStore`
- **Post Actions (Blacklist/Favs)**: `postActionsStore`
- **Startup Phase**: `startupStore`
- **Chats & Folders**: `chatStore`
- **Chat Messages**: `messageStore`
- **Media Files**: `fileStore`
- **Feed Posts**: `feedStore`
- **Toasts**: `toastStore`
