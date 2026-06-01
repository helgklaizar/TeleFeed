# 📋 Список задач по качеству кода Python (Python-Doctor)
**Проект**: `tele-feed/extractor`
**Путь к проекту**: `/Users/klaizar/Projects/PROD/tele-feed/extractor`

## Состояние здоровья проекта: 🟡 **82/100** (Good)
- 🔴 **Всего проблем**: 16
  - 🚨 **Критические/Высокие**: 1
  - ⚠️ **Средние (Warnings)**: 11
  - ℹ️ **Низкие (Info/Low)**: 4
- 📂 **Затронуто файлов**: 2

---

## 🚨 Критические ошибки (Исправить в первую очередь)

1. **ruff/F541** в `Users/klaizar/Projects/prod/tele-feed/extractor/extract_folder.py:73`
   - **Проблема**: f-string without any placeholders

## 🔍 Проблемы по категориям

### 📂 Безопасность (Security) (Оценка: 23/25, проблем: 4)

- **bandit/B404** — *Consider possible security implications associated with the subprocess module.*
  - *Места возникновения* (2):
    - `Users/klaizar/Projects/prod/tele-feed/extractor/ext_groups.py:6`
    - `Users/klaizar/Projects/prod/tele-feed/extractor/extract_folder.py:5`

- **bandit/B603** — *subprocess call - check for execution of untrusted input.*
  - *Места возникновения* (2):
    - `Users/klaizar/Projects/prod/tele-feed/extractor/ext_groups.py:84`
    - `Users/klaizar/Projects/prod/tele-feed/extractor/extract_folder.py:80`

### 📂 Линтинг и синтаксис (Lint) (Оценка: 19/20, проблем: 1)

- **ruff/F541** — *f-string without any placeholders*
  - *Места возникновения* (1):
    - `Users/klaizar/Projects/prod/tele-feed/extractor/extract_folder.py:73`

### 📂 Сложность кода (Complexity) (Оценка: 12/15, проблем: 2)

- **radon/CC23** — *Function 'main' has complexity 23*
  - *Места возникновения* (1):
    - `Users/klaizar/Projects/prod/tele-feed/extractor/extract_folder.py:13`

- **radon/CC31** — *Function 'main' has complexity 31*
  - *Места возникновения* (1):
    - `Users/klaizar/Projects/prod/tele-feed/extractor/ext_groups.py:13`

### 📂 Структура проекта (Structure) (Оценка: 0/10, проблем: 7)

- **structure/no-tests** — *No tests directory or test files found*
  - *Места возникновения* (1):
    - `Project:0`

- **structure/type-hints** — *No type hints found in 100% of files*
  - *Места возникновения* (1):
    - `Project:0`

- **structure/no-readme** — *No README found*
  - *Места возникновения* (1):
    - `Project:0`

- **structure/no-license** — *No LICENSE file found*
  - *Места возникновения* (1):
    - `Project:0`

- **structure/no-gitignore** — *No .gitignore found*
  - *Места возникновения* (1):
    - `Project:0`

- **structure/no-linter-config** — *No linter configuration found*
  - *Места возникновения* (1):
    - `Project:0`

- **structure/no-type-checker** — *No type checker configuration found*
  - *Места возникновения* (1):
    - `Project:0`

### 📂 Дзен Python (Zen of Python) (Оценка: 13/15, проблем: 2)

- **zen/deep-nesting** — *Function 'main' has nesting depth 6 (max 5)*
  - *Места возникновения* (1):
    - `Users/klaizar/Projects/prod/tele-feed/extractor/ext_groups.py:13`

- **zen/long-function** — *Function 'main' is 79 lines (max 75)*
  - *Места возникновения* (1):
    - `Users/klaizar/Projects/prod/tele-feed/extractor/ext_groups.py:13`

### 📂 Импорты (Imports) (Оценка: 5/5, проблем: 0)

✨ Проблем в этой категории не обнаружено.

### 📂 Обработка исключений (Exceptions) (Оценка: 10/10, проблем: 0)

✨ Проблем в этой категории не обнаружено.

