# 📋 Список задач по качеству кода Rust (Rust-Doctor)
**Проект**: `tele-feed/backend`
**Путь к проекту**: `/Users/klaizar/Projects/PROD/tele-feed/backend`

## Состояние здоровья проекта: 🟢 **95/100** (Great)
- 🔴 **Всего проблем**: 331
  - 🚨 **Критические ошибки**: 1
  - ⚠️ **Предупреждения**: 285
  - ℹ️ **Информационные**: 45
- 📂 **Затронуто файлов**: 22

---

## 🚨 Критические ошибки (Исправить в первую очередь)

1. **blocking-in-async** в `src/ipc/system.rs:30:26`
   - **Проблема**: Blocking call `std::fs::read_to_string` inside async context
   - **Решение**: Use `tokio::fs::read_to_string` instead

## 🔍 Проблемы по категориям

### 📂 Стиль и форматирование (Style) (114 проблем)

- **clippy::semicolon_if_nothing_returned** — *consider adding a `;` to the last statement for consistent formatting*
  - *Рекомендация по исправлению*: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.95.0/index.html#semicolon_if_nothing_returned
  - *Места возникновения* (3):
    - `build.rs:2`
    - `src/main.rs:5`
    - `src/tdlib/handlers/mod.rs:31`

- **clippy::assign_op_pattern** — *manual implementation of an assign operation*
  - *Рекомендация по исправлению*: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.95.0/index.html#assign_op_pattern
  - *Места возникновения* (1):
    - `src/feed_cache.rs:44`

- **clippy::doc_markdown** — *item in documentation is missing backticks*
  - *Рекомендация по исправлению*: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.95.0/index.html#doc_markdown
  - *Места возникновения* (17):
    - `src/feed_cache.rs:18`
    - `src/feed_cache.rs:18`
    - `src/feed_cache.rs:21`
    - `src/feed_cache.rs:24`
    - `src/feed_cache.rs:24`
    - `src/feed_cache.rs:24`
    - `src/feed_cache.rs:27`
    - `src/feed_cache.rs:27`
    - `src/feed_cache.rs:31`
    - `src/feed_cache.rs:192`
    - ... и еще 7 мест(а)

- **clippy::if_not_else** — *unnecessary `!=` operation*
  - *Рекомендация по исправлению*: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.95.0/index.html#if_not_else
  - *Места возникновения* (2):
    - `src/feed_cache.rs:250`
    - `src/feed_cache.rs:334`

- **clippy::significant_drop_tightening** — *temporary with significant `Drop` can be early dropped*
  - *Рекомендация по исправлению*: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.95.0/index.html#significant_drop_tightening
  - *Места возникновения* (26):
    - `src/feed_cache.rs:111`
    - `src/feed_cache.rs:156`
    - `src/feed_cache.rs:215`
    - `src/feed_cache.rs:308`
    - `src/feed_cache.rs:309`
    - `src/ipc/auth.rs:12`
    - `src/ipc/auth.rs:29`
    - `src/ipc/auth.rs:38`
    - `src/ipc/auth.rs:47`
    - `src/ipc/chat.rs:10`
    - ... и еще 16 мест(а)

- **clippy::single_option_map** — *`fn` that only maps over argument*
  - *Рекомендация по исправлению*: move the `.map` to the caller or to an `_opt` function
  - *Места возникновения* (1):
    - `src/feed_cache.rs:194`

- **clippy::uninlined_format_args** — *variables can be used directly in the `format!` string*
  - *Рекомендация по исправлению*: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.95.0/index.html#uninlined_format_args
  - *Места возникновения* (20):
    - `src/feed_cache.rs:251`
    - `src/feed_cache.rs:335`
    - `src/ipc/system.rs:45`
    - `src/ipc/system.rs:46`
    - `src/ipc/system.rs:48`
    - `src/ipc/system.rs:60`
    - `src/ipc/system.rs:65`
    - `src/mobile_server.rs:51`
    - `src/mobile_server.rs:55`
    - `src/tdlib/handlers/auth.rs:12`
    - ... и еще 10 мест(а)

- **clippy::unreachable** — *usage of the `unreachable!` macro*
  - *Рекомендация по исправлению*: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.95.0/index.html#unreachable
  - *Места возникновения* (21):
    - `src/ipc/auth.rs:11`
    - `src/ipc/auth.rs:28`
    - `src/ipc/auth.rs:37`
    - `src/ipc/auth.rs:46`
    - `src/ipc/chat.rs:9`
    - `src/ipc/chat.rs:23`
    - `src/ipc/chat.rs:36`
    - `src/ipc/chat.rs:45`
    - `src/ipc/chat.rs:59`
    - `src/ipc/chat.rs:68`
    - ... и еще 11 мест(а)

