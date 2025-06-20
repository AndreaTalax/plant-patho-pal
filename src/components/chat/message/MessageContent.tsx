
import { Message } from '../types';
import { AudioMessage } from './AudioMessage';
import { ImageDisplay } from './ImageDisplay';
import { ProductRecommendations } from './ProductRecommendations';

interface MessageContentProps {
  message: Message;
}

export const MessageContent = ({ message }: MessageContentProps) => {
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

  if (isAudioMessage && message.image_url) {
    return <AudioMessage audioUrl={message.image_url} />;
  }

  return (
    <div className="space-y-3">
      {message.text && (
        <div className="whitespace-pre-wrap leading-relaxed">
          {message.text}
        </div>
      )}
      
      {message.image_url && !isAudioMessage && (
        <ImageDisplay imageUrl={message.image_url} />
      )}

      {message.products && message.products.length > 0 && (
        <ProductRecommendations products={message.products} />
      )}
    </div>
  );
};
