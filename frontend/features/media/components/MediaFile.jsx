import { useState, useEffect } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useFileStore } from '../stores/fileStore';
import { ipcDownloadFile } from '../../../shared/ipc/index';
import { VideoPlayer } from './VideoPlayer';
import { Lightbox } from './Lightbox';

/**
 * Компонент для скачивания и отображения медиафайла TDLib.
 * Поддерживает фото, видео и GIF (animation).
 * - Клик на фото → Lightbox (зум)
 * - Двойной клик на видео → Lightbox (полный экран через нативный фуллскрин)
 */
export function MediaFile({ fileId, initialFile, type = 'image', style = {}, onClick, className = '' }) {
    const [requested, setRequested] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const fileFromStore = useFileStore((s) => s.files[fileId]);
    const file = fileFromStore || initialFile;

    const isDownloaded = file?.local?.is_downloading_completed && file?.local?.path;

    useEffect(() => {
        if (!fileId || isDownloaded || requested) return;
        setRequested(true);
        ipcDownloadFile(fileId).catch(console.error);
    }, [fileId, isDownloaded, requested]);

    if (!isDownloaded) {
        return (
            <div className={`media-placeholder ${className}`} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="media-spinner" />
            </div>
        );
    }

    const src = convertFileSrc(file.local.path);

    if (type === 'video') {
        return (
            <>
                <VideoPlayer
                    src={src}
                    className={className}
                    style={style}
                    onLightboxRequest={() => setLightboxOpen(true)}
                />
                {lightboxOpen && (
                    <Lightbox src={src} type="video" onClose={() => setLightboxOpen(false)} />
                )}
            </>
        );
    }

    if (type === 'animation' || type === 'gif') {
        return (
            <video
                src={src}
                className={`media-file ${className}`}
                style={style}
                autoPlay
                loop
                muted
                playsInline
                onClick={onClick}
            />
        );
    }

    // Image — клик открывает lightbox
    return (
        <>
            <img
                src={src}
                className={`media-file media-file--zoomable ${className}`}
                style={style}
                loading="lazy"
                onClick={() => setLightboxOpen(true)}
                alt=""
            />
            {lightboxOpen && (
                <Lightbox src={src} type="image" onClose={() => setLightboxOpen(false)} />
            )}
        </>
    );
}
