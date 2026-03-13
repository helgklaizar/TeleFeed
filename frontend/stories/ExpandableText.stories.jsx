import { ExpandableText } from '../shared/ui/ExpandableText';
import '../shared/styles/tokens.css';
import '../features/feed/components/feed.css';

export default {
    title: 'Components/ExpandableText',
    component: ExpandableText,
    parameters: {
        backgrounds: { default: 'dark', values: [{ name: 'dark', value: '#1a1a2e' }] },
    },
    decorators: [(_Story) => <div style={{ maxWidth: 400, padding: 16, color: '#e0e0e0' }}><_Story /></div>],
};

export const Short = {
    args: {
        text: 'Короткий текст поста.',
        entities: [],
    },
};

export const WithBold = {
    args: {
        text: 'Это жирный текст и обычный.',
        entities: [
            { offset: 4, length: 11, type: { '@type': 'textEntityTypeBold' } },
        ],
    },
};

export const WithLink = {
    args: {
        text: 'Перейдите по ссылке https://example.com для подробностей.',
        entities: [
            { offset: 20, length: 19, type: { '@type': 'textEntityTypeUrl' } },
        ],
    },
};

export const LongTruncated = {
    args: {
        text: Array.from({ length: 60 }, (_, i) => `слово${i}`).join(' '),
        entities: [],
    },
};

export const WithMentions = {
    args: {
        text: 'Привет @durov, как дела? Смотри @telegram_bot.',
        entities: [
            { offset: 7, length: 6, type: { '@type': 'textEntityTypeMention' } },
            { offset: 31, length: 13, type: { '@type': 'textEntityTypeMention' } },
        ],
    },
};

export const WithCode = {
    args: {
        text: 'Установите npm install zustand и запустите npm run dev.',
        entities: [
            { offset: 12, length: 19, type: { '@type': 'textEntityTypeCode' } },
            { offset: 44, length: 11, type: { '@type': 'textEntityTypeCode' } },
        ],
    },
};

export const Empty = {
    args: {
        text: '',
        entities: [],
    },
};
