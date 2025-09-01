
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageReactions } from './MessageReactions';
import { EnhancedAudioMessage } from './message/EnhancedAudioMessage';
import { ImageDisplay } from './message/ImageDisplay';
import { ProductRecommendations } from './message/ProductRecommendations';
import { Message } from './types';
import { useEnhancedChat } from '@/hooks/useEnhancedChat';

interface ChatMessageProps {
  message: Message;
  isExpert?: boolean;
  showAvatar?: boolean;
  userId?: string;
}

interface MessageReaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isExpert = false, 
  showAvatar = true,
  userId 
}) => {
  const { addReaction } = useEnhancedChat();
  
  // Mock reactions data - in real app, this would come from your database
  const reactions: MessageReaction[] = [
    { emoji: '👍', count: 2, userReacted: false },
    { emoji: '❤️', count: 1, userReacted: true }
  ];

  const handleAddReaction = (messageId: string, emoji: string) => {
    if (userId) {
      addReaction(messageId, emoji, userId);
    }
  };

  const handleRemoveReaction = (messageId: string, emoji: string) => {
    // Implementation for removing reaction
    console.log('Remove reaction:', messageId, emoji);
  };

  const isVoiceMessage = message.text.includes('🎵 Messaggio vocale') || message.text.includes('🎤');
  const isImageMessage = message.image_url || message.text.includes('📸');

  return (
    <div className={`flex gap-3 p-4 ${isExpert ? 'bg-drplant-green/5' : 'bg-white'}`}>
      {showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={isExpert ? '/expert-avatar.png' : '/user-avatar.png'} />
          <AvatarFallback className={isExpert ? 'bg-drplant-green text-white' : 'bg-gray-200'}>
            {isExpert ? 'E' : 'U'}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className="flex-1 max-w-[80%]">
        <div className="mb-1">
          <span className="text-sm font-medium text-gray-900">
            {isExpert ? 'Marco Nigro' : 'Tu'}
          </span>
          <span className="text-xs text-gray-500 ml-2">{message.time}</span>
        </div>
        
        <div className="space-y-2">
          {/* Voice Message */}
          {isVoiceMessage && message.image_url && (
            <EnhancedAudioMessage
              audioUrl={message.image_url}
              transcription="Trascrizione del messaggio vocale..." // This would come from your API
              onTranscribe={() => {
                // Implement transcription logic
                console.log('Transcribe audio:', message.image_url);
              }}
            />
          )}
          
          {/* Image Message */}
          {isImageMessage && message.image_url && !isVoiceMessage && (
            <ImageDisplay imageUrl={message.image_url} />
          )}
          
          {/* Text Message */}
          {!isVoiceMessage && (
            <div className={`
              inline-block p-3 rounded-lg max-w-full break-words
              ${isExpert 
                ? 'bg-drplant-green text-white rounded-bl-sm' 
                : 'bg-gray-100 text-gray-900 rounded-br-sm'
              }
            `}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.text}
              </p>
            </div>
          )}
          
          {/* Product Recommendations */}
          {message.products && message.products.length > 0 && (
            <ProductRecommendations products={message.products} />
          )}
          
          {/* Message Reactions */}
          <MessageReactions
            messageId={message.id}
            reactions={reactions}
            onAddReaction={handleAddReaction}
            onRemoveReaction={handleRemoveReaction}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
