import { useState, useMemo } from 'react';
import { renderEntities } from '../utils/helpers';

const WORD_LIMIT = 60;

/**
 * Текст с entities. Раскрывается/скрывается по клику (без кнопок).
 * Jina AI async-fetch убран — работает только expand по количеству слов.
 */
export function ExpandableText({ text, entities, style = {} }) {
    const [expanded, setExpanded] = useState(false);

    const fullHtml = useMemo(() => {
        if (!text) return '';
        return renderEntities(text, entities);
    }, [text, entities]);

    if (!text) return null;

    const words = text.split(/\s+/);
    const isTruncatable = words.length > WORD_LIMIT;

    if (!isTruncatable) {
        return (
            <div className="expandable-text" style={style}>
                <span dangerouslySetInnerHTML={{ __html: fullHtml }} />
            </div>
        );
    }

    if (expanded) {
        return (
            <div
                className="expandable-text"
                style={{ ...style, cursor: 'pointer' }}
                onClick={(e) => {
                    if (e.target.tagName === 'A') return;
                    setExpanded(false);
                }}
            >
                <span dangerouslySetInnerHTML={{ __html: fullHtml }} />
            </div>
        );
    }

    const truncatedText = words.slice(0, WORD_LIMIT).join(' ') + '…';
    const truncatedHtml = renderEntities(truncatedText, entities);

    return (
        <div
            className="expandable-text truncated"
            style={{ ...style, cursor: 'pointer' }}
            onClick={(e) => {
                if (e.target.tagName === 'A') return;
                setExpanded(true);
            }}
        >
            <span dangerouslySetInnerHTML={{ __html: truncatedHtml }} />
        </div>
    );
}
