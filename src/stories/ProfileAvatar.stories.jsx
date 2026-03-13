import { ProfileAvatar } from '../shared/ui/ProfileAvatar';
import '../shared/styles/tokens.css';

// Mock uiStore for Storybook
import { useUiStore } from '../stores/uiStore';

export default {
    title: 'Components/ProfileAvatar',
    component: ProfileAvatar,
    parameters: {
        backgrounds: { default: 'dark', values: [{ name: 'dark', value: '#1a1a2e' }] },
    },
    decorators: [
        (_Story) => {
            // Set mock profile data
            useUiStore.setState({
                profile: { name: 'Kraft User', phone: '79998887766', username: 'kraft' },
            });
            return <div style={{ padding: 20 }}><_Story /></div>;
        },
    ],
};

export const Small = {
    args: { size: 28 },
};

export const Medium = {
    args: { size: 44 },
};

export const Large = {
    args: { size: 64 },
};

export const NoAvatar = {
    args: { size: 44 },
    decorators: [
        (_Story) => {
            useUiStore.setState({
                profile: { name: 'Test', avatarLocalPath: null },
            });
            return <_Story />;
        },
    ],
};

export const SingleLetter = {
    args: { size: 44 },
    decorators: [
        (_Story) => {
            useUiStore.setState({
                profile: { name: 'A', avatarLocalPath: null },
            });
            return <_Story />;
        },
    ],
};

export const NoProfile = {
    args: { size: 44 },
    decorators: [
        (_Story) => {
            useUiStore.setState({ profile: null });
            return <_Story />;
        },
    ],
};
