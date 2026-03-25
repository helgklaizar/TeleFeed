import { describe, it, expect, beforeEach } from 'vitest';
import { useFileStore } from '../features/media/stores/fileStore';

describe('fileStore', () => {
    beforeEach(() => {
        useFileStore.setState({ files: {}, _order: [] });
    });

    it('updateFile adds a file and maintains LRU order', () => {
        useFileStore.getState().updateFile({ id: 1, path: '/tmp/1' });
        useFileStore.getState().updateFile({ id: 2, path: '/tmp/2' });
        useFileStore.getState().updateFile({ id: 1, path: '/tmp/new1' }); // update 1

        const state = useFileStore.getState();
        expect(state.files[1].path).toBe('/tmp/new1');
        // 1 moved to the end of LRU
        expect(state._order).toEqual([2, 1]);
    });

    it('evictFiles removes files and clears order array', () => {
        useFileStore.getState().updateFile({ id: 10 });
        useFileStore.getState().updateFile({ id: 20 });
        
        useFileStore.getState().evictFiles([10]);

        const state = useFileStore.getState();
        expect(state.files[10]).toBeUndefined();
        expect(state.files[20]).toBeDefined();
        expect(state._order).toEqual([20]);
    });
});
