
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Bot, Volume2, Download, ExternalLink } from 'lucide-react';
import { Message } from './types';

interface ChatMessageProps {
  message: Message;
  isExpertView?: boolean;
  userAvatar?: string;
  userName?: string;
}

const ChatMessage = ({ message, isExpertView = false, userAvatar, userName }: ChatMessageProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const isUser = message.sender === 'user';
  const isExpert = message.sender === 'expert';

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

  const getAvatar = () => {
    if (isUser && userAvatar && userName) {
      const initials = userName.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
      return (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={userAvatar} alt={userName} />
          <AvatarFallback className="bg-blue-500 text-white text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
      );
    }

    if (isUser) {
      return (
        <Avatar className="h-8 w-8 flex-shrink-0 bg-drplant-blue">
          <AvatarFallback className="bg-drplant-blue text-white">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      );
    }

    return (
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage 
          src="/images/marco-nigro-avatar.jpg" 
          alt="Marco Nigro" 
        />
        <AvatarFallback className="bg-drplant-green text-white">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
    );
  };

  // Verifica se il messaggio è audio migliorata
  const isAudioMessage = message.text?.includes('🎵 Messaggio vocale') || 
                         message.text === '🎵 Messaggio vocale' ||
                         (message.image_url && (
                           message.image_url.includes('audio_') || 
                           message.image_url.includes('.webm') ||
                           message.image_url.includes('.mp3') ||
                           message.image_url.includes('.wav') ||
                           message.image_url.includes('.m4a')
                         ));

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
    console.error('❌ Errore caricamento immagine:', message.image_url);
  };

  const openImageInNewTab = () => {
    if (message.image_url) {
      window.open(message.image_url, '_blank');
    }
  };

  const renderMessageContent = () => {
    if (isAudioMessage && message.image_url) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Volume2 className="h-4 w-4" />
            <span>Messaggio vocale</span>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30">
            <audio 
              controls 
              className="w-full max-w-xs h-10"
              preload="metadata"
              controlsList="nodownload"
            >
              <source src={message.image_url} type="audio/webm" />
              <source src={message.image_url} type="audio/mpeg" />
              <source src={message.image_url} type="audio/wav" />
              Il tuo browser non supporta l'audio.
            </audio>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => window.open(message.image_url, '_blank')}
                className="text-xs opacity-70 hover:opacity-100 flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Scarica
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {message.text && (
          <div className="whitespace-pre-wrap leading-relaxed">
            {message.text}
          </div>
        )}
        
        {message.image_url && !isAudioMessage && (
          <div className="mt-3">
            {imageLoading && (
              <div className="max-w-xs h-48 bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
                <div className="text-gray-500 text-sm">Caricamento immagine...</div>
              </div>
            )}
            
            {!imageError ? (
              <div className="relative group">
                <img
                  src={message.image_url}
                  alt="Immagine condivisa"
                  className={`max-w-xs rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-all duration-200 ${imageLoading ? 'hidden' : 'block'}`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  onClick={openImageInNewTab}
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                  <ExternalLink className="h-6 w-6 text-white" />
                </div>
              </div>
            ) : (
              <div className="max-w-xs p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <div className="text-gray-500 mb-2">
                  <span className="text-sm">Impossibile caricare l'immagine</span>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={openImageInNewTab}
                    className="text-blue-500 hover:underline text-xs flex items-center gap-1 mx-auto"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Apri in una nuova scheda
                  </button>
                  <div className="text-xs text-gray-400 break-all">
                    {message.image_url?.substring(0, 50)}...
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {message.products && message.products.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium opacity-80">Prodotti consigliati:</p>
            <div className="space-y-2">
              {message.products.map((product: any, index: number) => (
                <div 
                  key={index}
                  className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30"
                >
                  <div className="flex items-start gap-3">
                    {product.image && (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{product.name}</h4>
                      {product.description && (
                        <p className="text-xs opacity-80 mt-1 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      {product.price && (
                        <p className="text-sm font-bold mt-1">€{product.price}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex gap-3 ${getMessageAlignment()}`}>
      {(!isExpertView || !isUser) && getAvatar()}
      
      <div className={`max-w-xs sm:max-w-md md:max-w-lg ${isUser ? 'text-right' : 'text-left'}`}>
        <div className={`
          inline-block px-4 py-3 rounded-2xl shadow-sm
          ${getMessageBubbleStyle()}
          ${isUser ? 'rounded-br-md' : 'rounded-bl-md'}
        `}>
          {renderMessageContent()}
        </div>
        
        <div className={`text-xs text-gray-500 mt-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.time}
        </div>
      </div>
      
      {(isExpertView && isUser) && getAvatar()}
    </div>
  );
};

export default ChatMessage;
