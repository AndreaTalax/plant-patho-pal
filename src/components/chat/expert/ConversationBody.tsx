
import { MessageSquare } from 'lucide-react';
import MessageList from '../MessageList';
import MessageInput from '../MessageInput';
import { Message, Conversation } from '../types';

interface ConversationBodyProps {
  conversation: Conversation;
  isSending: boolean;
  onSendMessage: (text: string) => Promise<void>;
  onOpenProductDialog: () => void;
}

/**
 * Renders the body of a conversation, displaying messages and user interaction options.
 * @example
 * ConversationBody(conversation, isSending, onSendMessage, onOpenProductDialog)
 * Returns a JSX element for the chat interface.
 * @param {Object} conversation - The conversation object containing messages and status.
 * @param {boolean} isSending - Indicates if a message is currently being sent.
 * @param {Function} onSendMessage - Function to handle sending a message.
 * @param {Function} onOpenProductDialog - Function to handle opening product dialog.
 * @returns {JSX.Element} A React component representing the conversation interface.
 * @description
 *   - Displays an empty state when there are no messages.
 *   - Conditionally renders message input based on user blocking status.
 *   - Enables expert view for message list rendering.
 */
const ConversationBody = ({
  conversation,
  isSending,
  onSendMessage,
  onOpenProductDialog
}: ConversationBodyProps) => {
  // If there are no messages, show empty state
  if (conversation.messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
        <MessageSquare className="h-10 w-10 mb-3 text-gray-300" />
        <p className="text-sm">No messages yet</p>
      </div>
    );
  }

  return (
    <>
      <MessageList 
        messages={conversation.messages}
        isExpertView={true}
      />
      
      <div className="p-2 border-t bg-white">
        {conversation.blocked ? (
          <div className="p-2 bg-red-50 text-red-600 rounded-md text-center text-sm">
            This user is blocked. Unblock to continue.
          </div>
        ) : (
          <MessageInput
            conversationId={conversation.id}
            senderId="expert"
            recipientId={conversation.id}
            onSendMessage={async (message: string) => {
              await onSendMessage(message);
            }}
            isMasterAccount={true}
          />
        )}
      </div>
    </>
  );
};

export default ConversationBody;
