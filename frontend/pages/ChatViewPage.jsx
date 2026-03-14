import { useMemo, useEffect, useLayoutEffect, useRef, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ipcMarkAsRead, ipcLoadMoreHistory, ipcSendReply } from '../shared/ipc/index';
import { useChatStore } from '../features/chat/stores/chatStore';
import { useMessageStore } from '../features/chat/stores/messageStore';
import { useUserStore } from '../features/chat/stores/userStore';
import { useUiStore } from '../stores/uiStore';
import { ChatAvatar } from '../shared/ui/ChatAvatar';
import { BubbleMessage } from '../features/chat/components/BubbleMessage';
import { t } from '../app/i18n';
import { showToast } from '../stores/toastStore';

const MIN_MESSAGES_THRESHOLD = 10;

export function ChatViewPage() {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const chatIdNum = Number(chatId);
    const chat = useChatStore((s) => s.chats[chatIdNum]);
    const rawMessages = useMessageStore((s) => s.messages[chatIdNum] || []);
    const profile = useUiStore((s) => s.profile);
    const scrollRef = useRef(null);
    const inputRef = useRef(null);
    const [replyText, setReplyText] = useState('');
    const [replyTo, setReplyTo] = useState(null); // { id, text, senderName }
    const [loadingMore, setLoadingMore] = useState(false);
    const [reachedStart, setReachedStart] = useState(false);

    // Фокус на поле ввода при открытии чата
    useEffect(() => {
        const raf = requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
        return () => cancelAnimationFrame(raf);
    }, [chatIdNum]);

    const chatType = chat?._customType || 'private';
    const myUserId = profile?.userId;

    // Messages sorted ascending (oldest first)
    const messages = useMemo(() => [...rawMessages].reverse(), [rawMessages]);

    // Hide body scroll when chat is open — используем CSS-класс вместо прямой манипуляции стилями
    useEffect(() => {
        document.documentElement.classList.add('scroll-locked');
        return () => {
            document.documentElement.classList.remove('scroll-locked');
        };
    }, []);

    // Mark chat as read when entering — viewMessages requires actual message IDs
    useEffect(() => {
        const msgs = useMessageStore.getState().messages[chatIdNum] || [];
        const latestMsg = msgs[0]; // messages sorted desc
        if (latestMsg?.id) {
            ipcMarkAsRead(chatIdNum, [latestMsg.id]).catch((e) => {
                console.error('mark_as_read error:', e);
                showToast(t('actionFailed'), { type: 'error' });
            });
        }
        // Optimistically reset unread counter in local store
        useChatStore.getState().addChat({ id: chatIdNum, unread_count: 0 });
    }, [chatIdNum]);

    // Load history on mount if messages are few
    useEffect(() => {
        if (rawMessages.length < MIN_MESSAGES_THRESHOLD) {
            setLoadingMore(true);
            const countBefore = useMessageStore.getState().messages[chatIdNum]?.length ?? 0;
            ipcLoadMoreHistory(chatIdNum, 0)
                .catch((e) => {
                    console.error('load_more_history error:', e);
                    showToast(t('actionFailed'), { type: 'error' });
                });
            // TDLib отправляет сообщения через события async. Через 1.5s проверяем пришло ли что-то.
            setTimeout(() => {
                const countAfter = useMessageStore.getState().messages[chatIdNum]?.length ?? 0;
                setLoadingMore(false);
                if (countAfter <= countBefore) setReachedStart(true);
            }, 1500);
        }
    }, [chatIdNum]); // eslint-disable-line react-hooks/exhaustive-deps

    // Scroll to bottom on first load and new messages — useLayoutEffect для надёжности
    const lastMsgRef = useRef(null);
    useLayoutEffect(() => {
        lastMsgRef.current?.scrollIntoView({ behavior: 'instant' });
    }, [chatIdNum, messages.length]);

    // IntersectionObserver sentinel — подгрузка при скролле к началу
    const sentinelRef = useRef(null);
    const loadMoreHistory = useCallback(() => {
        if (rawMessages.length === 0 || loadingMore || reachedStart) return;
        const oldestMsg = rawMessages[rawMessages.length - 1];
        if (!oldestMsg) return;
        const countBefore = useMessageStore.getState().messages[chatIdNum]?.length ?? 0;
        setLoadingMore(true);
        ipcLoadMoreHistory(chatIdNum, oldestMsg.id)
            .catch((e) => {
                console.error('load_more_history error:', e);
                showToast(t('actionFailed'), { type: 'error' });
            });
        // TDLib отвечает через события — через 1.5s смотрим на рост счётчика
        setTimeout(() => {
            const countAfter = useMessageStore.getState().messages[chatIdNum]?.length ?? 0;
            setLoadingMore(false);
            if (countAfter <= countBefore) setReachedStart(true);
        }, 1500);
    }, [chatIdNum, rawMessages, loadingMore, reachedStart]);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) loadMoreHistory();
            },
            { threshold: 0.1 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [loadMoreHistory]);

    // Handle reply click from BubbleMessage
    const handleReply = useCallback((msg) => {
        const content = msg?.content;
        const type = content?.['@type'];
        const text = type === 'messageText'
            ? (content?.text?.text || '')
            : (content?.caption?.text || '');

        let sn = msg._senderName || '';
        if (!sn && msg.sender_id) {
            const isUser = msg.sender_id['@type'] === 'messageSenderUser';
            const isChat = msg.sender_id['@type'] === 'messageSenderChat';
            if (isUser) {
                const u = useUserStore.getState().users[msg.sender_id.user_id];
                if (u) sn = [u.first_name, u.last_name].filter(Boolean).join(' ') || 'User';
            } else if (isChat) {
                const c = useChatStore.getState().chats[msg.sender_id.chat_id];
                if (c) sn = c.title || 'Chat';
            }
        }

        setReplyTo({
            id: msg.id,
            text: text.slice(0, 120),
            senderName: sn,
        });
        inputRef.current?.focus();
    }, []);

    const cancelReply = useCallback(() => setReplyTo(null), []);

    // Send message
    const handleSend = async () => {
        if (!replyText.trim()) return;
        try {
            await ipcSendReply(chatIdNum, replyTo?.id || 0, replyText);
            setReplyText('');
            setReplyTo(null);
            inputRef.current?.focus();
        } catch (e) {
            console.error('Send error:', e);
            showToast(t('sendError'), { type: 'error' });
        }
    };

    if (!chat) {
        return (
            <div className="page chat-view-page">
                <div className="chat-view-header">
                    <button className="back-btn" onClick={() => navigate(-1)} aria-label={t('back')}>
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                        </svg>
                    </button>
                    <span>{t('loading')}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="page chat-view-page">
            {/* Header */}
            <div className="chat-view-header">
                <button className="back-btn" onClick={() => navigate(-1)} aria-label={t('back')}>
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                    </svg>
                </button>
                <ChatAvatar chat={chat} size={32} />
                <div className="chat-view-header-info">
                    <div className="chat-view-header-name">{chat.title || t('chat')}</div>
                    <div className="chat-view-header-status">
                        {messages.length} {t('messages')}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="chat-view-messages" ref={scrollRef}>
                {/* Sentinel для IntersectionObserver — подгрузка при скролле вверх */}
                {!reachedStart && !loadingMore && messages.length > 0 && (
                    <div ref={sentinelRef} style={{ height: 1 }} />
                )}
                {loadingMore && (
                    <div className="chat-loading-indicator">
                        <div className="media-spinner" style={{ width: 20, height: 20 }} />
                        <span>{t('loadingMore')}</span>
                    </div>
                )}
                {reachedStart && !loadingMore && messages.length > 0 && (
                    <div className="chat-history-boundary">
                        {t('beginningOfChat')}
                    </div>
                )}
                {messages.length === 0 ? (
                    <div className="empty-state" style={{ paddingTop: '30vh' }}>
                        <span>{t('noMessages')}</span>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <BubbleMessage
                            key={msg.id}
                            message={msg}
                            isOwn={msg.sender_id?.user_id === myUserId || msg.is_outgoing}
                            chatType={chatType}
                            onReply={handleReply}
                            ref={idx === messages.length - 1 ? lastMsgRef : null}
                        />
                    ))
                )}
            </div>

            {/* Input bar */}
            <div className="chat-input-bar">
                {/* Reply preview */}
                {replyTo && (
                    <div className="reply-preview-bar">
                        <div className="reply-preview-content">
                            {replyTo.senderName && (
                                <span className="reply-preview-sender">{replyTo.senderName}</span>
                            )}
                            <span className="reply-preview-text">{replyTo.text || '...'}</span>
                        </div>
                        <button className="reply-preview-cancel" onClick={cancelReply} title={t('cancelReply')}>
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                            </svg>
                        </button>
                    </div>
                )}

                <div className="chat-input-row">
                    <div className="chat-input-wrapper">
                        <textarea
                            ref={inputRef}
                            rows={1}
                            value={replyText}
                            onChange={(e) => {
                                setReplyText(e.target.value);
                                // Auto-resize
                                e.target.style.height = 'auto';
                                e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder={replyTo ? t('replyTo') : t('messagePlaceholder')}
                            className="chat-input"
                        />
                    </div>
                    <button
                        className="chat-send-btn"
                        onClick={handleSend}
                        disabled={!replyText.trim()}
                    >
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
