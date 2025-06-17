
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Bot } from 'lucide-react';
import { Message } from './types';

interface ChatMessageProps {
  message: Message;
  isExpertView?: boolean;
  userAvatar?: string;
  userName?: string;
}

const ChatMessage = ({ message, isExpertView = false, userAvatar, userName }: ChatMessageProps) => {
  const [imageError, setImageError] = useState(false);
  const isUser = message.sender === 'user';
  const isExpert = message.sender === 'expert';

  console.log('🎨 Rendering ChatMessage:', {
    id: message.id,
    sender: message.sender,
    text: message.text?.substring(0, 50),
    hasImage: !!message.image_url,
    hasProducts: !!message.products,
    isExpertView,
    userAvatar,
    userName
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

  const getAvatar = () => {
    if (isUser && userAvatar && userName) {
      const initials = userName.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
      return (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={userAvatar} alt={userName} />
          <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
      );
    } else if (isUser) {
      return (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-blue-100 text-blue-700">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      );
    } else {
      return (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-drplant-green text-white">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      );
    }
  };

  return (
    <div className={`flex gap-3 max-w-[85%] ${getMessageAlignment()}`}>
      {getAvatar()}
      
      <div className="flex flex-col space-y-1">
        <div className={`rounded-2xl px-4 py-3 shadow-sm ${getMessageBubbleStyle()}`}>
          {message.text && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.text}
            </p>
          )}
          
          {message.image_url && !imageError && (
            <div className="mt-2">
              <img 
                src={message.image_url} 
                alt="Immagine allegata" 
                className="max-w-full h-auto rounded-lg border border-gray-200"
                style={{ maxHeight: '300px' }}
                onError={() => {
                  console.warn('⚠️ Error loading image:', message.image_url);
                  setImageError(true);
                }}
                onLoad={() => console.log('✅ Image loaded successfully:', message.image_url)}
              />
            </div>
          )}
          
          {imageError && message.image_url && (
            <div className="mt-2 p-3 bg-gray-100 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                ⚠️ Impossibile caricare l'immagine
              </p>
            </div>
          )}
          
          {message.products && Array.isArray(message.products) && message.products.length > 0 && (
            <div className="mt-3 space-y-2">
              <h4 className="font-medium text-sm">Prodotti consigliati:</h4>
              {message.products.map((product, index) => (
                <div key={index} className="bg-white/20 rounded-lg p-2 text-sm">
                  <div className="font-medium">{product.name}</div>
                  {product.description && (
                    <div className="text-opacity-80">{product.description}</div>
                  )}
                  {product.price && (
                    <div className="font-medium">€{product.price}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className={`text-xs text-gray-500 px-1 ${
          getMessageAlignment().includes('reverse') ? 'text-right' : 'text-left'
        }`}>
          {message.time}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
