import { renderEntities } from '../../../../shared/utils/helpers';

export function DocumentBubble({ message }) {
    const content = message.content;
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
        <>
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
        </>
    );
}

export function AudioBubble({ message }) {
    const content = message.content;
    const audio = content.audio;
    const title = audio?.title || audio?.file_name || 'Audio';
    const performer = audio?.performer || '';
    const duration = audio?.duration || 0;
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    return (
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
    );
}

export function PollBubble({ message }) {
    const content = message.content;
    const poll = content.poll;
    const question = poll?.question?.text || poll?.question || '';
    const options = poll?.options || [];
    const totalVoters = poll?.total_voter_count || 0;

    return (
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
    );
}

export function ContactBubble({ message }) {
    const content = message.content;
    const contact = content.contact;
    const name = [contact?.first_name, contact?.last_name].filter(Boolean).join(' ') || 'Contact';
    const phone = contact?.phone_number || '';

    return (
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
    );
}

export function LocationBubble({ message }) {
    const content = message.content;
    const type = content['@type'];
    const loc = type === 'messageVenue' ? content.venue?.location : content.location;
    const title = type === 'messageVenue' ? content.venue?.title || 'Venue' : null;
    const address = type === 'messageVenue' ? content.venue?.address : null;
    const lat = loc?.latitude?.toFixed(5) || '?';
    const lng = loc?.longitude?.toFixed(5) || '?';

    return (
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
    );
}

export function ServiceBubble({ message, type }) {
    const content = message.content;
    const serviceText = content?.text || content?.action || type?.replace('message', '');
    return (
        <div className="bubble-service">
            <span>{serviceText}</span>
        </div>
    );
}
