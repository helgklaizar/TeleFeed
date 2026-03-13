import { describe, it, expect } from 'vitest';
import {
    getTextFromContent,
    buildPostKey,
    formatTime,
    formatTimeShort,
    formatDatePrefix,
    shiftEntities,
    renderEntities,
} from '../frontend/shared/utils/helpers.js';

describe('getTextFromContent', () => {
    it('returns empty string for null/undefined', () => {
        expect(getTextFromContent(null)).toBe('');
        expect(getTextFromContent(undefined)).toBe('');
    });

    it('extracts text from messageText', () => {
        expect(getTextFromContent({
            '@type': 'messageText',
            text: { text: 'Hello world' },
        })).toBe('Hello world');
    });

    it('extracts caption from messagePhoto', () => {
        expect(getTextFromContent({
            '@type': 'messagePhoto',
            caption: { text: 'Nice photo' },
        })).toBe('Nice photo');
    });

    it('extracts caption from messageVideo', () => {
        expect(getTextFromContent({
            '@type': 'messageVideo',
            caption: { text: 'Cool vid' },
        })).toBe('Cool vid');
    });

    it('extracts caption from messageAnimation', () => {
        expect(getTextFromContent({
            '@type': 'messageAnimation',
            caption: { text: 'GIF!' },
        })).toBe('GIF!');
    });

    it('returns placeholder for sticker type', () => {
        expect(getTextFromContent({ '@type': 'messageSticker' })).toBe('🎨 Sticker');
    });
});

describe('buildPostKey', () => {
    it('creates key from chatId and msgId', () => {
        expect(buildPostKey(123, 456)).toBe('123_456');
    });

    it('handles negative chatIds', () => {
        expect(buildPostKey(-100123, 789)).toBe('-100123_789');
    });
});

describe('formatTime', () => {
    it('returns empty for no timestamp', () => {
        expect(formatTime(null)).toBe('');
        expect(formatTime(0)).toBe('');
    });

    it('returns "just now" for recent timestamps', () => {
        const now = Math.floor(Date.now() / 1000) - 10;
        expect(formatTime(now)).toBe('just now');
    });

    it('returns minutes for < 1h', () => {
        const fiveMinAgo = Math.floor(Date.now() / 1000) - 300;
        expect(formatTime(fiveMinAgo)).toMatch(/5 min/);
    });
});

describe('formatTimeShort', () => {
    it('returns empty for no timestamp', () => {
        expect(formatTimeShort(null)).toBe('');
    });

    it('returns HH:MM format', () => {
        const ts = Math.floor(Date.now() / 1000);
        const result = formatTimeShort(ts);
        expect(result).toMatch(/\d{2}:\d{2}/);
    });
});

describe('formatDatePrefix', () => {
    it('returns empty for no timestamp', () => {
        expect(formatDatePrefix(null)).toBe('');
    });

    it('returns formatted date', () => {
        // 2024-01-15 14:30 UTC
        const ts = 1705325400;
        const result = formatDatePrefix(ts);
        expect(result).toMatch(/24\.01\.15/);
    });
});

describe('shiftEntities', () => {
    it('returns unchanged for empty/null', () => {
        expect(shiftEntities(null, 5)).toBe(null);
        expect(shiftEntities([], 5)).toEqual([]);
    });

    it('shifts offsets by given amount', () => {
        const entities = [
            { offset: 0, length: 3 },
            { offset: 10, length: 5 },
        ];
        const result = shiftEntities(entities, 7);
        expect(result[0].offset).toBe(7);
        expect(result[1].offset).toBe(17);
    });

    it('preserves original entities', () => {
        const entities = [{ offset: 5, length: 2 }];
        shiftEntities(entities, 3);
        expect(entities[0].offset).toBe(5); // original unchanged
    });
});

describe('renderEntities', () => {
    it('returns escaped text with no entities', () => {
        expect(renderEntities('Hello <world>', [])).toBe('Hello &lt;world&gt;');
    });

    it('wraps bold entities', () => {
        const result = renderEntities('Hello world', [
            { offset: 6, length: 5, type: { '@type': 'textEntityTypeBold' } },
        ]);
        expect(result).toBe('Hello <b>world</b>');
    });

    it('wraps URLs', () => {
        const result = renderEntities('Go to https://example.com now', [
            { offset: 6, length: 19, type: { '@type': 'textEntityTypeUrl' } },
        ]);
        expect(result).toContain('href="https://example.com"');
    });

    it('wraps text URLs', () => {
        const result = renderEntities('click here', [
            { offset: 0, length: 10, type: { '@type': 'textEntityTypeTextUrl', url: 'https://example.com' } },
        ]);
        expect(result).toContain('href="https://example.com"');
        expect(result).toContain('click here');
    });

    it('handles mentions', () => {
        const result = renderEntities('@durov', [
            { offset: 0, length: 6, type: { '@type': 'textEntityTypeMention' } },
        ]);
        expect(result).toContain('href="https://t.me/durov"');
    });

    it('escapes HTML in entities', () => {
        const result = renderEntities('<script>alert(1)</script>', [
            { offset: 0, length: 25, type: { '@type': 'textEntityTypeBold' } },
        ]);
        expect(result).not.toContain('<script>');
        expect(result).toContain('&lt;script&gt;');
    });
});
