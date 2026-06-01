# 📋 Список задач по качеству кода React (React-Doctor)
**Проект**: `tele-feed/frontend`
**Путь к проекту**: `/Users/klaizar/Projects/PROD/tele-feed/frontend`

## Состояние здоровья проекта
- 🔴 **Всего проблем**: 128
  - 🚨 **Критические ошибки**: 1
  - ⚠️ **Предупреждения**: 127
- 📂 **Затронуто файлов**: 29

---

## 🚨 Критические ошибки (Исправить в первую очередь)

1. **effect-needs-cleanup** в `app/AppHeader.jsx:70:5`
   - **Проблема**: useEffect schedules `setTimeout(...)` but never returns a cleanup — leaks the registration on every re-run and on unmount. Return a cleanup function that calls clearTimeout(...)
   - **Решение**: Return a cleanup function that releases the subscription / timer: `return () => target.removeEventListener(name, handler)` for listeners, `return () => clearInterval(id)` / `clearTimeout(id)` for timers, or `return unsubscribe` if the subscribe call already returned one

## 🔍 Проблемы по категориям

### 📂 Доступность (Accessibility) (42 проблем)

- **click-events-have-key-events** — *Visible non-interactive elements with click handlers must have a corresponding keyboard listener (`onKeyUp`, `onKeyDown`, or `onKeyPress`).*
  - *Рекомендация по исправлению*: Pair `onClick` with `onKeyUp` / `onKeyDown` / `onKeyPress` for keyboard users.
  - *Места возникновения* (11):
    - `features/feed/components/FeedCard.jsx:149`
    - `features/feed/components/FeedCard.jsx:158`
    - `features/feed/components/FeedCard.jsx:211`
    - `features/media/components/MediaFile.jsx:74`
    - `app/App.tsx:29`
    - `features/media/components/Lightbox.jsx:26`
    - `shared/ui/ExpandableText.jsx:46`
    - `shared/ui/ExpandableText.jsx:54`
    - `shared/ui/ExpandableText.jsx:75`
    - `features/media/components/VideoPlayer.jsx:211`
    - `features/media/components/VideoPlayer.jsx:250`

- **no-static-element-interactions** — *Static HTML elements with event handlers require a role — add `role="…"` or use a semantic HTML element instead.*
  - *Рекомендация по исправлению*: Static HTML elements with event handlers require a role, or use a semantic HTML element instead.
  - *Места возникновения* (10):
    - `features/feed/components/FeedCard.jsx:149`
    - `features/feed/components/FeedCard.jsx:158`
    - `features/feed/components/FeedCard.jsx:211`
    - `app/App.tsx:29`
    - `features/media/components/Lightbox.jsx:26`
    - `shared/ui/ExpandableText.jsx:46`
    - `shared/ui/ExpandableText.jsx:54`
    - `shared/ui/ExpandableText.jsx:75`
    - `features/media/components/VideoPlayer.jsx:211`
    - `features/media/components/VideoPlayer.jsx:250`

- **anchor-is-valid** — *`<a>` element is missing an `href` — anchors without `href` aren't keyboard-focusable; use `<button>` for actions.*
  - *Рекомендация по исправлению*: Anchors must have a valid destination — use `<button>` for in-page actions.
  - *Места возникновения* (1):
    - `features/feed/components/FeedCard.jsx:211`

- **control-has-associated-label** — *A control must be associated with a text label — add visible text, `aria-label`, or `aria-labelledby`.*
  - *Рекомендация по исправлению*: Every interactive control must have an accessible label.
  - *Места возникновения* (13):
    - `features/media/components/MediaFile.jsx:58`
    - `pages/AuthPage.jsx:86`
    - `pages/AuthPage.jsx:99`
    - `pages/AuthPage.jsx:198`
    - `app/App.tsx:30`
    - `app/App.tsx:36`
    - `app/App.tsx:49`
    - `features/media/components/Lightbox.jsx:34`
    - `pages/ChannelListPage.jsx:38`
    - `features/media/components/VideoPlayer.jsx:224`
    - `app/AppHeader.jsx:167`
    - `app/AppHeader.jsx:186`
    - `features/chat/components/bubbles/BaseBubbleLayout.jsx:66`