- **unused_imports** — *unused import: `serde_json::json`*
  - *Рекомендация по исправлению*: remove the whole `use` item
  - *Места возникновения* (2):
    - `src/ipc/auth.rs:2`
    - `src/tdlib/handlers/feed.rs:2`

- **unused_variables** — *unused variable: `fallback`*
  - *Рекомендация по исправлению*: if this is intentional, prefix it with an underscore
  - *Места возникновения* (1):
    - `src/ipc/feed.rs:14`

- **clippy::missing_panics_doc** — *docs for function which may panic missing `# Panics` section*
  - *Рекомендация по исправлению*: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.95.0/index.html#missing_panics_doc
  - *Места возникновения* (1):
    - `src/lib.rs:24`

- **clippy::case_sensitive_file_extension_comparisons** — *case-sensitive file extension comparison*
  - *Рекомендация по исправлению*: consider using a case-insensitive comparison instead
  - *Места возникновения* (6):
    - `src/mobile_server.rs:126`
    - `src/mobile_server.rs:126`
    - `src/mobile_server.rs:128`
    - `src/mobile_server.rs:130`
    - `src/mobile_server.rs:132`
    - `src/mobile_server.rs:134`

- **dead_code** — *struct `UserProfile` is never constructed*
  - *Рекомендация по исправлению*: warning: struct `UserProfile` is never constructed
 --> src/models.rs:6:12
  |
