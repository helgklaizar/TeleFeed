import { useMemo } from 'react';
import { ExpandableText } from '../../../shared/ui/ExpandableText';
import { MediaFile } from '../../media/components/MediaFile';

/**
 * Горизонтальная карусель превьюшек для альбома.
 * Извлечён из FeedCard для разделения ответственности.
 */
export function AlbumGrid({ posts, text, entities, onMediaClick }) {
    const albumItems = useMemo(() => {
        return posts.map((p) => {
            const c = p.content;
            const t = c?.['@type'];
            if (t === 'messagePhoto' && c.photo?.sizes?.length) {
                const s = c.photo.sizes[c.photo.sizes.length - 1];
                return { fileId: s.photo.id, initialFile: s.photo, type: 'image' };
            }
            if (t === 'messageVideo' && c.video?.video) {
                return { fileId: c.video.video.id, initialFile: c.video.video, type: 'video' };
            }
            return null;
        }).filter(Boolean);
    }, [posts]);

    return (
        <div>
            <ExpandableText text={text} entities={entities} />
            <div className="album-grid">
                {posts.map((p) => {
                    const c = p.content;
                    const t = c?.['@type'];
                    let fileId, initialFile, type;
                    if (t === 'messagePhoto' && c.photo?.sizes?.length) {
                        const s = c.photo.sizes[c.photo.sizes.length - 1];
                        fileId = s.photo.id; initialFile = s.photo; type = 'image';
                    } else if (t === 'messageVideo' && c.video?.video) {
                        fileId = c.video.video.id; initialFile = c.video.video; type = 'video';
                    } else return null;
                    return (
                        <div key={p.id} className="album-thumb">
                            <MediaFile fileId={fileId} initialFile={initialFile} type={type}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onClick={() => {
                                    const idx = albumItems.findIndex((it) => it.fileId === fileId);
                                    onMediaClick?.({ items: albumItems, currentIndex: idx >= 0 ? idx : 0 });
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
