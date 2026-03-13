import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../features/chat/stores/chatStore';
import { useMessageStore } from '../../features/chat/stores/messageStore';
import { useFileStore } from '../../features/media/stores/fileStore';
import { useUiStore } from '../../stores/uiStore';
import { useFeedStore } from '../../features/feed/stores/feedStore';
import { useUserStore } from '../../features/chat/stores/userStore';

/**
 * Центральный слушатель TDLib событий.
 * Монтируется один раз в App, диспатчит данные в соответствующие сторы.
 *
 * Батчинг feed_updated реализован на Rust-стороне (AtomicBool + 500ms timer),
 * поэтому JS-debounce здесь больше не нужен.
 */
export function useTdlibListener() {
    useEffect(() => {
        // Auth events
        const unAuth = listen('auth_update', (event) => {
            const { state } = event.payload;
            if (state) {
                useAuthStore.getState().setState(state);
                // Запускаем синхронизацию подписок
                if (state === 'ready') {
                    useUiStore.getState().setStartupPhase('syncing_chats');
                    invoke('sync_chats').catch(() => { });
                }
            }
        });

        // Feed events — Rust гарантирует не чаще раза в 500ms
        const unFeed = listen('feed_updated', () => {
            useFeedStore.getState().handleFeedUpdated();
        });

        // TDLib data events
        const unTdlib = listen('tdlib_event', (event) => {
            const data = event.payload;
            if (!data || !data['@type']) return;
            const type = data['@type'];

            switch (type) {
                case 'myProfile': {
                    const name = [data.first_name, data.last_name].filter(Boolean).join(' ');
                    const photo = data.profile_photo?.small || null;
                    const isDownloaded = photo?.local?.is_downloading_completed === true;
                    const localPath = photo?.local?.path || null;
                    const avatarLocalPath = isDownloaded && localPath ? localPath : null;
                    const profileData = { name, photo, userId: data.id, avatarLocalPath };
                    useUiStore.getState().setProfile(profileData);
                    if (photo?.id && !isDownloaded) {
                        invoke('download_file', { fileId: photo.id }).catch(() => { });
                    }
                    break;
                }

                case 'updateNewChat': {
                    if (data.chat) {
                        useChatStore.getState().addChat(data.chat);
                    }
                    break;
                }

                case 'updateMessageSendSucceeded': {
                    const oldId = data.old_message_id;
                    const newMsg = data.message;
                    if (oldId && newMsg) {
                        useMessageStore.getState().replaceMessage(oldId, newMsg);
                    }
                    break;
                }

                case 'updateNewMessage': {
                    if (data.message) {
                        useMessageStore.getState().addMessage(data.message);
                    }
                    break;
                }

                case 'updateMessageContent': {
                    // Пост отредактирован — обновляем в messageStore
                    const { chat_id, message_id, new_content } = data;
                    if (chat_id && message_id && new_content) {
                        const msgs = useMessageStore.getState().messages[chat_id];
                        if (msgs) {
                            const updated = msgs.map(m =>
                                m.id === message_id ? { ...m, content: new_content } : m
                            );
                            useMessageStore.setState(s => ({
                                messages: { ...s.messages, [chat_id]: updated }
                            }));
                        }
                    }
                    break;
                }

                case 'messages': {
                    if (Array.isArray(data.messages)) {
                        const valid = data.messages.filter((m) => m && m.chat_id && m.id);
                        if (valid.length > 0) {
                            const chatId = valid[0].chat_id;
                            useMessageStore.getState().addMessages(chatId, valid);
                        }
                    }
                    break;
                }

                case 'updateFile': {
                    if (data.file) {
                        useFileStore.getState().updateFile(data.file);
                        const profile = useUiStore.getState().profile;
                        if (
                            profile?.photo?.id &&
                            data.file.id === profile.photo.id &&
                            data.file.local?.is_downloading_completed &&
                            data.file.local?.path
                        ) {
                            useUiStore.getState().setProfile({ ...profile, avatarLocalPath: data.file.local.path });
                        }
                    }
                    break;
                }

                case 'users': {
                    if (Array.isArray(data.user_ids)) {
                        useUserStore.getState().setContacts(data.user_ids);
                        data.user_ids.forEach(id => {
                            invoke('get_user', { userId: id }).catch(() => { });
                        });
                    }
                    break;
                }

                case 'user': {
                    useUserStore.getState().addUser(data);
                    break;
                }

                case 'updateChatFolders': {
                    if (data.chat_folders) {
                        useChatStore.getState().setFolderList(data.chat_folders);
                        for (const f of data.chat_folders) {
                            invoke('get_chat_folder', { folderId: f.id }).catch(() => { });
                        }
                    }
                    break;
                }

                case 'chatFolder': {
                    if (data.included_chat_ids && data._folder_id) {
                        useChatStore.getState().updateFolder(data._folder_id, data);
                        // Переходим к загрузке ленты после получения папок
                        const phase = useUiStore.getState().startupPhase;
                        if (phase === 'syncing_chats') {
                            useUiStore.getState().setStartupPhase('loading_feed');
                        }
                    }
                    break;
                }

                case 'updateChatLastMessage': {
                    const chatId = data.chat_id;
                    if (chatId) {
                        const update = {};
                        if (data.last_message) {
                            update.last_message = data.last_message;
                            useMessageStore.getState().addMessage(data.last_message);
                        }
                        if (data.positions && data.positions.length > 0) {
                            update.positions = data.positions;
                            const mainPos = data.positions.find(p => p.list?.['@type'] === 'chatListMain') || data.positions[0];
                            if (mainPos?.order) {
                                update._order = mainPos.order;
                            }
                        }
                        if (Object.keys(update).length > 0) {
                            useChatStore.getState().addChat({ id: chatId, ...update });
                        }
                    }
                    break;
                }

                case 'updateChatReadInbox': {
                    if (data.chat_id) {
                        useChatStore.getState().addChat({
                            id: data.chat_id,
                            unread_count: data.unread_count ?? 0,
                            last_read_inbox_message_id: data.last_read_inbox_message_id,
                        });
                    }
                    break;
                }

                case 'updateChatReadOutbox': {
                    if (data.chat_id) {
                        useChatStore.getState().addChat({
                            id: data.chat_id,
                            last_read_outbox_message_id: data.last_read_outbox_message_id,
                        });
                    }
                    break;
                }

                case 'chatRemovedFromFeed': {
                    // Канал убран из подписок с другого клиента
                    // Просто фильтруем посты — не перезагружаем всю ленту
                    const removedId = data.chat_id;
                    if (removedId) {
                        console.log('[TDLib] Канал убран из ленты:', removedId);
                        useFeedStore.getState().removeChannel(removedId);
                    }
                    break;
                }

                default:
                    break;
            }
        });

        return () => {
            unAuth.then((f) => f());
            unFeed.then((f) => f());
            unTdlib.then((f) => f());
        };
    }, []);
}
