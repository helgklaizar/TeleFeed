import { useUiStore } from '../../stores/uiStore';

/**
 * Аватар текущего пользователя (профиля).
 * Используется в App header и MenuPage вместо дублированного кода.
 */
export function ProfileAvatar({ size = 28, style = {} }) {
    const profile = useUiStore((s) => s.profile);
    const avatarUrl = profile?.avatarLocalPath ? `asset://localhost/${profile.avatarLocalPath}` : null;

    const baseStyle = {
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        ...style,
    };

    if (avatarUrl) {
        return <img src={avatarUrl} alt="" style={{ ...baseStyle, objectFit: 'cover' }} />;
    }

    return (
        <div
            style={{
                ...baseStyle,
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: `${Math.round(size * 0.46)}px`,
                fontWeight: 600,
                color: '#fff',
            }}
        >
            {profile?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
    );
}
