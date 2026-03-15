import { forwardRef } from 'react';
import { formatTimeShort } from '../../../shared/utils/helpers';
import { t } from '../../../app/i18n';
import { useMessageStore } from '../stores/messageStore';
import { useSenderInfo } from '../hooks/useSenderInfo';

import { BaseBubbleLayout } from './bubbles/BaseBubbleLayout';
import { VoiceBubble } from './bubbles/VoiceBubble';
import { StickerBubble, VideoNoteBubble, TextMediaBubble } from './bubbles/MediaBubbles';
import { DocumentBubble, AudioBubble, PollBubble, ContactBubble, LocationBubble, ServiceBubble } from './bubbles/InfoBubbles';

export const BubbleMessage = forwardRef(function BubbleMessage({ message, isOwn, chatType, onReply }, ref) {
    const content = message?.content;
    const type = content?.['@type'];
    const { name: senderName } = useSenderInfo(message?.sender_id);
    const isGroup = chatType === 'group';
    const showSender = isGroup && !isOwn;

    // ── Reply preview
    const replyInfo = message?.reply_to?.['@type'] === 'messageReplyToMessage'
        ? message.reply_to
        : null;

    const repliedMessage = useMessageStore((s) => {
        if (!replyInfo?.message_id) return null;
        const msgList = s.messages[message?.chat_id] || [];
        return msgList.find((m) => m.id === replyInfo.message_id) || null;
    });

    const { name: repliedSenderName } = useSenderInfo(repliedMessage?.sender_id);

    let repliedTextFound = null;
    if (repliedMessage?.content) {
        const typeR = repliedMessage.content['@type'];
        if (typeR === 'messageText') {
            repliedTextFound = repliedMessage.content.text?.text;
        } else if (typeR === 'messagePhoto') {
            repliedTextFound = repliedMessage.content.caption?.text || t('photo') || 'Photo';
        } else if (typeR === 'messageVideo') {
            repliedTextFound = repliedMessage.content.caption?.text || t('video') || 'Video';
        } else if (typeR === 'messageAnimation') {
            repliedTextFound = repliedMessage.content.caption?.text || t('animation') || 'GIF';
        } else if (typeR === 'messageSticker') {
            repliedTextFound = t('sticker') || 'Sticker';
        } else if (typeR === 'messageVoiceNote') {
            repliedTextFound = '🎤 ' + (t('voiceMessage') || 'Voice message');
        } else if (typeR === 'messageVideoNote') {
            repliedTextFound = '⭕ ' + (t('videoNote') || 'Video message');
        } else {
            repliedTextFound = repliedMessage.content.caption?.text || 'Media';
        }
    }

    const repliedText = replyInfo
        ? (repliedTextFound || replyInfo._cachedText || '...')
        : null;
    const repliedSender = replyInfo
        ? (repliedSenderName || replyInfo._cachedSenderName || '')
        : '';

    const ReplyPreviewEl = repliedText ? (
        <div className="bubble-reply-preview">
            {repliedSender && (
                <span className="bubble-reply-sender">{repliedSender}</span>
            )}
            <span className="bubble-reply-text">{repliedText}</span>
        </div>
    ) : null;

    // ── Reactions
    const reactions = message?.interaction_info?.reactions?.reactions;

    // ── Unsupported / service fallback
    const isService = type === 'messageChatAddMembers' || type === 'messageChatJoinByLink'
        || type === 'messageChatDeleteMember' || type === 'messagePinMessage'
        || type === 'messageBasicGroupChatCreate' || type === 'messageSupergroupChatCreate'
        || type === 'messageChatChangeTitle' || type === 'messageCustomServiceAction';

    if (isService) {
        // ref is just applied using a div wrap to keep ref compatibility
        return (
            <div ref={ref}>
                <ServiceBubble message={message} type={type} />
            </div>
        );
    }

    // Determine layout variations based on type
    const isSticker = type === 'messageSticker';
    const isVideoNote = type === 'messageVideoNote';
    const noBubbleContent = isSticker || isVideoNote;
    const customWrapClass = isSticker ? 'bubble-sticker-wrap' : (isVideoNote ? 'bubble-videonote-wrap' : '');

    // Common layout props
    const layoutProps = {
        message,
        isOwn,
        showSender,
        senderName,
        onReply,
        reactions,
        replyPreview: ReplyPreviewEl,
        time: formatTimeShort(message?.date),
        noBubbleContent,
        customWrapClass,
    };

    let innerContent = null;
    switch (type) {
        case 'messageSticker':
            innerContent = <StickerBubble message={message} />;
            break;
        case 'messageVoiceNote':
            innerContent = <VoiceBubble message={message} />;
            break;
        case 'messageVideoNote':
            innerContent = <VideoNoteBubble message={message} />;
            break;
        case 'messageDocument':
            innerContent = <DocumentBubble message={message} />;
            break;
        case 'messageAudio':
            innerContent = <AudioBubble message={message} />;
            break;
        case 'messagePoll':
            innerContent = <PollBubble message={message} />;
            break;
        case 'messageContact':
            innerContent = <ContactBubble message={message} />;
            break;
        case 'messageLocation':
        case 'messageVenue':
            innerContent = <LocationBubble message={message} />;
            break;
        case 'messageText':
        case 'messagePhoto':
        case 'messageVideo':
        case 'messageAnimation':
            innerContent = <TextMediaBubble message={message} />;
            break;
        default:
            return null;
    }

    if (!innerContent && type !== 'messageSticker' && type !== 'messageVideoNote') {
        // Fallback for null (e.g. empty text media)
        innerContent = <TextMediaBubble message={message} />;
        if (!innerContent) return null;
    }

    return (
        <div ref={ref}>
            <BaseBubbleLayout {...layoutProps}>
                {innerContent}
            </BaseBubbleLayout>
        </div>
    );
});
