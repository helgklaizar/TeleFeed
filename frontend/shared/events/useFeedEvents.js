import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useFeedStore } from '../../features/feed/stores/feedStore';

/**
 * Слушает feed_updated — событие батчинга из Rust (не чаще раза в 500ms).
 * Монтируется один раз в App.
 */
export function useFeedEvents() {
    useEffect(() => {
        const unFeed = listen('feed_updated', () => {
            useFeedStore.getState().handleFeedUpdated();
        });

        return () => {
            unFeed.then((f) => f());
        };
    }, []);
}
