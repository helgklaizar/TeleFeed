# 🍏 TeleFeed Native — Архитектурный Roadmap

Добро пожаловать в проект `apple-native`. Это полностью переписанное ядро TeleFeed, избавляющее нас от "зоопарка" технологий (TypeScript + Rust + Tauri + React) в пользу чистого, эталонного Apple-Native стека (Swift, SwiftUI, Swift Package Manager).

Этот переход даёт **x10 к производительности** на чипах M-серии, **нулевой оверхед** на межпроцессное взаимодействие (IPC) и прямой доступ (через `Sendable` C++ Bridge) к официальному серверному движку Telegram (TDLib).

---

## 🟢 Фаза 1: Подготовка изолированного ядра (Done ✅)
- [x] Создание новой, чистой папки проекта `apple-native`.
- [x] Инициализация пакета `TeleFeedCore` через Swift Package Manager (SPM).
- [x] Поднятие среды SwiftUI (App, ContentView).
- [x] Использование макросов `@Observable` для реактивного стора (macOS 14+).
- [x] Написание `TDClient.swift` с использованием `actor` и `AsyncStream` для строгой изоляции потоков (Swift 6 Concurrency).

## 🟢 Фаза 2: C++ TDLib Bridging (Done ✅)
- [x] Извлечение нативной `arm64` версии библиотеки `libtdjson.dylib`.
- [x] Рукописный `td_json_client.h` и кастомный `.modulemap` для обхода Objective-C громоздкости.
- [x] Настройка `swiftSettings: [.interoperabilityMode(.Cxx)]` и прямая связь памяти Swift и C++ CString.
- [x] Инъекция библиотеки в ядро приложения без багов сборки.
- [x] Успешный тестовый запуск (Получение `updateAuthorizationState` от физических серверов TG).

---

## 🟡 Фаза 3: Система Авторизации и Парсинг (В процессе ⏳)
- [ ] **Codable-десериализация:** Создание базовых структур Swift для парсинга ответов TDLib (перехват `@type`).
- [ ] **State Machine:** Роутинг состояний `authorizationStateWaitPhoneNumber`, `authorizationStateWaitCode`, `authorizationStateWaitPassword` в UI.
- [ ] **Login UI:** Верстка красивых SwiftUI экранов для ввода телефона и OTP-кода (по гайдлайнам Apple).
- [ ] **Local Storage:** Подключение базы данных настроек (отвечает за сохранение сессий TDLib в папку проекта).

## ⚪️ Фаза 4: Главная Лента и Чейнинг контента (Запланировано)
- [ ] Загрузка списка чатов (`getChats` -> `getChatHistory`).
- [ ] Создание высокопроизводительной прокрутки через `LazyVStack` или кастомный скроллер.
- [ ] Парсинг `text_entities` (жирный текст, ссылки, спойлеры) в нативный `AttributedString`.
- [ ] Фоновая загрузка медиа (Асинхронные картинки, `AVPlayer` для видео, кэширование на диск).

## ⚪️ Фаза 5: Оптимизация и Полировка качества (Запланировано)
- [ ] Внедрение кастомного `WindowGroup` с эффектами *Glassmorphism* (Materials).
- [ ] Анимации перехода (`.matchedGeometryEffect`), микро-анимации лайков.
- [ ] Оптимизация памяти (Memory Graph) для тысяч сообщений в ленте.
