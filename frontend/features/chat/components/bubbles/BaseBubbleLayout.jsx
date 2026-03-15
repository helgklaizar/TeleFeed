import { SenderAvatar } from '../../../../shared/ui/SenderAvatar';
import { t } from '../../../../app/i18n';

export function BaseBubbleLayout({
    message,
    isOwn,
    showSender,
    senderName,
    onReply,
    reactions,
    replyPreview,
    time,
    className,
    customWrapClass,
    noBubbleContent,
    children
}) {
    const _reactions = reactions?.length ? (
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
    ) : null;

    const SenderEl = showSender && senderName && (
        <div className={`bubble-sender ${noBubbleContent ? 'bubble-sender--sticker' : ''}`}>{senderName}</div>
    );
    const TimeEl = (
        <span className={`bubble-time ${noBubbleContent ? 'bubble-time--sticker' : ''}`}>{time}</span>
    );

    return (
        <div className={`bubble-row ${isOwn ? 'bubble-row-own' : 'bubble-row-other'} ${className || ''}`}>
            {showSender && <SenderAvatar message={message} size={30} />}
            <div className="bubble-wrap">
                <div className={customWrapClass || `bubble ${isOwn ? 'bubble-own' : 'bubble-other'}`}>
                    {noBubbleContent ? (
                        <>
                            {SenderEl}
                            {replyPreview}
                            {children}
                            {_reactions}
                            {TimeEl}
                        </>
                    ) : (
                        <div className="bubble-content">
                            {SenderEl}
                            {replyPreview}
                            {children}
                            {_reactions}
                            {TimeEl}
                        </div>
                    )}
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