- **no-noninteractive-element-interactions** — *Non-interactive element `<img>` should not have interactive event handlers — convert to a semantic interactive element or add an interactive role.*
  - *Рекомендация по исправлению*: Move interactions to a semantic interactive element / add an interactive role.
  - *Места возникновения* (1):
    - `features/media/components/MediaFile.jsx:74`

- **no-autofocus** — *`autoFocus` should not be used — it disrupts users who expect the page focus to remain at the top of the document on load.*
  - *Рекомендация по исправлению*: Don't use `autoFocus` — it disorients users.
  - *Места возникновения* (2):
    - `pages/AuthPage.jsx:92`
    - `pages/AuthPage.jsx:204`

- **no-tiny-text** — *Font size 11px is too small — body text should be at least 12px for readability, 16px is ideal*
  - *Рекомендация по исправлению*: Use at least 12px for body content, 16px is ideal. Small text is hard to read, especially on high-DPI mobile screens
  - *Места возникновения* (2):
    - `pages/AuthPage.jsx:123`
    - `pages/AuthPage.jsx:214`

- **media-has-caption** — *`<audio>` / `<video>` must have a `<track kind="captions">` child for users who can't hear audio.*
  - *Рекомендация по исправлению*: Add `<track kind="captions">` inside every `<audio>` / `<video>`.
  - *Места возникновения* (2):
    - `features/media/components/Lightbox.jsx:34`
    - `features/media/components/VideoPlayer.jsx:224`

### 📂 Корректность (Correctness) (36 проблем)

- **client-localstorage-no-version** — *localStorage.setItem("tg_instructions", JSON.stringify(...)) — bake a version into the key (e.g. "tg_instructions:v1") so a future schema change can ignore old data instead of crashing on it*
  - *Рекомендация по исправлению*: Bake a version into the storage key (e.g. "myKey:v1"); a future schema change can ignore old data instead of crashing on it
  - *Места возникновения* (4):
    - `entities/ai/model.ts:20`
    - `stores/postActionsStore.js:49`
    - `stores/postActionsStore.js:54`
    - `entities/viewer/model.ts:61`

- **button-has-type** — *`<button>` elements must have an explicit `type` attribute.*
  - *Рекомендация по исправлению*: Set `type="button"` (or `"submit"` / `"reset"`) explicitly on every `<button>`.
  - *Места возникновения* (25):
    - `features/feed/components/FeedCard.jsx:172`
    - `features/feed/components/FeedCard.jsx:183`
    - `pages/AuthPage.jsx:114`
    - `pages/AuthPage.jsx:143`
    - `pages/AuthPage.jsx:207`
    - `app/App.tsx:30`
    - `app/App.tsx:36`
    - `app/App.tsx:49`
    - `features/media/components/Lightbox.jsx:27`
    - `pages/ChannelListPage.jsx:38`
    - `pages/ChannelListPage.jsx:64`
    - `features/media/components/VideoPlayer.jsx:240`
    - `features/media/components/VideoPlayer.jsx:261`
    - `features/media/components/VideoPlayer.jsx:279`
    - `features/media/components/VideoPlayer.jsx:307`
    - `app/AppHeader.jsx:98`
    - `app/AppHeader.jsx:110`
    - `app/AppHeader.jsx:128`
    - `app/AppHeader.jsx:143`
    - `app/AppHeader.jsx:150`
    - `app/AppHeader.jsx:158`
    - `app/AppHeader.jsx:167`
    - `app/AppHeader.jsx:186`
    - `shared/ui/ErrorBoundary.jsx:41`
    - `features/chat/components/bubbles/BaseBubbleLayout.jsx:66`

