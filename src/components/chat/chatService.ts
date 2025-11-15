// Main chat service - re-exports from specialized services
export { ChatMessageService } from './services/messageService';
export { ChatConversationService } from './services/conversationService';
export { convertToUIMessage } from './utils/messageConverter';
export { canMakeRequest, clearRateLimit } from './utils/rateLimiter';

// Import the services for legacy exports
import { ChatMessageService } from './services/messageService';
import { CachedConversationService } from '@/services/chat/cachedConversationService';

// Legacy exports - now using cached service for better performance
export const loadMessages = ChatMessageService.loadMessages;
export const sendMessage = ChatMessageService.sendMessage;
export const loadConversations = CachedConversationService.loadConversations;
export const findOrCreateConversation = CachedConversationService.findOrCreateConversation;
export const updateConversationStatus = CachedConversationService.updateConversationStatus;
