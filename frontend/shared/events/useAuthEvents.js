import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';

/**
 * Слушает события авторизации TDLib.
 * Монтируется один раз в App.
 */
export function useAuthEvents() {
    useEffect(() => {
        const unAuth = listen('auth_update', (event) => {
            const { state } = event.payload;
            if (state) {
                const store = useAuthStore.getState();
                store.setState(state);
                store.setError(null); // Clear error on any state update
                if (state === 'ready') {
                    useUiStore.getState().setStartupPhase('loading_feed');
                }
            }
        });

        const unError = listen('auth_error', (event) => {
            console.error('TDLib Error:', event.payload);
            const msg = event.payload.message || JSON.stringify(event.payload);
            useAuthStore.getState().setError(msg);
        });

        return () => {
            unAuth.then((f) => f());
            unError.then((f) => f());
        };
    }, []);
}