- **no-danger** — *Do not use `dangerouslySetInnerHTML` — it injects raw HTML and is a common XSS vector.*
  - *Рекомендация по исправлению*: Render trusted content as React children rather than injecting raw HTML.
  - *Места возникновения* (5):
    - `features/chat/components/bubbles/InfoBubbles.jsx:33`
    - `shared/ui/ExpandableText.jsx:47`
    - `shared/ui/ExpandableText.jsx:59`
    - `shared/ui/ExpandableText.jsx:80`
    - `features/chat/components/bubbles/MediaBubbles.jsx:117`

- **no-array-index-as-key** — *Array index "i" used as key — causes bugs when list is reordered or filtered*
  - *Рекомендация по исправлению*: Use a stable unique identifier: `key={item.id}` or `key={item.slug}` — index keys break on reorder/filter
  - *Места возникновения* (2):
    - `features/chat/components/bubbles/InfoBubbles.jsx:82`
    - `features/chat/components/bubbles/BaseBubbleLayout.jsx:27`

### 📂 Производительность (Performance) (19 проблем)

- **rerender-memo-with-default-value** — *Default prop value {} creates a new object reference every render — extract to a module-level constant*
  - *Рекомендация по исправлению*: Move to module scope: `const EMPTY_ITEMS: Item[] = []` then use as the default value
  - *Места возникновения* (5):
    - `shared/ui/ProfileAvatar.jsx:7`
    - `shared/ui/ChatAvatar.jsx:7`
    - `features/media/components/MediaFile.jsx:14`
    - `shared/ui/ExpandableText.jsx:20`
    - `features/media/components/VideoPlayer.jsx:40`

- **js-tosorted-immutable** — *[...array].sort() — use array.toSorted() for immutable sorting (ES2023)*
  - *Рекомендация по исправлению*: Use `array.toSorted()` (ES2023) instead of `[...array].sort()` for immutable sorting without the spread allocation
  - *Места возникновения* (1):
    - `shared/utils/helpers.js:97`

- **js-cache-property-access** — *entity.type.url is read 3 times inside this loop — hoist into a const at the top of the loop body*
  - *Рекомендация по исправлению*: Hoist the deep member access into a const at the top of the loop body: `const { x, y } = obj.deeply.nested`
  - *Места возникновения* (1):
    - `shared/utils/helpers.js:131`

- **rerender-state-only-in-handlers** — *useState "requested" is updated but never read in the component's return — use useRef so updates don't trigger re-renders*
  - *Рекомендация по исправлению*: Replace useState with useRef when the value is only mutated and never read in render — `ref.current = ...` updates without re-rendering the component
  - *Места возникновения* (1):
    - `features/media/components/MediaFile.jsx:15`

- **js-flatmap-filter** — *.map().filter(Boolean) iterates twice — use .flatMap() to transform and filter in a single pass*
  - *Рекомендация по исправлению*: Use `.flatMap(item => condition ? [value] : [])` — transforms and filters in a single pass instead of creating an intermediate array
  - *Места возникновения* (1):
    - `features/feed/components/AlbumGrid.jsx:11`

- **js-cache-storage** — *localStorage.getItem("tg_api_id") called multiple times — cache the result in a variable*
  - *Рекомендация по исправлению*: Cache repeated `localStorage`/`sessionStorage` reads in a local variable — each access serializes/deserializes
  - *Места возникновения* (2):
    - `pages/AuthPage.jsx:31`
    - `pages/AuthPage.jsx:32`

- **no-array-index-key** — *Array index in `key` doesn't uniquely identify the element — re-renders may use stale state.*
  - *Рекомендация по исправлению*: Use a stable, data-derived `key` instead of the array index.
  - *Места возникновения* (2):
    - `features/chat/components/bubbles/InfoBubbles.jsx:82`
    - `features/chat/components/bubbles/BaseBubbleLayout.jsx:27`

- **advanced-event-handler-refs** — *useEffect re-subscribes a "handleKey" listener every time the handler identity changes — store the handler in a ref and have the listener read `handlerRef.current()`, then drop it from the deps*
  - *Рекомендация по исправлению*: Store the handler in a ref and have the listener read `handlerRef.current()` — the subscription stays put while the latest handler is always called
  - *Места возникновения* (1):
    - `features/media/components/Lightbox.jsx:18`

