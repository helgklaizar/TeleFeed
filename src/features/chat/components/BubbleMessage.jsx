import { forwardRef } from 'react';
import { MediaFile } from '../../media/components/MediaFile';
import { SenderAvatar } from '../../../shared/ui/SenderAvatar';
import { formatTimeShort, renderEntities } from '../../../shared/utils/helpers';
import { t } from '../../../app/i18n';
import { useMessageStore } from '../stores/messageStore';
import { useSenderInfo } from '../hooks/useSenderInfo';

/**
 * Bubble-сообщение в стиле Telegram для чат-вью (группы / личка).
 * Props:
 *   message   — объект сообщения TDLib (обогащённый _senderName, _senderAvatar)
 *   isOwn     — bool, своё ли сообщение
 *   chatType  — 'group' | 'channel' | 'private'
 *   onReply   — fn(message), вызывается при нажатии Reply
 */
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

    // Text
    const text = type === 'messageText' ? content.text?.text || '' : (content?.caption?.text || '');
    const entities = type === 'messageText' ? content.text?.entities : content?.caption?.entities;
    const renderedText = text ? renderEntities(text, entities) : '';

    // ── Reactions
    const reactions = message?.interaction_info?.reactions?.reactions;

    function ReactionBubbles() {
        if (!reactions?.length) return null;
        return (
            <div className="bubble-reactions">
                {reactions.map((r, i) => {
                    const emoji = r.type?.['@type'] === 'reactionTypeEmoji'
                        ? r.type.emoji
                        : r.type?.['@type'] === 'reactionTypeCustomEmoji'
                            ? '⭐'
                            : '❤';
                    return (
                        <span key={i} className={`bubble-reaction ${r.is_chosen ? 'bubble-reaction--chosen' : ''}`}>
                            {emoji} <span className="bubble-reaction-count">{r.total_count}</span>
                        </span>
                    );
                })}
            </div>
        );
    }

    // ── Reply header
    function ReplyPreview() {
        if (!repliedText) return null;
        return (
            <div className="bubble-reply-preview">
                {repliedSender && (
                    <span className="bubble-reply-sender">{repliedSender}</span>
                )}
                <span className="bubble-reply-text">{repliedText}</span>
            </div>
        );
    }

    // ── Sticker
    if (type === 'messageSticker') {
        const sticker = content.sticker;
        const emoji = sticker?.emoji || '🎭';
        const isAnimated = sticker?.is_animated; // TGS (Lottie) — только thumbnail
        const isVideo = sticker?.is_video;       // WEBM — можно как video/animation
        const thumbFile = sticker?.thumbnail?.file;
        const fullFile = sticker?.sticker;

        // TGS нельзя рендерить — берём thumbnail; WEBM — fullFile как animation; static WEBP — fullFile
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

        return (
            <div ref={ref} className={`bubble-row ${isOwn ? 'bubble-row-own' : 'bubble-row-other'}`}>
                {showSender && <SenderAvatar message={message} size={30} />}
                <div className="bubble-wrap">
                    <div className="bubble-sticker-wrap">
                        {showSender && senderName && (
                            <div className="bubble-sender bubble-sender--sticker">{senderName}</div>
                        )}
                        {stickerFile ? (
                            <MediaFile
                                fileId={stickerFile.id}
                                initialFile={stickerFile}
                                type={stickerMediaType}
                                className="bubble-sticker-img"
                            />
                        ) : (
                            <span className="bubble-sticker-emoji">{emoji}</span>
                        )}
                        <ReactionBubbles />
                        <span className="bubble-time bubble-time--sticker">{formatTimeShort(message.date)}</span>
                    </div>
                    {onReply && (
                        <button
                            className={`bubble-reply-btn ${isOwn ? 'bubble-reply-btn-own' : 'bubble-reply-btn-other'}`}
                            onClick={() => onReply(message)}
                            title={t('reply')}
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ── Voice message
    if (type === 'messageVoiceNote') {
        const voice = content.voice_note;
        const duration = voice?.duration || 0;
        const waveform = voice?.waveform; // base64
        const fileId = voice?.voice?.id;
        const initialFile = voice?.voice;
        const mins = Math.floor(duration / 60);
        const secs = duration % 60;
        const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;

        return (
            <div ref={ref} className={`bubble-row ${isOwn ? 'bubble-row-own' : 'bubble-row-other'}`}>
                {showSender && <SenderAvatar message={message} size={30} />}
                <div className="bubble-wrap">
                    <div className={`bubble ${isOwn ? 'bubble-own' : 'bubble-other'}`}>
                        <div className="bubble-content">
                            {showSender && senderName && (
                                <div className="bubble-sender">{senderName}</div>
                            )}
                            <ReplyPreview />
                            <div className="bubble-voice">
                                <div className="bubble-voice-icon">
                                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                                    </svg>
                                </div>
                                <div className="bubble-voice-bars">
                                    {/* Waveform визуализация */}
                                    {waveform
                                        ? <WaveformBars waveform={waveform} />
                                        : <DefaultWaveBars />
                                    }
                                </div>
                                <span className="bubble-voice-duration">{durationStr}</span>
                            </div>
                            {fileId && (
                                <div style={{ display: 'none' }}>
                                    <MediaFile fileId={fileId} initialFile={initialFile} type="audio" />
                                </div>
                            )}
                            <ReactionBubbles />
                            <span className="bubble-time">{formatTimeShort(message.date)}</span>
                        </div>
                    </div>
                    {onReply && (
                        <button
                            className={`bubble-reply-btn ${isOwn ? 'bubble-reply-btn-own' : 'bubble-reply-btn-other'}`}
                            onClick={() => onReply(message)}
                            title={t('reply')}
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ── Video note (кружочек)
    if (type === 'messageVideoNote') {
        const vn = content.video_note;
        const fileId = vn?.video?.id;
        const initialFile = vn?.video;
        const duration = vn?.duration || 0;
        const mins = Math.floor(duration / 60);
        const secs = duration % 60;
        const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;

        return (
            <div ref={ref} className={`bubble-row ${isOwn ? 'bubble-row-own' : 'bubble-row-other'}`}>
                {showSender && <SenderAvatar message={message} size={30} />}
                <div className="bubble-wrap">
                    <div className="bubble-videonote-wrap">
                        {showSender && senderName && (
                            <div className="bubble-sender bubble-sender--sticker">{senderName}</div>
                        )}
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
                        <ReactionBubbles />
                        <span className="bubble-time bubble-time--sticker">{formatTimeShort(message.date)}</span>
                    </div>
                    {onReply && (
                        <button
                            className={`bubble-reply-btn ${isOwn ? 'bubble-reply-btn-own' : 'bubble-reply-btn-other'}`}
                            onClick={() => onReply(message)}
                            title={t('reply')}
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ── Document / file
    if (type === 'messageDocument') {
        const doc = content.document;
        const fileName = doc?.file_name || 'File';
        const mimeType = doc?.mime_type || '';
        const fileSize = doc?.document?.size || 0;
        const caption = content?.caption?.text || '';
        const captionEntities = content?.caption?.entities;
        const renderedCaption = caption ? renderEntities(caption, captionEntities) : '';

        const sizeStr = fileSize > 1024 * 1024
            ? `${(fileSize / 1024 / 1024).toFixed(1)} MB`
            : fileSize > 1024
                ? `${(fileSize / 1024).toFixed(0)} KB`
                : `${fileSize} B`;

        return (
            <div ref={ref} className={`bubble-row ${isOwn ? 'bubble-row-own' : 'bubble-row-other'}`}>
                {showSender && <SenderAvatar message={message} size={30} />}
                <div className="bubble-wrap">
                    <div className={`bubble ${isOwn ? 'bubble-own' : 'bubble-other'}`}>
                        <div className="bubble-content">
                            {showSender && senderName && (
                                <div className="bubble-sender">{senderName}</div>
                            )}
                            <ReplyPreview />
                            <div className="bubble-document">
                                <div className="bubble-document-icon">
                                    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                                    </svg>
                                </div>
                                <div className="bubble-document-info">
                                    <span className="bubble-document-name">{fileName}</span>
                                    <span className="bubble-document-meta">{mimeType ? `${mimeType} · ` : ''}{sizeStr}</span>
                                </div>
                            </div>
                            {renderedCaption && (
                                <div className="bubble-text" dangerouslySetInnerHTML={{ __html: renderedCaption }} />
                            )}
                            <ReactionBubbles />
                            <span className="bubble-time">{formatTimeShort(message.date)}</span>
                        </div>
                    </div>
                    {onReply && (
                        <button
                            className={`bubble-reply-btn ${isOwn ? 'bubble-reply-btn-own' : 'bubble-reply-btn-other'}`}
                            onClick={() => onReply(message)}
                            title={t('reply')}
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ── Audio
    if (type === 'messageAudio') {
        const audio = content.audio;
        const title = audio?.title || audio?.file_name || 'Audio';
        const performer = audio?.performer || '';
        const duration = audio?.duration || 0;
        const mins = Math.floor(duration / 60);
        const secs = duration % 60;
        const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;

        return (
            <div ref={ref} className={`bubble-row ${isOwn ? 'bubble-row-own' : 'bubble-row-other'}`}>
                {showSender && <SenderAvatar message={message} size={30} />}
                <div className="bubble-wrap">
                    <div className={`bubble ${isOwn ? 'bubble-own' : 'bubble-other'}`}>
                        <div className="bubble-content">
                            {showSender && senderName && (
                                <div className="bubble-sender">{senderName}</div>
                            )}
                            <ReplyPreview />
                            <div className="bubble-audio">
                                <div className="bubble-audio-icon">
                                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                                    </svg>
                                </div>
                                <div className="bubble-audio-info">
                                    <span className="bubble-audio-title">{title}</span>
                                    {performer && <span className="bubble-audio-performer">{performer}</span>}
                                    <span className="bubble-audio-duration">{durationStr}</span>
                                </div>
                            </div>
                            <ReactionBubbles />
                            <span className="bubble-time">{formatTimeShort(message.date)}</span>
                        </div>
                    </div>
                    {onReply && (
                        <button
                            className={`bubble-reply-btn ${isOwn ? 'bubble-reply-btn-own' : 'bubble-reply-btn-other'}`}
                            onClick={() => onReply(message)}
                            title={t('reply')}
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ── Poll
    if (type === 'messagePoll') {
        const poll = content.poll;
        const question = poll?.question?.text || poll?.question || '';
        const options = poll?.options || [];
        const totalVoters = poll?.total_voter_count || 0;

        return (
            <div ref={ref} className={`bubble-row ${isOwn ? 'bubble-row-own' : 'bubble-row-other'}`}>
                {showSender && <SenderAvatar message={message} size={30} />}
                <div className="bubble-wrap">
                    <div className={`bubble ${isOwn ? 'bubble-own' : 'bubble-other'}`}>
                        <div className="bubble-content">
                            {showSender && senderName && (
                                <div className="bubble-sender">{senderName}</div>
                            )}
                            <div className="bubble-poll">
                                <div className="bubble-poll-label">
                                    {poll?.type?.['@type'] === 'pollTypeQuiz' ? '📝 Quiz' : '📊 Poll'}
                                </div>
                                <div className="bubble-poll-question">{question}</div>
                                <div className="bubble-poll-options">
                                    {options.slice(0, 6).map((opt, i) => {
                                        const pct = totalVoters > 0 ? Math.round((opt.voter_count / totalVoters) * 100) : 0;
                                        return (
                                            <div key={i} className="bubble-poll-option">
                                                <div className="bubble-poll-option-bar" style={{ width: `${pct}%` }} />
                                                <span className="bubble-poll-option-text">{opt.text?.text || opt.text}</span>
                                                <span className="bubble-poll-option-pct">{pct}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="bubble-poll-voters">{totalVoters} voters</div>
                            </div>
                            <ReactionBubbles />
                            <span className="bubble-time">{formatTimeShort(message.date)}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Contact
    if (type === 'messageContact') {
        const contact = content.contact;
        const name = [contact?.first_name, contact?.last_name].filter(Boolean).join(' ') || 'Contact';
        const phone = contact?.phone_number || '';

        return (
            <div ref={ref} className={`bubble-row ${isOwn ? 'bubble-row-own' : 'bubble-row-other'}`}>
                {showSender && <SenderAvatar message={message} size={30} />}
                <div className="bubble-wrap">
                    <div className={`bubble ${isOwn ? 'bubble-own' : 'bubble-other'}`}>
                        <div className="bubble-content">
                            {showSender && senderName && (
                                <div className="bubble-sender">{senderName}</div>
                            )}
                            <div className="bubble-contact">
                                <div className="bubble-contact-icon">
                                    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                    </svg>
                                </div>
                                <div className="bubble-contact-info">
                                    <span className="bubble-contact-name">{name}</span>
                                    {phone && <span className="bubble-contact-phone">{phone}</span>}
                                </div>
                            </div>
                            <ReactionBubbles />
                            <span className="bubble-time">{formatTimeShort(message.date)}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Location / Venue
    if (type === 'messageLocation' || type === 'messageVenue') {
        const loc = type === 'messageVenue' ? content.venue?.location : content.location;
        const title = type === 'messageVenue' ? content.venue?.title || 'Venue' : null;
        const address = type === 'messageVenue' ? content.venue?.address : null;
        const lat = loc?.latitude?.toFixed(5) || '?';
        const lng = loc?.longitude?.toFixed(5) || '?';

        return (
            <div ref={ref} className={`bubble-row ${isOwn ? 'bubble-row-own' : 'bubble-row-other'}`}>
                {showSender && <SenderAvatar message={message} size={30} />}
                <div className="bubble-wrap">
                    <div className={`bubble ${isOwn ? 'bubble-own' : 'bubble-other'}`}>
                        <div className="bubble-content">
                            {showSender && senderName && (
                                <div className="bubble-sender">{senderName}</div>
                            )}
                            <div className="bubble-location">
                                <div className="bubble-location-icon">
                                    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                    </svg>
                                </div>
                                <div className="bubble-location-info">
                                    {title && <span className="bubble-location-title">{title}</span>}
                                    {address && <span className="bubble-location-address">{address}</span>}
                                    <span className="bubble-location-coords">{lat}, {lng}</span>
                                </div>
                            </div>
                            <ReactionBubbles />
                            <span className="bubble-time">{formatTimeShort(message.date)}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Unsupported / service fallback
    const isService = type === 'messageChatAddMembers' || type === 'messageChatJoinByLink'
        || type === 'messageChatDeleteMember' || type === 'messagePinMessage'
        || type === 'messageBasicGroupChatCreate' || type === 'messageSupergroupChatCreate'
        || type === 'messageChatChangeTitle' || type === 'messageCustomServiceAction';

    if (isService) {
        const serviceText = content?.text || content?.action || type?.replace('message', '');
        return (
            <div ref={ref} className="bubble-service">
                <span>{serviceText}</span>
            </div>
        );
    }

    // ── Media (photo/video/animation)
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
        <div ref={ref} className={`bubble-row ${isOwn ? 'bubble-row-own' : 'bubble-row-other'}`}>
            {/* Аватар — только в группах, чужие */}
            {showSender && <SenderAvatar message={message} size={30} />}

            <div className="bubble-wrap">
                <div className={`bubble ${isOwn ? 'bubble-own' : 'bubble-other'}`}>
                    <div className="bubble-content">
                        {showSender && senderName && (
                            <div className="bubble-sender">{senderName}</div>
                        )}
                        <ReplyPreview />
                        {mediaEl}
                        {renderedText && (
                            <div className="bubble-text" dangerouslySetInnerHTML={{ __html: renderedText }} />
                        )}
                        <ReactionBubbles />
                        <span className="bubble-time">{formatTimeShort(message.date)}</span>
                    </div>
                </div>

                {onReply && (
                    <button
                        className={`bubble-reply-btn ${isOwn ? 'bubble-reply-btn-own' : 'bubble-reply-btn-other'}`}
                        onClick={() => onReply(message)}
                        title={t('reply')}
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
});

// Waveform визуализация из base64
function WaveformBars({ waveform }) {
    try {
        const bytes = atob(waveform);
        const bars = [];
        for (let i = 0; i < Math.min(bytes.length, 40); i++) {
            const h = Math.max(3, (bytes.charCodeAt(i) / 255) * 20);
            bars.push(<span key={i} className="bubble-voice-bar" style={{ height: `${h}px` }} />);
        }
        return <>{bars}</>;
    } catch {
        return <DefaultWaveBars />;
    }
}

function DefaultWaveBars() {
    // 32 бара с псевдо-случайной высотой для красоты
    const heights = [4, 8, 12, 16, 20, 14, 9, 18, 6, 10, 15, 20, 12, 8, 16, 4, 14, 19, 7, 11, 17, 13, 20, 6, 9, 14, 18, 10, 5, 8, 15, 12];
    return (
        <>
            {heights.map((h, i) => (
                <span key={i} className="bubble-voice-bar" style={{ height: `${h}px` }} />
            ))}
        </>
    );
}
