/**
 * Типизированные обёртки для Tauri IPC invoke-команд.
 * Использовать вместо прямых вызовов invoke() во всём приложении.
 */
import { invoke } from '@tauri-apps/api/core';

// ── Auth ──

export const ipcInitTdlib = (apiId, apiHash) =>
    invoke('init_tdlib', { apiId, apiHash });

export const ipcSubmitPhone = (phone) =>
    invoke('submit_phone', { phone });

export const ipcSubmitCode = (code) =>
    invoke('submit_code', { code });

export const ipcSubmitPassword = (password) =>
    invoke('submit_password', { password });

// ── Feed ──

export const ipcGetChannelFeed = (folderId, limit, beforeDate = null, beforeMsgId = null, searchQuery = null) =>
    invoke('get_channel_feed', { folderId, limit, beforeDate, beforeMsgId, searchQuery });

export const ipcGetNewFeedSince = (folderId, sinceDate) =>
    invoke('get_new_feed_since', { folderId, sinceDate });

export async function ipcFetchMoreFeedHistory(beforeDate) {
    return invoke('fetch_more_feed_history', { beforeDate });
}

export async function ipcGetTrendingTexts(folderId, days) {
    return invoke('get_trending_texts', { folderId, days });
}

// ── Chat ──

export const ipcMarkAsRead = (chatId, messageIds) =>
    invoke('mark_as_read', { chatId, messageIds });

export const ipcForwardToStena = (stenaChatId, fromChatId, messageIds) =>
    invoke('forward_to_stena', { stenaChatId, fromChatId, messageIds });

export const ipcLoadMoreHistory = (chatId, fromMessageId) =>
    invoke('load_more_history', { chatId, fromMessageId });

export const ipcGetChatInfo = (chatId) =>
    invoke('get_chat_info', { chatId });

export const ipcSendReply = (chatId, replyToId, text) =>
    invoke('send_reply', { chatId, replyToId, text });

export const ipcGetChatFolder = (folderId) =>
    invoke('get_chat_folder', { folderId });

export const ipcSyncChats = () =>
    invoke('sync_chats');

export const ipcGetContacts = () =>
    invoke('get_contacts');

export const ipcGetUser = (userId) =>
    invoke('get_user', { userId });

export const ipcCreatePrivateChat = (userId) =>
    invoke('create_private_chat', { userId });

export const ipcLeaveChat = (chatId) =>
    invoke('leave_chat', { chatId });

// ── Files ──

export const ipcDownloadFile = (fileId) =>
    invoke('download_file', { fileId });

export const ipcDeleteLocalFile = (fileId) =>
    invoke('delete_local_file', { fileId });

// ── System ──

export const ipcOptimizeStorage = () =>
    invoke('optimize_storage');

export const ipcCheckLocalUpdate = () =>
    invoke('check_local_update');

export const ipcApplyLocalUpdate = () =>
    invoke('apply_local_update');
