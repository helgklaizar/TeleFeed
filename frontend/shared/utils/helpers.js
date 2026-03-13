import { t as i18nT } from '../../app/i18n';
import { useI18nStore } from '../../app/i18n';

// ── Locale helper ──

function getLocale() {
    try { return useI18nStore.getState().lang === 'ru' ? 'ru' : 'en'; }
    catch { return 'ru'; }
}

// ── Text helpers ──

export function getTextFromContent(content) {
    if (!content) return '';
    const t = content['@type'];
    if (t === 'messageText') return content.text?.text || '';
    if (t === 'messagePhoto') return content.caption?.text || '';
    if (t === 'messageVideo') return content.caption?.text || '';
    if (t === 'messageAnimation') return content.caption?.text || '';
    if (t === 'messageWebPage') return content.text?.text || '';
    // Placeholder for unsupported types
    if (t === 'messageSticker') return i18nT('contentSticker');
    if (t === 'messageDocument') return i18nT('contentDocument');
    if (t === 'messageVoiceNote') return i18nT('contentVoice');
    if (t === 'messageVideoNote') return i18nT('contentVideoNote');
    if (t === 'messageAudio') return i18nT('contentAudio');
    return '';
}

export function buildPostKey(chatId, msgId) {
    return `${chatId}_${msgId}`;
}

export function formatTime(timestamp) {
    if (!timestamp) return '';
    const d = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now - d;
    const locale = getLocale();

    if (diff < 60000) return i18nT('justNow');
    if (diff < 3600000) return `${Math.floor(diff / 60000)} ${i18nT('minAgo')}`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ${i18nT('hoursAgo')}`;

    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

export function formatTimeShort(timestamp) {
    if (!timestamp) return '';
    const d = new Date(timestamp * 1000);
    const locale = getLocale();
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

export function formatDatePrefix(timestamp) {
    if (!timestamp) return '';
    const d = new Date(timestamp * 1000);
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yy}.${mm}.${dd} ${hh}:${min}`;
}

// ── HTML sanitization ──

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ── Entities rendering ──

export function renderEntities(text, entities) {
    if (!entities || entities.length === 0) return escapeHtml(text);

    const sorted = [...entities].sort((a, b) => a.offset - b.offset);
    const parts = [];
    let lastIndex = 0;

    for (const entity of sorted) {
        const { offset, length } = entity;
        const entityType = entity.type?.['@type'] || '';

        if (offset > lastIndex) {
            parts.push(escapeHtml(text.slice(lastIndex, offset)));
        }

        const chunk = text.slice(offset, offset + length);
        const safeChunk = escapeHtml(chunk);

        switch (entityType) {
            case 'textEntityTypeBold':
                parts.push(`<b>${safeChunk}</b>`);
                break;
            case 'textEntityTypeItalic':
                parts.push(`<i>${safeChunk}</i>`);
                break;
            case 'textEntityTypeCode':
            case 'textEntityTypePre':
                parts.push(`<code>${safeChunk}</code>`);
                break;
            case 'textEntityTypeUrl':
                parts.push(`<a href="${safeChunk}" target="_blank" rel="noopener">${safeChunk}</a>`);
                break;
            case 'textEntityTypeTextUrl':
                parts.push(`<a href="${escapeHtml(entity.type.url)}" target="_blank" rel="noopener">${safeChunk}</a>`);
                break;
            case 'textEntityTypeMention':
                parts.push(`<a href="https://t.me/${escapeHtml(chunk.replace('@', ''))}" target="_blank" rel="noopener">${safeChunk}</a>`);
                break;
            default:
                parts.push(safeChunk);
        }

        lastIndex = offset + length;
    }

    if (lastIndex < text.length) {
        parts.push(escapeHtml(text.slice(lastIndex)));
    }

    return parts.join('');
}
