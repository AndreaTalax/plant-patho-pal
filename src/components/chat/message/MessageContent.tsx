
import { Message } from '../types';
import { AudioMessage } from './AudioMessage';
import { ImageDisplay } from './ImageDisplay';
import { ProductRecommendations } from './ProductRecommendations';

interface MessageContentProps {
  message: Message;
}

// Function to render markdown links as clickable HTML links
const renderMarkdownLinks = (text: string) => {
  // Regex per trovare link markdown: [testo](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = markdownLinkRegex.exec(text)) !== null) {
    // Aggiungi il testo prima del link
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    // Aggiungi il link come elemento cliccabile
    const linkText = match[1];
    const linkUrl = match[2];
    
    parts.push(
      <a 
        key={match.index}
        href={linkUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        download
        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline font-medium"
      >
        {linkText}
      </a>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Aggiungi il testo rimanente
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts.length > 1 ? parts : text;
};

export const MessageContent = ({ message }: MessageContentProps) => {
  // Verifica se il messaggio è audio
  const isAudioMessage = message.text?.includes('🎵 Messaggio vocale') || 
                         message.text === '🎵 Messaggio vocale' ||
                         (message.image_url && (
                           message.image_url.includes('audio_') || 
                           message.image_url.includes('.webm') ||
                           message.image_url.includes('.mp3') ||
                           message.image_url.includes('.wav') ||
                           message.image_url.includes('.m4a') ||
                           message.image_url.includes('audio-messages')
                         ));

  // Debug logging per messaggi PDF e di consultazione
  if (message.text?.includes('CONSULENZA PROFESSIONALE') || 
      message.text?.includes('Preventivo Professionale') ||
      message.text?.includes('Scarica PDF')) {
    console.log('🔍 PDF Message Content:', {
      id: message.id,
      text: message.text,
      textLength: message.text?.length,
      hasMarkdownLink: message.text?.includes('[') && message.text?.includes(']'),
      sender: message.sender,
      fullText: message.text
    });
  }

  if (isAudioMessage && message.image_url) {
    return <AudioMessage audioUrl={message.image_url} />;
  }

  return (
    <div className="space-y-3">
      {message.text && (
        <div className="whitespace-pre-wrap leading-relaxed">
          {renderMarkdownLinks(message.text)}
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