- **no-long-transition-duration** — *2000ms transition is too slow for UI feedback — keep transitions under 1000ms. Use longer durations only for page-load hero animations*
  - *Рекомендация по исправлению*: Keep UI transitions under 1s — 100-150ms for instant feedback, 200-300ms for state changes, 300-500ms for layout changes. Use longer durations only for page-load hero animations
  - *Места возникновения* (1):
    - `shared/ui/StartupLoader.jsx:76`

- **no-transition-all** — *transition: "all" animates every property including layout — list only the properties you animate*
  - *Рекомендация по исправлению*: List specific properties: `transition: "opacity 200ms, transform 200ms"` — or in Tailwind use `transition-colors`, `transition-opacity`, or `transition-transform`
  - *Места возникновения* (2):
    - `shared/ui/StartupLoader.jsx:89`
    - `shared/ui/StartupLoader.jsx:116`

- **no-layout-transition-inline** — *Transitioning layout property "width" causes layout thrash every frame — use transform and opacity instead*
  - *Рекомендация по исправлению*: Use `transform` and `opacity` for transitions — they run on the compositor thread. For height animations, use `grid-template-rows: 0fr → 1fr`
  - *Места возникновения* (1):
    - `shared/ui/StartupLoader.jsx:100`

- **js-combine-iterations** — *.filter().map() iterates the array twice — combine into a single loop with .reduce() or for...of*
  - *Рекомендация по исправлению*: Combine `.map().filter()` (or similar chains) into a single pass with `.reduce()` or a `for...of` loop to avoid iterating the array twice
  - *Места возникновения* (1):
    - `shared/ui/StartupLoader.jsx:106`

### 📂 Dead Code (12 проблем)

- **unused-file** — *Unused file — not reachable from any entry point*
  - *Рекомендация по исправлению*: Delete the file if it is truly unreachable, or import it from an entry point.
  - *Места возникновения* (11):
    - `features/chat/components/BubbleMessage.jsx:0`
    - `features/chat/components/bubbles/BaseBubbleLayout.jsx:0`
    - `features/chat/components/bubbles/InfoBubbles.jsx:0`
    - `features/chat/components/bubbles/MediaBubbles.jsx:0`
    - `features/chat/components/bubbles/VoiceBubble.jsx:0`
    - `features/chat/hooks/useSenderInfo.js:0`
    - `features/feed/actions.js:0`
    - `shared/api/bindings.ts:0`
    - `shared/ui/ProfileAvatar.jsx:0`
    - `shared/ui/SenderAvatar.jsx:0`
    - `stores/startupStore.js:0`

- **unused-dependency** — *Unused dependency: `@prebuilt-tdlib/darwin-arm64`*
  - *Рекомендация по исправлению*: Remove the dependency from package.json if it is genuinely unused.
  - *Места возникновения* (1):
    - `package.json:0`

### 📂 Архитектура (Architecture) (10 проблем)

- **no-react19-deprecated-apis** — *forwardRef is no longer needed on React 19+ — refs are regular props on function components; remove forwardRef and pass ref directly*
  - *Рекомендация по исправлению*: Pass `ref` as a regular prop on function components — `forwardRef` is no longer needed in React 19+. Replace `useContext(X)` with `use(X)` for branch-aware context reads. Only enabled on projects detected as React 19+.
  - *Места возникновения* (1):
    - `features/chat/components/BubbleMessage.jsx:1`

- **no-inline-exhaustive-style** — *10 inline style properties — extract to a CSS class, CSS module, or styled component for maintainability and reuse*
  - *Рекомендация по исправлению*: Move styles to a CSS class, CSS module, Tailwind utilities, or a styled component — inline objects with many properties hurt readability and create new references every render
  - *Места возникновения* (4):
    - `pages/ChannelListPage.jsx:67`
    - `shared/ui/ErrorBoundary.jsx:24`
    - `shared/ui/StartupLoader.jsx:54`
    - `shared/ui/StartupLoader.jsx:69`

