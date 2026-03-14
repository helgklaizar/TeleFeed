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

        return (
            <>
                <div className="post-media">
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
                {caption && <div className="post-caption"><ExpandableText text={caption} entities={captionEnts} /></div>}
            </>
        );
    }

    if (t === 'messageVideo' && c.video?.video) {
        const caption = c.caption?.text || '';
        const captionEnts = c.caption?.entities || [];

        return (
            <>
                <div className="post-media">
                    <MediaFile fileId={c.video.video.id} initialFile={c.video.video} type="video" className="media-file" />
                </div>
                {caption && <div className="post-caption"><ExpandableText text={caption} entities={captionEnts} /></div>}
            </>
        );
    }

    if (t === 'messageAnimation' && c.animation?.animation) {
        const caption = c.caption?.text || '';
        const captionEnts = c.caption?.entities || [];

        return (
            <>
                <div className="post-media">
                    <MediaFile fileId={c.animation.animation.id} initialFile={c.animation.animation} type="animation" className="media-file" />
                </div>
                {caption && <div className="post-caption"><ExpandableText text={caption} entities={captionEnts} /></div>}
            </>
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

    // Fallback для неподдерживаемых типов (стикеры, документы, голосовые и т.д.)
    const fallbackText = getTextFromContent(c);
    if (fallbackText) {
        return (
            <div className="post-content-placeholder">
                <span>{fallbackText}</span>
            </div>
        );
    }

    return null;
}
