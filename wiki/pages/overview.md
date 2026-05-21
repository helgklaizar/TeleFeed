# Обзор проекта TeleFeed

## Описание
Десктопный клиент для чтения Telegram-каналов с единой scrollable лентой без необходимости переключаться между чатами.

## Стек технологий
Tauri v2, Rust 1.85+, TDLib (C++ Telegram library via FFI), React 19, Vite, Zustand 5, Tailwind

## Ключевые файлы и директории
- `src/` — исходный код фронтенда (FSD)
- `src-tauri/` — бэкенд на Rust
- `src-tauri/src/cache/` — BTreeMap LRU cache

## Важные особенности / Контекст
Все данные кэшируются локально через TDLib SQLite. Приложение должно обязательно находиться в папке /Applications на macOS, иначе механизм App Translocation ломает работу TDLib.
