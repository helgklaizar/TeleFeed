import { useCallback } from 'react';
import { usePostActionsStore } from '../../../stores/postActionsStore';
import { useUiStore } from '../../../stores/uiStore';
import { ipcMarkAsRead, ipcForwardToStena, ipcDeleteLocalFile } from '../../../shared/ipc/index';
import { buildPostKey } from '../../../shared/utils/helpers';
import { showToast } from '../../../stores/toastStore';
import { t } from '../../../app/i18n';

/**
 * Единый хук для действий с постами ленты.
 * Используется и в tiktok-режиме (FeedPage) и в обычном (ChannelsPage).
 */
export function useFeedActions() {
    const addHidden    = usePostActionsStore((s) => s.addHidden);
    const addFavorite  = usePostActionsStore((s) => s.addFavorite);
    const removeFavorite = usePostActionsStore((s) => s.removeFavorite);
    const favoritePosts  = usePostActionsStore((s) => s.favoritePosts);
    const triggerFlashEye  = useUiStore((s) => s.triggerFlashEye);
    const triggerFlashHeart = useUiStore((s) => s.triggerFlashHeart);

    /** Пометить как прочитанное — скрыть из ленты + IPC */
    const handleMarkAsRead = useCallback(async (chatId, messageIds, mediaFileIds = []) => {
        const keys = messageIds.map((id) => buildPostKey(chatId, id));
        keys.forEach((k) => addHidden(k));
        triggerFlashEye();
        try {
            await ipcMarkAsRead(chatId, messageIds);
        } catch (e) {
            console.error(e);
            showToast(t('actionFailed'), { type: 'error' });
        }
        for (const fileId of mediaFileIds) {
            ipcDeleteLocalFile(fileId).catch(() => {});
        }
    }, [addHidden, triggerFlashEye]);

    /** Добавить/убрать из избранного + форвард в Saved Messages */
    const handleToggleFavorite = useCallback(async (chatId, messageIds) => {
        const keys = messageIds.map((id) => buildPostKey(chatId, id));
        const firstKey = keys[0];

        if (favoritePosts.has(firstKey)) {
            keys.forEach((k) => removeFavorite(k));
            triggerFlashHeart();
            return;
        }

        keys.forEach((k) => addFavorite(k));
        triggerFlashHeart();

        const profile = useUiStore.getState().profile;
        if (profile?.userId) {
            try {
                await ipcForwardToStena(profile.userId, chatId, messageIds);
            } catch (e) {
                console.error(e);
                showToast(t('actionFailed'), { type: 'error' });
            }
        }
        keys.forEach((k) => addHidden(k));
    }, [favoritePosts, addFavorite, removeFavorite, addHidden, triggerFlashHeart]);

    return { handleMarkAsRead, handleToggleFavorite, favoritePosts };
}
