
import { Card } from '@/components/ui/card';
import { EXPERT } from './types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import EmptyStateView from './user/EmptyStateView';
import ChatHeader from './user/ChatHeader';
import { useUserChat } from './user/useUserChat';

interface UserChatViewProps {
  userId: string;
}

/**
 * Renders a chat view based on user activity.
 * @example
 * UserChatView({ userId: '12345' })
 * Returns a chat interface with message input ready for user interaction.
 * @param {Object} UserChatViewProps - Properties to set up user chat view.
 * @param {string} UserChatViewProps.userId - User's unique identifier for whom the chat is displayed.
 * @returns {JSX.Element} Renders either an empty state view to start a new chat or a chat interface with message input.
 * @description
 *   - Integrates with `useUserChat` to manage chat state and actions.
 *   - Displays an expert selection view if no active chat exists.
 *   - Provides functionality for sending messages with visual feedback on sending status.
 */
const UserChatView = ({ userId }: UserChatViewProps) => {
  const {
    activeChat,
    setActiveChat,
    messages,
    isSending,
    handleSendMessage,
  } = useUserChat(userId);

  // Show expert selection if no chat is active
  if (!activeChat) {
    return <EmptyStateView onStartChat={() => setActiveChat(EXPERT.id)} />;
  }

  // Show chat interface if chat is active
  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <ChatHeader onBackClick={() => setActiveChat(null)} />
      
      {/* Chat messages */}
      <MessageList messages={messages} />
      
      {/* Message input */}
      <div className="p-3 border-t bg-white">
        <MessageInput
          onSendMessage={handleSendMessage}
          isSending={isSending}
        />
      </div>
    </div>
  );
};

export default UserChatView;
