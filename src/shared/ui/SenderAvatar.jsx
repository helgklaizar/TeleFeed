import { MediaFile } from '../../features/media/components/MediaFile';
import { useSenderInfo } from '../../features/chat/hooks/useSenderInfo';

/**
 * Аватар отправителя сообщения.
 * Принимает message и извлекает информацию о сендере через useSenderInfo.
 */
export function SenderAvatar({ message, size = 32 }) {
    const { name, avatarFile, id } = useSenderInfo(message?.sender_id);
    const initial = name ? name.charAt(0).toUpperCase() : '?';

    const containerStyle = {
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        alignSelf: 'flex-end',
    };

    if (avatarFile?.id) {
        return (
            <div style={containerStyle}>
                <MediaFile
                    fileId={avatarFile.id}
                    initialFile={avatarFile}
                    type="image"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            </div>
        );
    }

    // Fallback: colored circle with initial
    const colors = ['#e53935', '#d81b60', '#8e24aa', '#5c6bc0', '#1e88e5', '#00897b', '#43a047', '#fb8c00'];
    const colorIndex = Math.abs(id || 0) % colors.length;

    return (
        <div style={{
            ...containerStyle,
            background: `linear-gradient(135deg, ${colors[colorIndex]}, ${colors[(colorIndex + 2) % colors.length]})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${Math.round(size * 0.42)}px`,
            fontWeight: 700,
            color: '#fff',
        }}>
            {initial}
        </div>
    );
}
