# TeleFeed — Индекс проекта

## 📌 Суть и Стек
Нативный клиент Telegram с умной лентой. Стек (Tauri, React, Rust) вынесен в [stack.md](./.gemini/rules/stack.md).

## 🛑 Ограничения
Архитектурные ограничения лежат в [constraints.md](./.gemini/rules/constraints.md).
*(Включая критическое правило: не удалять «неиспользуемый» @prebuilt-tdlib/darwin-arm64).*

## 🚀 Деплой и Среда (Где мы находимся)
- **Local:** `npm run tauri dev`
- **Продакшн:** Билд лежит в `target/release/bundle/macos/TeleFeed.app`.
  ⚠️ ЕГО ОБЯЗАТЕЛЬНО НУЖНО ПЕРЕТАЩИТЬ В `/Applications` перед запуском, иначе macOS App Translocation сломает инициализацию базы TDLib.
## 📚 Навигация по документации
- 🏗 **Архитектура и Layout:** `docs/architecture.md`
- 📦 **Настройки деплоя:** `docs/deploy.md`
- 📅 **Активный спринт:** `docs/sprints/week-1.md`

## Что делали последним (2026-04-03)
- Выполнили рефакторинг из TODO.md:
  - Удалили неиспользуемые зависимости фронтенда (убрали `@prebuilt-tdlib/darwin-arm64` и `@tauri-apps/plugin-http`), сэкономив размер.
  - Внедрили `useShallow` для Zustand в `AppHeader` и `ChannelsPage`, убрав излишние ререндеры из-за выборки целых сторов.
  - Подтвердили, что Code Splitting (`React.lazy` для `ChannelsPage`, `ChannelListPage`) уже успешно функционирует.
- [Патчинг тестов] Исправлен сломанный тест даты в `helpers.test.js`, а `backend` избавлен от ворнингов Clippy (`single_match`, `unused_variables`). All clean!
- **[Тесты и Билд]** Написаны unit-тесты для `chatStore` и `feedStore`. Общее покрытие `vitest coverage` доведено с 62% до 82.3%.
- **[Сборка]** Запущена новая сборка проекта (`npm run build`), генерируется свежий билд Tauri.

## Следующие задачи
1. Дальнейшая стабилизация UI ленты (если потребуется).
