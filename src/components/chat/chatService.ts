

// Re-export everything from the new modular services
export { ChatApi as default } from '@/services/chat/chatApi';
export { ConversationService } from '@/services/chat/conversationService';
export { convertToUIMessage } from '@/services/chat/messageUtils';
export type { DatabaseConversation, DatabaseMessage, ConversationData, MessageData } from '@/services/chat/types';

// Export individual functions for backward compatibility
export const loadConversations = ChatApi.loadConversations;
export const loadMessages = ChatApi.loadMessages;
export const sendMessage = ChatApi.sendMessage;
export const findOrCreateConversation = ConversationService.findOrCreateConversation;
export const updateConversationStatus = ChatApi.updateConversationStatus;

import { ChatApi } from '@/services/chat/chatApi';
import { ConversationService } from '@/services/chat/conversationService';

