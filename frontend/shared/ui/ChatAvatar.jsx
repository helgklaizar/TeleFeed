import { MediaFile } from '../../features/media/components/MediaFile';

/**
 * Аватар чата — скачивает маленькое фото чата через TDLib.
 * Если фото нет — показывает первую букву имени.
 */
export function ChatAvatar({ chat, size = 48, style = {} }) {
    const photoFile = chat?.photo?.small;
    const photoFileId = photoFile?.id;
    const title = chat?.title || '?';
    const initial = title.charAt(0).toUpperCase();

    const containerStyle = {
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        ...style,
    };

    if (photoFileId) {
        return (
            <div style={containerStyle}>
                <MediaFile
                    fileId={photoFileId}
                    initialFile={photoFile}
                    type="image"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            </div>
        );
    }

    // Fallback: colored circle with initial
    const groupColors = ['#e53935', '#d81b60', '#8e24aa', '#5c6bc0', '#1e88e5', '#00897b', '#43a047', '#fb8c00'];
    const privateColors = ['#00897b', '#00acc1', '#039be5', '#1e88e5', '#3949ab', '#43a047', '#7cb342', '#c0ca33'];
    const palette = chat?._customType === 'private' ? privateColors : groupColors;
    const colorIndex = Math.abs(chat?.id || 0) % palette.length;

    return (
        <div style={{
            ...containerStyle,
            background: `linear-gradient(135deg, ${palette[colorIndex]}, ${palette[(colorIndex + 2) % palette.length]})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${size * 0.42}px`,
            fontWeight: 'bold',
            color: '#fff',
        }}>
            {initial}
        </div>
    );
}