- **no-generic-handler-names** — *Non-descriptive handler name "handleClick" — name should describe what it does, not when it runs*
  - *Рекомендация по исправлению*: Rename to describe the action: e.g. `handleSubmit` → `saveUserProfile`, `handleClick` → `toggleSidebar`
  - *Места возникновения* (2):
    - `shared/ui/ExpandableText.jsx:57`
    - `shared/ui/ExpandableText.jsx:78`

- **no-multi-comp** — *Declare only one React component per file. Found extra component: VideoNoteBubble.*
  - *Рекомендация по исправлению*: Move secondary components into their own files.
  - *Места возникновения* (2):
    - `features/chat/components/bubbles/MediaBubbles.jsx:38`
    - `features/chat/components/bubbles/MediaBubbles.jsx:70`

- **no-z-index-9999** — *z-index: 9999 is arbitrarily high — use a deliberate z-index scale (1–50). Extreme values signal a stacking context problem, not a fix*
  - *Рекомендация по исправлению*: Define a z-index scale in your design tokens (e.g. dropdown: 10, modal: 20, toast: 30). Create a new stacking context with `isolation: isolate` instead of escalating values
  - *Места возникновения* (1):
    - `shared/ui/StartupLoader.jsx:57`

### 📂 Состояние и эффекты (State & Effects) (9 проблем)

- **no-adjust-state-on-prop-change** — *Avoid adjusting state when a prop changes. Instead, adjust the state directly during render, or refactor your state to avoid this need entirely.*
  - *Рекомендация по исправлению*: Adjust the state inline during render instead of via a useEffect, or refactor the state to avoid the need entirely. See https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  - *Места возникновения* (1):
    - `features/media/components/MediaFile.jsx:24`

- **no-chain-state-updates** — *Avoid chaining state changes. When possible, update all relevant state simultaneously.*
  - *Рекомендация по исправлению*: Update all related state simultaneously inside the event handler that originally fires, instead of reacting to one state update in a useEffect that writes another state. See https://react.dev/learn/you-might-not-need-an-effect#chains-of-computations
  - *Места возникновения* (1):
    - `features/media/components/MediaFile.jsx:24`

- **prefer-useReducer** — *Component "AuthPage" has 5 useState calls — consider useReducer for related state*
  - *Рекомендация по исправлению*: Group related state: `const [state, dispatch] = useReducer(reducer, { field1, field2, ... })`
  - *Места возникновения* (2):
    - `pages/AuthPage.jsx:13`
    - `features/media/components/VideoPlayer.jsx:40`

- **no-event-handler** — *Avoid using state and effects as an event handler. Instead, call the event handling code directly when the event occurs.*
  - *Рекомендация по исправлению*: Move the side effect into the event handler that triggers it, instead of guarding on its state inside a useEffect. See https://react.dev/learn/you-might-not-need-an-effect#sharing-logic-between-event-handlers
  - *Места возникновения* (3):
    - `pages/AuthPage.jsx:30`
    - `features/media/components/VideoPlayer.jsx:58`
    - `features/chat/hooks/useSenderInfo.js:7`

- **effect-needs-cleanup** — *useEffect schedules `setTimeout(...)` but never returns a cleanup — leaks the registration on every re-run and on unmount. Return a cleanup function that calls clearTimeout(...)*
  - *Рекомендация по исправлению*: Return a cleanup function that releases the subscription / timer: `return () => target.removeEventListener(name, handler)` for listeners, `return () => clearInterval(id)` / `clearTimeout(id)` for timers, or `return unsubscribe` if the subscribe call already returned one
  - *Места возникновения* (1):
    - `app/AppHeader.jsx:70`

- **no-cascading-set-state** — *3 setState calls in a single useEffect — consider using useReducer or deriving state*
  - *Рекомендация по исправлению*: Combine into useReducer: `const [state, dispatch] = useReducer(reducer, initialState)`
  - *Места возникновения* (1):
    - `shared/ui/StartupLoader.jsx:38`

