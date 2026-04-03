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
- **[MILESTONE АРХИТЕКТУРЫ ПОЛНОСТЬЮ ЗАВЕРШЕН]**
  - Добито покрытие тестами фронта (`chatStore` и `feedStore`) до 82.3%.
  - Выпилен весь моковый мусор в пользу строгого нативного IPC.
  - Решена проблема с App Translocation в macOS: библиотека `libtdjson.dylib` жестко закреплена в ревизии `constraints.md`.
  - Успешно собран релизный билд (`npm run build`).

## Следующие задачи
- Сбор фидбека по продакшн сборке, наблюдение за потреблением памяти TDLib.
- Готово к новым продуктовым фичам!
