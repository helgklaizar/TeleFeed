# TeleFeed API & IPC

В данном документе описываются контракты взаимодействия между Frontend (React/Next.js) и Backend (Tauri / Rust).

## Tauri Commands (IPC)
_Список команд пока не заполнен. Добавлять по мере реализации прокидывания Rust-функций во фронтенд через `#[tauri::command]`._

### Пример
```typescript
import { invoke } from '@tauri-apps/api/tauri'
// const result = await invoke('my_custom_command', { arg: 'value' })
```

## REST API (если есть)
_Спецификация отсутствует, так как проект использует нативные вызовы._
