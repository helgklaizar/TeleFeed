import { MediaFile } from '../../../media/components/MediaFile';
import { renderEntities } from '../../../../shared/utils/helpers';

export function StickerBubble({ message }) {
    const content = message.content;
    const sticker = content.sticker;
    const emoji = sticker?.emoji || '🎭';
    const isAnimated = sticker?.is_animated;
    const isVideo = sticker?.is_video;
    const thumbFile = sticker?.thumbnail?.file;
    const fullFile = sticker?.sticker;

    let stickerFile = thumbFile || fullFile;
    let stickerMediaType = 'image';
    if (!isAnimated) {
        if (isVideo) {
            stickerFile = fullFile || thumbFile;
            stickerMediaType = 'animation';
        } else {
            stickerFile = fullFile || thumbFile;
            stickerMediaType = 'image';
        }
    }

    if (stickerFile) {
        return (
            <MediaFile
                fileId={stickerFile.id}
                initialFile={stickerFile}
                type={stickerMediaType}
                className="bubble-sticker-img"
            />
        );
    }
    return <span className="bubble-sticker-emoji">{emoji}</span>;
}

export function VideoNoteBubble({ message }) {
    const vn = message.content.video_note;
    const fileId = vn?.video?.id;
    const initialFile = vn?.video;
    const duration = vn?.duration || 0;
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    return (
        <>
            <div className="bubble-videonote-circle">
                {fileId ? (
                    <MediaFile
                        fileId={fileId}
                        initialFile={initialFile}
                        type="video"
                        className="bubble-videonote-video"
                    />
                ) : (
                    <div className="bubble-videonote-placeholder">
                        <svg viewBox="0 0 24 24" width="40" height="40" fill="white">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                )}
            </div>
            <span className="bubble-videonote-duration">{durationStr}</span>
        </>
    );
}

export function TextMediaBubble({ message }) {
    const content = message.content;
    const type = content['@type'];

    const text = type === 'messageText' ? content.text?.text || '' : (content.caption?.text || '');
    const entities = type === 'messageText' ? content.text?.entities : content.caption?.entities;
    const renderedText = text ? renderEntities(text, entities) : '';

    let mediaEl = null;
    if (type === 'messagePhoto' && content.photo?.sizes) {
        const best = content.photo.sizes[content.photo.sizes.length - 1];
        if (best?.photo) {
            mediaEl = (
                <MediaFile
                    fileId={best.photo.id}
                    initialFile={best.photo}
                    type="image"
                    className="bubble-media"
                />
            );
        }
    } else if (type === 'messageVideo' && content.video?.video) {
        mediaEl = (
            <MediaFile
                fileId={content.video.video.id}
                initialFile={content.video.video}
                type="video"
                className="bubble-media"
            />
        );
    } else if (type === 'messageAnimation' && content.animation?.animation) {
        mediaEl = (
            <MediaFile
                fileId={content.animation.animation.id}
                initialFile={content.animation.animation}
                type="animation"
                className="bubble-media"
            />
        );
    }

    if (!text && !mediaEl) return null;

    return (
        <>
            {mediaEl}
            {renderedText && (
                <div className="bubble-text" dangerouslySetInnerHTML={{ __html: renderedText }} />
            )}
        </>
    );
}
