import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePostActionsStore } from '../stores/postActionsStore';

describe('postActionsStore', () => {
    let store = {};
    beforeEach(() => {
        store = {};
        vi.stubGlobal('localStorage', {
            getItem: (key) => store[key] || null,
            setItem: (key, val) => { store[key] = val.toString(); },
            clear: () => { store = {}; }
        });
        localStorage.clear();
        usePostActionsStore.setState({
            hiddenPosts: new Set(),
            favoritePosts: new Set(),
            blacklist: []
        });
    });

    it('addFavorite adds post to favorites and localStorage', () => {
        usePostActionsStore.getState().addFavorite('post_123');
        
        expect(usePostActionsStore.getState().favoritePosts.has('post_123')).toBe(true);
        expect(JSON.parse(localStorage.getItem('tg_favorites'))).toContain('post_123');
    });

    it('removeFavorite removes post from favorites', () => {
        usePostActionsStore.getState().addFavorite('post_123');
        usePostActionsStore.getState().removeFavorite('post_123');
        
        expect(usePostActionsStore.getState().favoritePosts.has('post_123')).toBe(false);
        expect(JSON.parse(localStorage.getItem('tg_favorites'))).not.toContain('post_123');
    });

    it('addHidden adds post to hidden', () => {
        usePostActionsStore.getState().addHidden('hidden_456');
        
        expect(usePostActionsStore.getState().hiddenPosts.has('hidden_456')).toBe(true);
        expect(JSON.parse(localStorage.getItem('tg_hidden'))).toContain('hidden_456');
    });

    it('addToBlacklist adds chat to blacklist', () => {
        usePostActionsStore.getState().addToBlacklist(777);
        
        expect(usePostActionsStore.getState().blacklist).toContain('777');
        expect(JSON.parse(localStorage.getItem('tg_blacklist'))).toContain('777');
    });
});
