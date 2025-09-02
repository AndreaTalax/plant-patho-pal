
import { Message } from './types';
import { MessageAvatar } from './message/MessageAvatar';
import { MessageContent } from './message/MessageContent';
import MessageReactions from './MessageReactions';

interface ChatMessageProps {
  message: Message;
  isExpertView?: boolean;
  userAvatar?: string;
  userName?: string;
  currentUserId?: string;
  onAddReaction?: (messageId: string, reactionType: string) => void;
  onRemoveReaction?: (messageId: string, reactionType: string) => void;
}

const ChatMessage = ({ 
  message, 
  isExpertView = false, 
  userAvatar, 
  userName, 
  currentUserId,
  onAddReaction,
  onRemoveReaction 
}: ChatMessageProps) => {
  const isUser = message.sender === 'user';

  console.log('🎨 Rendering ChatMessage:', {
    id: message.id,
    sender: message.sender,
    text: message.text?.substring(0, 50),
    hasImage: !!message.image_url,
    imageUrl: message.image_url,
    hasProducts: !!message.products,
    isExpertView
  });

  const getMessageAlignment = () => {
    if (isExpertView) {
      return isUser ? 'flex-row' : 'flex-row-reverse';
    } else {
      return isUser ? 'flex-row-reverse' : 'flex-row';
    }
  };

  const getMessageBubbleStyle = () => {
    if (isExpertView) {
      return isUser 
        ? 'bg-blue-100 text-blue-900 ml-auto' 
        : 'bg-drplant-green text-white mr-auto';
    } else {
      return isUser 
        ? 'bg-drplant-blue text-white ml-auto' 
        : 'bg-gray-100 text-gray-900 mr-auto';
    }
  };

  return (
    <div className={`flex gap-3 w-full ${getMessageAlignment()}`}>
      {(!isExpertView || !isUser) && (
        <div className="flex-shrink-0">
          <MessageAvatar 
            isUser={isUser} 
            userAvatar={userAvatar} 
            userName={userName} 
          />
        </div>
      )}
      
      <div className={`flex flex-col min-w-0 ${isUser ? 'items-end' : 'items-start'} max-w-[80%] md:max-w-[70%] lg:max-w-[60%]`}>
      <div className={`
          inline-block px-4 py-3 rounded-2xl shadow-sm break-words overflow-wrap-anywhere
          ${getMessageBubbleStyle()}
          ${isUser ? 'rounded-br-md' : 'rounded-bl-md'}
          max-w-full
        `}>
          <div className="overflow-hidden">
            <MessageContent message={message} />
          </div>
        </div>
        
        <div className={`text-xs text-gray-500 mt-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.time}
        </div>

        {/* Reazioni ai messaggi */}
        {currentUserId && onAddReaction && onRemoveReaction && (
          <MessageReactions
            messageId={message.id}
            reactions={message.reactions || []}
            currentUserId={currentUserId}
            onAddReaction={onAddReaction}
            onRemoveReaction={onRemoveReaction}
            className={isUser ? 'justify-end' : 'justify-start'}
          />
        )}
      </div>
      
      {(isExpertView && isUser) && (
        <div className="flex-shrink-0">
          <MessageAvatar 
            isUser={isUser} 
            userAvatar={userAvatar} 
            userName={userName} 
          />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
