/**
 * Типизированные обёртки для Tauri IPC invoke-команд.
 * Использовать вместо прямых вызовов invoke() во всём приложении.
 */
import { invoke } from '@tauri-apps/api/core';
// ── Auth ──

export const ipcInitTdlib = (apiId: number, apiHash: string): Promise<void> =>
    invoke('init_tdlib', { apiId, apiHash });

export const ipcSubmitPhone = (phone: string): Promise<void> =>
    invoke('submit_phone', { phone });

export const ipcSubmitCode = (code: string): Promise<void> =>
    invoke('submit_code', { code });

export const ipcSubmitPassword = (password: string): Promise<void> =>
    invoke('submit_password', { password });

// ── Feed ──

export const ipcGetChannelFeed = (
    folderId: number, 
    limit: number, 
    beforeDate: number | null = null, 
    beforeMsgId: number | null = null
): Promise<void> =>
    invoke('get_channel_feed', { folderId, limit, beforeDate, beforeMsgId });

export const ipcGetNewFeedSince = (folderId: number, sinceDate: number): Promise<void> =>
    invoke('get_new_feed_since', { folderId, sinceDate });

export const ipcFetchMoreFeedHistory = (beforeDate: number): Promise<void> =>
    invoke('fetch_more_feed_history', { beforeDate });

// ── Chat ──

export const ipcMarkAsRead = (chatId: number, messageIds: number[]): Promise<void> =>
    invoke('mark_as_read', { chatId, messageIds });

export const ipcForwardToStena = (stenaChatId: number, fromChatId: number, messageIds: number[]): Promise<void> =>
    invoke('forward_to_stena', { stenaChatId, fromChatId, messageIds });

export const ipcLoadMoreHistory = (chatId: number, fromMessageId: number): Promise<void> =>
    invoke('load_more_history', { chatId, fromMessageId });

export const ipcGetChatInfo = (chatId: number): Promise<void> =>
    invoke('get_chat_info', { chatId });

export const ipcSendReply = (chatId: number, replyToId: number, text: string): Promise<void> =>
    invoke('send_reply', { chatId, replyToId, text });

export const ipcGetChatFolder = (folderId: number): Promise<void> =>
    invoke('get_chat_folder', { folderId });

export const ipcSyncChats = (): Promise<void> =>
    invoke('sync_chats');

export const ipcGetContacts = (): Promise<void> =>
    invoke('get_contacts');

export const ipcGetUser = (userId: number): Promise<void> =>
    invoke('get_user', { userId });

export const ipcCreatePrivateChat = (userId: number): Promise<void> =>
    invoke('create_private_chat', { userId });

export const ipcLeaveChat = (chatId: number): Promise<void> =>
    invoke('leave_chat', { chatId });

// ── Files ──

export const ipcDownloadFile = (fileId: number): Promise<void> =>
    invoke('download_file', { fileId });

export const ipcDeleteLocalFile = (fileId: number): Promise<void> =>
    invoke('delete_local_file', { fileId });

// ── System ──

export const ipcOptimizeStorage = (): Promise<void> =>
    invoke('optimize_storage');

export const ipcCheckLocalUpdate = (): Promise<void> =>
    invoke('check_local_update');

export const ipcApplyLocalUpdate = (): Promise<void> =>
    invoke('apply_local_update');
