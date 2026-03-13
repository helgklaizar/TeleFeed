import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './lightbox.css';

/**
 * Lightbox — полноэкранный просмотр фото/видео.
 * Рендерится через портал в document.body — обходит любые stacking context.
 * Props:
 *   src      — URL медиа
 *   type     — 'image' | 'video'
 *   onClose  — закрытие
 */
export function Lightbox({ src, type = 'image', onClose }) {
    const handleKey = useCallback((e) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [handleKey]);

    if (!src) return null;

    const content = (
        <div className="lightbox-overlay" onClick={onClose}>
            <button className="lightbox-close" onClick={onClose} aria-label="Close">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
            </button>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                {type === 'video' ? (
                    <video
                        src={src}
                        className="lightbox-media"
                        controls
                        autoPlay
                        playsInline
                    />
                ) : (
                    <img
                        src={src}
                        className="lightbox-media"
                        alt=""
                        draggable={false}
                    />
                )}
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
