---
description: Рутина после задачи — автоматически
---
// turbo-all
1. Запустить тесты. Если не проходят — исправить.
2. Обновить `README.md` папок которых коснулась задача.
3. Обновить Swagger/Postman если менялось API.
4. Обновить `project-info.md` если менялась архитектура/стек.
5. Сохранить итог задачи в OpenMemory (что сделано, какие решения приняты).
6. `git add -A && git commit -m "тип: описание" && git push origin main`
7. Собрать macOS-билд: `cd /Users/klai/AI/telefeed/backend && ../frontend/node_modules/.bin/tauri build 2>&1`
8. Скопировать `.app` в папку приложений: `cp -R /Users/klai/AI/telefeed/backend/target/release/bundle/macos/TeleFeed.app /Applications/TeleFeed.app`