6 | pub struct UserProfile {
  |            ^^^^^^^^^^^
  |
  = note: `#[warn(dead_code)]` (part of `#[warn(unused)]`) on by default


  - *Места возникновения* (4):
    - `src/models.rs:6`
    - `src/models.rs:16`
    - `src/models.rs:25`
    - `src/services/feed.rs:15`

- **clippy::missing_const_for_fn** — *this could be a `const fn`*
  - *Рекомендация по исправлению*: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.95.0/index.html#missing_const_for_fn
  - *Места возникновения* (3):
    - `src/services/auth.rs:9`
    - `src/services/chat.rs:10`
    - `src/services/feed.rs:11`

- **clippy::manual_let_else** — *this could be rewritten as `let...else`*
  - *Рекомендация по исправлению*: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.95.0/index.html#manual_let_else
  - *Места возникновения* (2):
    - `src/tdlib/handlers/auth.rs:8`
    - `src/tdlib/handlers/mod.rs:12`

- **clippy::duration_suboptimal_units** — *constructing a `Duration` using a smaller unit when a larger unit would be more readable*
  - *Рекомендация по исправлению*: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.95.0/index.html#duration_suboptimal_units
  - *Места возникновения* (1):
    - `src/tdlib/handlers/chats.rs:16`

- **clippy::redundant_closure_for_method_calls** — *redundant closure*
  - *Рекомендация по исправлению*: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.95.0/index.html#redundant_closure_for_method_calls
  - *Места возникновения* (2):
    - `src/tdlib/handlers/chats.rs:183`
    - `src/tdlib/handlers/chats.rs:224`

- **clippy::match_same_arms** — *these match arms have identical bodies*
  - *Рекомендация по исправлению*: if this is unintentional make the arms return different values
  - *Места возникновения* (1):
    - `src/tdlib/handlers/common.rs:22`

### 📂 Обработка ошибок (Error Handling) (99 проблем)

- **clippy::indexing_slicing** — *indexing may panic*
  - *Рекомендация по исправлению*: consider using `.get(n)` or `.get_mut(n)` instead
  - *Места возникновения* (28):
    - `src/feed_cache.rs:106`
    - `src/feed_cache.rs:127`
    - `src/feed_cache.rs:147`
    - `src/feed_cache.rs:151`
    - `src/feed_cache.rs:152`
    - `src/feed_cache.rs:270`
    - `src/feed_cache.rs:294`
    - `src/feed_cache.rs:341`
    - `src/feed_cache.rs:355`
    - `src/feed_cache.rs:375`
    - ... и еще 18 мест(а)

- **clippy::unwrap_used** — *used `unwrap()` on an `Option` value*
  - *Рекомендация по исправлению*: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.95.0/index.html#unwrap_used
  - *Места возникновения* (30):
    - `src/feed_cache.rs:37`
    - `src/feed_cache.rs:63`
    - `src/feed_cache.rs:68`
    - `src/feed_cache.rs:74`
    - `src/feed_cache.rs:77`
    - `src/feed_cache.rs:82`
    - `src/feed_cache.rs:94`
    - `src/feed_cache.rs:95`
    - `src/feed_cache.rs:102`
    - `src/feed_cache.rs:109`
    - ... и еще 20 мест(а)

- **unwrap-in-production** — *Use of .unwrap() in production code*
  - *Рекомендация по исправлению*: Use `?` operator, `unwrap_or`, `unwrap_or_else`, or handle the error explicitly
  - *Места возникновения* (32):
    - `src/feed_cache.rs:40`
    - `src/feed_cache.rs:42`
    - `src/feed_cache.rs:63`
    - `src/feed_cache.rs:68`
    - `src/feed_cache.rs:74`
    - `src/feed_cache.rs:77`
    - `src/feed_cache.rs:82`
    - `src/feed_cache.rs:94`
    - `src/feed_cache.rs:97`
    - `src/feed_cache.rs:102`
    - ... и еще 22 мест(а)

- **clippy::exit** — *usage of `process::exit`*
  - *Рекомендация по исправлению*: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.95.0/index.html#exit
  - *Места возникновения* (3):
    - `src/ipc/system.rs:67`
    - `src/lib.rs:49`
    - `src/lib.rs:103`

- **clippy::expect_used** — *used `expect()` on a `Result` value*
  - *Рекомендация по исправлению*: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.95.0/index.html#expect_used
  - *Места возникновения* (1):
    - `src/lib.rs:28`

- **clippy::option_if_let_else** — *use Option::map_or_else instead of an if let/else*
  - *Рекомендация по исправлению*: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.95.0/index.html#option_if_let_else
  - *Места возникновения* (2):
    - `src/mobile_server.rs:124`
    - `src/tdlib/handlers/chats.rs:245`

- **clippy::map_unwrap_or** — *called `map(<f>).unwrap_or(false)` on an `Option` value*
  - *Рекомендация по исправлению*: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.95.0/index.html#map_unwrap_or
  - *Места возникновения* (3):
    - `src/tdlib/handlers/chats.rs:67`
    - `src/tdlib/handlers/chats.rs:142`
    - `src/tdlib/handlers/feed.rs:17`

### 📂 performance (49 проблем)

- **clippy::cloned_instead_of_copied** — *used `cloned` where `copied` could be used instead*
  - *Рекомендация по исправлению*: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.95.0/index.html#cloned_instead_of_copied
  - *Места возникновения* (3):
    - `src/feed_cache.rs:412`
    - `src/services/feed.rs:30`
    - `src/tdlib/handlers/chats.rs:23`

- **excessive-clone** — *`.clone()` inside a loop — may cause repeated heap allocations*
  - *Рекомендация по исправлению*: If the type implements Copy, remove .clone(). Otherwise, consider borrowing or using Cow<T>
  - *Места возникновения* (43):
    - `src/feed_cache.rs:254`
    - `src/feed_cache.rs:267`
    - `src/feed_cache.rs:338`
    - `src/feed_cache.rs:352`
    - `src/feed_cache.rs:397`
    - `src/feed_cache.rs:400`
    - `src/lib.rs:26`
    - `src/lib.rs:40`
    - `src/lib.rs:55`
    - `src/lib.rs:61`
    - ... и еще 33 мест(а)

- **clippy::needless_collect** — *avoid using `collect()` when not needed*
  - *Рекомендация по исправлению*: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.95.0/index.html#needless_collect
  - *Места возникновения* (1):
    - `src/services/feed.rs:31`

- **clippy::redundant_clone** — *redundant clone*
  - *Рекомендация по исправлению*: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.95.0/index.html#redundant_clone
  - *Места возникновения* (2):
    - `src/tdlib/handlers/auth.rs:24`
    - `src/tdlib.rs:36`

### 📂 Управление зависимостями и Cargo (Cargo) (48 проблем)

- **clippy::cargo_common_metadata** — *package `telefeed` is missing `either package.license or package.license_file` metadata*
  - *Рекомендация по исправлению*: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.95.0/index.html#cargo_common_metadata
  - *Места возникновения* (4):
    - `/Users/klaizar/Projects/prod/tele-feed/backend/clippy.toml:1`
    - `/Users/klaizar/Projects/prod/tele-feed/backend/clippy.toml:1`
    - `/Users/klaizar/Projects/prod/tele-feed/backend/clippy.toml:1`
    - `/Users/klaizar/Projects/prod/tele-feed/backend/clippy.toml:1`

- **clippy::multiple_crate_versions** — *multiple versions for dependency `base64`: 0.21.7, 0.22.1*
  - *Рекомендация по исправлению*: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.95.0/index.html#multiple_crate_versions
  - *Места возникновения* (37):
    - `/Users/klaizar/Projects/prod/tele-feed/backend/clippy.toml:1`
    - `/Users/klaizar/Projects/prod/tele-feed/backend/clippy.toml:1`
    - `/Users/klaizar/Projects/prod/tele-feed/backend/clippy.toml:1`
    - `/Users/klaizar/Projects/prod/tele-feed/backend/clippy.toml:1`
    - `/Users/klaizar/Projects/prod/tele-feed/backend/clippy.toml:1`
    - `/Users/klaizar/Projects/prod/tele-feed/backend/clippy.toml:1`
    - `/Users/klaizar/Projects/prod/tele-feed/backend/clippy.toml:1`
    - `/Users/klaizar/Projects/prod/tele-feed/backend/clippy.toml:1`
    - `/Users/klaizar/Projects/prod/tele-feed/backend/clippy.toml:1`
    - `/Users/klaizar/Projects/prod/tele-feed/backend/clippy.toml:1`
    - ... и еще 27 мест(а)

- **missing-msrv** — *No `rust-version` field in Cargo.toml — MSRV not declared*
  - *Рекомендация по исправлению*: Add `rust-version = "1.XX"` to Cargo.toml for compatibility guarantees
  - *Места возникновения* (1):
    - `Cargo.toml:None`

- **skipped-pass** — *No coverage report found. Generate one with: cargo llvm-cov --lcov --output-path target/coverage/lcov.info*
  - *Места возникновения* (6):
    - `Cargo.toml:None`
    - `Cargo.toml:None`
    - `Cargo.toml:None`
    - `Cargo.toml:None`
    - `Cargo.toml:None`
    - `Cargo.toml:None`

### 📂 security (16 проблем)

- **clippy::undocumented_unsafe_blocks** — *unsafe block missing a safety comment*
  - *Рекомендация по исправлению*: consider adding a safety comment on the preceding line
  - *Места возникновения* (5):
    - `src/tdlib.rs:87`
    - `src/tdlib.rs:89`
    - `src/tdlib.rs:91`
    - `src/tdlib.rs:121`
    - `src/tdlib.rs:144`

- **unsafe-block-audit** — *unsafe block — review for memory safety*
  - *Рекомендация по исправлению*: Document the safety invariant with a // SAFETY: comment
  - *Места возникновения* (11):
    - `src/tdlib.rs:68`
    - `src/tdlib.rs:85`
    - `src/tdlib.rs:87`
    - `src/tdlib.rs:89`
    - `src/tdlib.rs:91`
    - `src/tdlib.rs:94`
    - `src/tdlib.rs:100`
    - `src/tdlib.rs:119`
    - `src/tdlib.rs:121`
    - `src/tdlib.rs:144`
    - ... и еще 1 мест(а)

### 📂 architecture (4 проблем)

- **clippy::cognitive_complexity** — *the function has a cognitive complexity of (26/25)*
  - *Рекомендация по исправлению*: you could split it up into multiple smaller functions
  - *Места возникновения* (1):
    - `src/tdlib/handlers/chats.rs:56`

- **clippy::too_many_lines** — *this function has too many lines (180/100)*
  - *Рекомендация по исправлению*: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.95.0/index.html#too_many_lines
  - *Места возникновения* (2):
    - `src/tdlib/handlers/chats.rs:56`
    - `src/tdlib.rs:21`

- **high-cyclomatic-complexity** — *Function `handle_chat_event` has cyclomatic complexity of 36 (threshold: 15)*
  - *Рекомендация по исправлению*: Extract complex branches into helper functions, use early returns, simplify match arms
  - *Места возникновения* (1):
    - `src/tdlib/handlers/chats.rs:56`

### 📂 Асинхронное программирование (Async) (1 проблем)

- **blocking-in-async** — *Blocking call `std::fs::read_to_string` inside async context*
  - *Рекомендация по исправлению*: Use `tokio::fs::read_to_string` instead
  - *Места возникновения* (1):
    - `src/ipc/system.rs:30`

