import React, { useState, useRef } from 'react';
import { Message } from '../types';
import { AudioMessage } from './AudioMessage';
import { ImageDisplay } from './ImageDisplay';
import PDFDisplay from './PDFDisplay';
import { ProductRecommendations } from './ProductRecommendations';

interface MessageContentProps {
  message: Message;
  onSendMessage?: (content: {
    text?: string;
    image_url?: string;
    audioBlob?: Blob;
    fileData?: File;
    type: 'text' | 'image' | 'audio' | 'pdf';
  }) => void;
}

// Function to render markdown links as clickable HTML links
const renderMarkdownLinks = (text: string) => {
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = markdownLinkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
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
  
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts.length > 1 ? parts : text;
};

// Componente semplificato per invio media
const SimpleMediaSender = ({ onSendMessage }: { onSendMessage?: MessageContentProps['onSendMessage'] }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Registrazione audio semplificata
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        onSendMessage?.({
          text: '🎵 Messaggio vocale',
          image_url: audioUrl,
          type: 'audio',
          audioBlob: audioBlob
        });

        // Ferma lo stream
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('❌ Errore registrazione:', error);
      alert('Impossibile accedere al microfono');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  // Upload file semplificato
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, fileType: 'image' | 'audio' | 'pdf') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verifica tipo file
    const isValidType = 
      (fileType === 'image' && file.type.startsWith('image/')) ||
      (fileType === 'audio' && file.type.startsWith('audio/')) ||
      (fileType === 'pdf' && file.type === 'application/pdf');

    if (!isValidType) {
      alert(`Tipo di file non valido per ${fileType}`);
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    let messageText = '';
    
    switch (fileType) {
      case 'image':
        messageText = '🖼️ Immagine allegata';
        break;
      case 'audio':
        messageText = '🎵 File audio allegato';
        break;
      case 'pdf':
        messageText = `📄 PDF: ${file.name}`;
        break;
    }

    onSendMessage?.({
      text: messageText,
      image_url: fileUrl,
      type: fileType,
      fileData: file
    });

    // Reset input
    event.target.value = '';
  };

  const sendEmoji = (emoji: string) => {
    onSendMessage?.({
      text: emoji,
      type: 'text'
    });
  };

  if (!onSendMessage) return null;

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border-t">
      {/* Emoticon */}
      <div className="flex gap-1 flex-wrap">
        {['😊', '👍', '❤️', '😂', '🤔', '👌', '🎉', '😍', '🔥', '👏'].map(emoji => (
          <button
            key={emoji}
            onClick={() => sendEmoji(emoji)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-lg hover:scale-110"
            title={`Invia ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Controlli media */}
      <div className="flex gap-2">
        {/* Audio Recording */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-2 rounded-lg transition-all ${
            isRecording 
              ? 'bg-red-500 text-white animate-pulse' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          title={isRecording ? 'Ferma registrazione' : 'Registra audio'}
        >
          {isRecording ? '⏹️' : '🎤'}
        </button>

        {/* Upload buttons */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          title="Carica immagine"
        >
          🖼️
        </button>

        <button
          onClick={() => audioInputRef.current?.click()}
          className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          title="Carica audio"
        >
          🎵
        </button>

        <button
          onClick={() => pdfInputRef.current?.click()}
          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          title="Carica PDF"
        >
          📄
        </button>
      </div>

      {/* Input nascosti */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileUpload(e, 'image')}
        className="hidden"
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        onChange={(e) => handleFileUpload(e, 'audio')}
        className="hidden"
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf"
        onChange={(e) => handleFileUpload(e, 'pdf')}
        className="hidden"
      />
    </div>
  );
};

export const MessageContent = ({ message, onSendMessage }: MessageContentProps) => {
  // Verifica tipo messaggio
  const isAudioMessage = message.text?.includes('🎵') || 
                         (message.image_url && (
                           message.image_url.includes('audio') || 
                           message.image_url.includes('.webm') ||
                           message.image_url.includes('.mp3') ||
                           message.image_url.includes('.wav')
                         ));

  const isPDFMessage = message.text?.includes('📄') || 
                       (message.image_url && message.image_url.includes('.pdf'));

  const isImageMessage = message.text?.includes('🖼️') ||
                        (message.image_url && !isAudioMessage && !isPDFMessage);

  console.log('📝 Message Debug:', {
    text: message.text,
    hasImageUrl: !!message.image_url,
    isAudio: isAudioMessage,
    isPDF: isPDFMessage,
    isImage: isImageMessage
  });

  return (
    <div className="space-y-3">
      {/* Contenuto del messaggio */}
      {message.text && (
        <div className="whitespace-pre-wrap leading-relaxed">
          {renderMarkdownLinks(message.text)}
        </div>
      )}
      
      {/* Media display */}
      {message.image_url && (
        <>
          {isAudioMessage && <AudioMessage audioUrl={message.image_url} />}
          {isPDFMessage && (
            <PDFDisplay 
              pdfPath={message.image_url} 
              fileName={message.text?.split(': ')[1] || 'documento.pdf'}
            />
          )}
          {isImageMessage && <ImageDisplay imageUrl={message.image_url} />}
        </>
      )}

      {/* Prodotti */}
      {message.products && message.products.length > 0 && (
        <ProductRecommendations products={message.products} />
      )}
      
      {/* Controlli invio */}
      <SimpleMediaSender onSendMessage={onSendMessage} />
    </div>
  );
};
