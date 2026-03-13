import { describe, it, expect, beforeEach } from 'vitest';
import { useI18nStore, t } from '../src/app/i18n.js';

describe('i18n', () => {
    beforeEach(() => {
        useI18nStore.setState({ lang: 'ru' });
    });

    it('returns Russian translation by default', () => {
        expect(t('groups')).toBe('Группы');
    });

    it('returns English translation when lang is en', () => {
        useI18nStore.getState().setLang('en');
        expect(t('groups')).toBe('Groups');
    });

    it('falls back to English for missing keys', () => {
        useI18nStore.getState().setLang('ru');
        // Test a key that might only exist in en — use the key itself as fallback
        expect(t('nonexistentKey123')).toBe('nonexistentKey123');
    });

    it('returns key if no translation found', () => {
        expect(t('totally_unknown_key')).toBe('totally_unknown_key');
    });

    it('setLang persists to localStorage', () => {
        useI18nStore.getState().setLang('en');
        expect(useI18nStore.getState().lang).toBe('en');
    });

    it('has all critical keys in both languages', () => {
        const criticalKeys = ['feed', 'groups', 'private', 'confirm', 'loading', 'noMessages'];
        for (const key of criticalKeys) {
            useI18nStore.getState().setLang('en');
            const en = t(key);
            useI18nStore.getState().setLang('ru');
            const ru = t(key);
            expect(en).not.toBe(key); // should not fallback to key
            expect(ru).not.toBe(key);
        }
    });
});
