import { ExpandableText } from '../../../shared/ui/ExpandableText';
import { MediaFile } from '../../media/components/MediaFile';
import { getTextFromContent } from '../../../shared/utils/helpers';

/**
 * Рендерит контент одного сообщения (текст / фото / видео / анимация).
 * Дата теперь показывается в шапке FeedCard, в контент не добавляем.
 */
export function PostContent({ message, onMediaClick }) {
    const c = message?.content;
    if (!c) return null;
    const t = c['@type'];

    // Текст без даты — дата теперь в шапке карточки
    const getText = (rawText, entities) => ({ text: rawText || '', entities: entities || [] });

    if (t === 'messageText') {
        const { text, entities } = getText(c.text?.text, c.text?.entities);
        return (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                    <ExpandableText text={text} entities={entities} />
                </div>
            </div>
        );
    }

    if (t === 'messagePhoto' && c.photo?.sizes?.length) {
        const best = c.photo.sizes[c.photo.sizes.length - 1];
        const caption = c.caption?.text || '';
        const captionEnts = c.caption?.entities || [];
        const aspectRatio = (best.width && best.height) ? `${best.width} / ${best.height}` : undefined;

        return (
            <div className="media-overlay-container">
                <div className="post-media" style={{ aspectRatio }}>
                    <MediaFile
                        fileId={best.photo.id}
                        initialFile={best.photo}
                        type="image"
                        className="media-file"
                        onClick={() => onMediaClick?.({
                            items: [{ fileId: best.photo.id, initialFile: best.photo, type: 'image' }],
                            currentIndex: 0,
                        })}
                    />
                </div>

                {caption && (
                    <div className="caption-overlay">
                        <div className="caption-spacer" />
                        <div className="post-caption">
                            <ExpandableText text={caption} entities={captionEnts} />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (t === 'messageVideo' && c.video?.video) {
        const caption = c.caption?.text || '';
        const captionEnts = c.caption?.entities || [];
        const aspectRatio = (c.video.width && c.video.height) ? `${c.video.width} / ${c.video.height}` : undefined;
        let posterStr = undefined;
        if (c.video.minithumbnail?.data) {
            posterStr = `data:image/jpeg;base64,${c.video.minithumbnail.data}`;
        }

        return (
            <div className="media-overlay-container">
                <div className="post-media" style={{ aspectRatio }}>
                    <MediaFile fileId={c.video.video.id} initialFile={c.video.video} type="video" poster={posterStr} className="media-file" />
                </div>

                {caption && (
                    <div className="caption-overlay">
                        <div className="caption-spacer" />
                        <div className="post-caption">
                            <ExpandableText text={caption} entities={captionEnts} />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (t === 'messageAnimation' && c.animation?.animation) {
        const caption = c.caption?.text || '';
        const captionEnts = c.caption?.entities || [];
        const aspectRatio = (c.animation.width && c.animation.height) ? `${c.animation.width} / ${c.animation.height}` : undefined;

        return (
            <div className="media-overlay-container">
                <div className="post-media" style={{ aspectRatio }}>
                    <MediaFile fileId={c.animation.animation.id} initialFile={c.animation.animation} type="animation" className="media-file" />
                </div>

                {caption && (
                    <div className="caption-overlay">
                        <div className="caption-spacer" />
                        <div className="post-caption">
                            <ExpandableText text={caption} entities={captionEnts} />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (t === 'messageWebPage') {
        const { text, entities } = getText(c.text?.text, c.text?.entities);
        const wp = c.web_page;
        const wpTitle = wp?.title || '';
        const wpDesc = wp?.description?.text || '';
        const wpDescEnts = wp?.description?.entities || [];
        // Фото из превью страницы
        const wpPhoto = wp?.photo?.sizes?.length
            ? wp.photo.sizes[wp.photo.sizes.length - 1]
            : null;

        let wpPhotoStyle = undefined;
        if (wpPhoto?.width && wpPhoto?.height) {
            wpPhotoStyle = { aspectRatio: `${wpPhoto.width} / ${wpPhoto.height}` };
        }

        return (
            <div>
                {text && <ExpandableText text={text} entities={entities} />}
                {(wpTitle || wpDesc) && (
                    <div className="web-page-preview">
                        {wpTitle && <div className="web-page-title">{wpTitle}</div>}
                        {wpDesc && <ExpandableText text={wpDesc} entities={wpDescEnts} />}
                    </div>
                )}
                {wpPhoto && (
                    <div className="post-media" style={{ marginTop: '8px', ...wpPhotoStyle }}>
                        <MediaFile
                            fileId={wpPhoto.photo.id}
                            initialFile={wpPhoto.photo}
                            type="image"
                            className="media-file"
                            onClick={() => onMediaClick?.({
                                items: [{ fileId: wpPhoto.photo.id, initialFile: wpPhoto.photo, type: 'image' }],
                                currentIndex: 0,
                            })}
                        />
                    </div>
                )}
            </div>
        );
    }

    // Fallback для неподдерживаемых типов (стикеры, документы, голосовые, аудио и т.д.)
    let fallbackLabel = '';
    if (t === 'messageSticker') fallbackLabel = '🖼 Sticker';
    else if (t === 'messageDocument') fallbackLabel = '📄 Document';
    else if (t === 'messageVoiceNote') fallbackLabel = '🎤 Voice Message';
    else if (t === 'messageVideoNote') fallbackLabel = '📹 Video Message';
    else if (t === 'messageAudio') fallbackLabel = '🎵 Audio';
    else fallbackLabel = `📎 Attachment`;

    const captionText = c.caption?.text || c.text?.text || '';
    const captionEnts = c.caption?.entities || c.text?.entities || [];

    return (
        <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="forward-badge" style={{ margin: 0, marginTop: '8px', alignSelf: 'flex-start' }}>
                <span className="forward-badge-name">{fallbackLabel}</span>
            </div>
            {captionText && <ExpandableText text={captionText} entities={captionEnts} />}
        </div>
    );

    return null;
}
