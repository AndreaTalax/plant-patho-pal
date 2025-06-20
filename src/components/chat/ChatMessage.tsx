
import { Message } from './types';
import { MessageAvatar } from './message/MessageAvatar';
import { MessageContent } from './message/MessageContent';

interface ChatMessageProps {
  message: Message;
  isExpertView?: boolean;
  userAvatar?: string;
  userName?: string;
}

const ChatMessage = ({ message, isExpertView = false, userAvatar, userName }: ChatMessageProps) => {
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
    <div className={`flex gap-3 ${getMessageAlignment()}`}>
      {(!isExpertView || !isUser) && (
        <MessageAvatar 
          isUser={isUser} 
          userAvatar={userAvatar} 
          userName={userName} 
        />
      )}
      
      <div className={`max-w-xs sm:max-w-md md:max-w-lg ${isUser ? 'text-right' : 'text-left'}`}>
        <div className={`
          inline-block px-4 py-3 rounded-2xl shadow-sm
          ${getMessageBubbleStyle()}
          ${isUser ? 'rounded-br-md' : 'rounded-bl-md'}
        `}>
          <MessageContent message={message} />
        </div>
        
        <div className={`text-xs text-gray-500 mt-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.time}
        </div>
      </div>
      
      {(isExpertView && isUser) && (
        <MessageAvatar 
          isUser={isUser} 
          userAvatar={userAvatar} 
          userName={userName} 
        />
      )}
    </div>
  );
};

export default ChatMessage;
