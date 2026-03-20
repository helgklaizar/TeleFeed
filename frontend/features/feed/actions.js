/**
 * Единые экшены для работы с постами: mark as read, toggle favorite.
 * Использовать вместо дублирующихся реализаций в ChannelsPage и FeedPage.
 */
import { ipcMarkAsRead, ipcForwardToStena } from '../../../shared/ipc/index';
import { useUiStore } from '../../../stores/uiStore';
import { usePostActionsStore } from '../../../stores/postActionsStore';
import { showToast } from '../../../stores/toastStore';
import { buildPostKey } from '../../../shared/utils/helpers';
import { t } from '../../../app/i18n';

/**
 * Помечает пост как прочитанный и скрывает его из ленты.
 * @param {number} chatId
 * @param {number[]} messageIds  — все ID сообщений в группе/альбоме
 * @param {number[]} [mediaFileIds] — ID файлов для эвикции (опционально)
 */
export async function markPostAsRead(chatId, messageIds, _mediaFileIds = []) {
    try {
        // Скрываем в UI немедленно (оптимистично)
        const mainMsgId = messageIds[0];
        if (mainMsgId) {
            usePostActionsStore.getState().addHidden(buildPostKey(chatId, mainMsgId));
        }

        await ipcMarkAsRead(chatId, messageIds);
        useUiStore.getState().triggerFlashEye();
    } catch (err) {
        console.error('[markPostAsRead]', err);
        showToast(t('actionFailed'), { type: 'error' });
    }
}

/**
 * Добавляет/убирает пост из избранного.
 * Если добавляет — форвардит на стену.
 * Если убирает — только убирает из favoritePosts.
 * @param {number} chatId
 * @param {number[]} messageIds — все ID сообщений в группе/альбоме
 * @param {boolean} isFavorite — текущее состояние
 * @param {number|null} [stenaChatId] — ID чата-стены (null = не форвардить)
 */
export async function toggleFavoritePost(chatId, messageIds, isFavorite, stenaChatId = null) {
    const mainMsgId = messageIds[0];
    if (!mainMsgId) return;

    const key = buildPostKey(chatId, mainMsgId);
    const store = usePostActionsStore.getState();

    if (isFavorite) {
        store.removeFavorite(key);
        return;
    }

    try {
        // Добавляем оптимистично
        store.addFavorite(key);

        // Форвард на стену если есть
        if (stenaChatId) {
            await ipcForwardToStena(stenaChatId, chatId, messageIds);
        }

        useUiStore.getState().triggerFlashHeart();
    } catch (err) {
        // откат
        store.removeFavorite(key);
        console.error('[toggleFavoritePost]', err);
        showToast(t('actionFailed'), { type: 'error' });
    }
}
