/**
 * Центральный слушатель TDLib событий.
 * Монтируется один раз в App.
 *
 * Делегирует по доменам:
 *   useAuthEvents  — авторизация
 *   useFeedEvents  — обновления ленты (feed_updated батчинг из Rust)
 *   useChatEvents  — все tdlib_event (chat, message, file, user...)
 */
export { useAuthEvents } from '../events/useAuthEvents';
export { useFeedEvents } from '../events/useFeedEvents';
export { useChatEvents } from '../events/useChatEvents';

/**
 * @deprecated Использовать отдельные хуки напрямую.
 * Оставлен для обратной совместимости.
 */
import { useAuthEvents } from '../events/useAuthEvents';
import { useFeedEvents } from '../events/useFeedEvents';
import { useChatEvents } from '../events/useChatEvents';

export function useTdlibListener() {
    useAuthEvents();
    useFeedEvents();
    useChatEvents();
}
