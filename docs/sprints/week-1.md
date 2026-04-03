# Текущий спринт (Week 1 / History)

## Архив (Что делали последним: 2026-03-25)
- Исправлены баги пагинации в `feedStore.js` при запросе `get_new_since` (используются физически крайние посты альбома).
- Graceful TDLib Shutdown: добавлен CancellationToken. Закрытие `tokio` дожидается ответа `authorizationStateClosed`.
- Интеграция TypeScript для Vite и слоя `shared/ipc`.
- Unit-тесты (Vitest) покрывают все сторы на 100%.
- Рефакторинг Backend модулей (`handlers.rs` разбит на логические блоки).
- Мастер-аудит (lint warnings 9 → 0).

## Следующие задачи
*Бэклог пуст! Проект стабилен.*
