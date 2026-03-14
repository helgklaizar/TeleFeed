import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { ipcSyncChats } from '../ipc/index';

/**
 * Слушает события авторизации TDLib.
 * Монтируется один раз в App.
 */
export function useAuthEvents() {
    useEffect(() => {
        const unAuth = listen('auth_update', (event) => {
            const { state } = event.payload;
            if (state) {
                useAuthStore.getState().setState(state);
                if (state === 'ready') {
                    useUiStore.getState().setStartupPhase('syncing_chats');
                    ipcSyncChats().catch(() => { });
                }
            }
        });

        return () => {
            unAuth.then((f) => f());
        };
    }, []);
}
