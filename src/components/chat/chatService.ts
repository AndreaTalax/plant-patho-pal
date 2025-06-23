
// Main chat service - re-exports from specialized services
export { ChatMessageService } from './services/messageService';
export { ChatConversationService } from './services/conversationService';
export { convertToUIMessage } from './utils/messageConverter';
export { canMakeRequest, clearRateLimit } from './utils/rateLimiter';

// Import the services for legacy exports
import { ChatMessageService } from './services/messageService';
import { ChatConversationService } from './services/conversationService';

// Legacy exports for backward compatibility
export const loadMessages = ChatMessageService.loadMessages;
export const sendMessage = ChatMessageService.sendMessage;
export const loadConversations = ChatConversationService.loadConversations;
export const findOrCreateConversation = ChatConversationService.findOrCreateConversation;
export const updateConversationStatus = ChatConversationService.updateConversationStatus;
