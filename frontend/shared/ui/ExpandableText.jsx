import { useState, useMemo, useCallback } from 'react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { renderEntities } from '../utils/helpers';

const CHAR_LIMIT = 1200;

/** Обрабатывает клик на <a> внутри текста — открывает через Tauri */
function handleLinkClick(e) {
    const anchor = e.target.closest('a');
    if (!anchor) return;
    e.preventDefault();
    e.stopPropagation();
    const href = anchor.getAttribute('href');
    if (href && href !== '#') openUrl(href).catch(() => { });
}

/**
 * Текст с entities. Раскрывается/скрывается по клику (без кнопок).
 */
export function ExpandableText({ text, entities, style = {}, onToggle }) {
    const [expanded, setExpanded] = useState(false);

    const fullHtml = useMemo(() => {
        if (!text) return '';
        return renderEntities(text, entities);
    }, [text, entities]);

    const handleClick = useCallback((e) => {
        if (e.target.closest('a')) {
            handleLinkClick(e);
            return;
        }
        setExpanded((v) => {
            const next = !v;
            onToggle?.(next);
            return next;
        });
    }, [onToggle]);

    if (!text) return null;

    const isTruncatable = text.length > CHAR_LIMIT;

    if (!isTruncatable) {
        return (
            <div className="expandable-text" style={style} onClick={handleLinkClick}>
                <span dangerouslySetInnerHTML={{ __html: fullHtml }} />
            </div>
        );
    }

    if (expanded) {
        return (
            <div
                className="expandable-text"
                style={{ ...style, cursor: 'pointer' }}
                onClick={handleClick}
            >
                <span dangerouslySetInnerHTML={{ __html: fullHtml }} />
            </div>
        );
    }

    let cutoff = CHAR_LIMIT;
    if (cutoff < text.length) {
        const lastSpace = text.lastIndexOf(' ', cutoff);
        if (lastSpace > CHAR_LIMIT - 100) {
            cutoff = lastSpace;
        }
    }
    const truncatedText = text.slice(0, cutoff) + '…';
    const truncatedHtml = renderEntities(truncatedText, entities);

    return (
        <div
            className="expandable-text truncated"
            style={{ ...style, cursor: 'pointer' }}
            onClick={handleClick}
        >
            <span dangerouslySetInnerHTML={{ __html: truncatedHtml }} />
        </div>
    );
}
