
import { MessageSquare } from 'lucide-react';
import MessageList from '../MessageList';
import MessageInput from '../MessageInput';
import { Message, Conversation } from '../types';

interface ConversationBodyProps {
  conversation: Conversation;
  isSending: boolean;
  onSendMessage: (text: string) => void;
  onOpenProductDialog: () => void;
}

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
            onSendMessage={onSendMessage}
            isSending={isSending}
            isMasterAccount={true}
          />
        )}
      </div>
    </>
  );
};

export default ConversationBody;
