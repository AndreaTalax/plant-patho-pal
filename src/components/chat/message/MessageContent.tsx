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
    type: 'text' | 'image' | 'audio' | 'pdf';
  }) => void;
}

// 🔗 Converte i link markdown in <a> o <PDFDisplay>
const renderMarkdownLinks = (text: string) => {
  // Rimuovi ** di grassetto attorno ai link (gestisce tutti i casi)
  let cleanedText = text.replace(/\*\*(\[.+?\]\(.+?\))\*\*/g, '$1');
  
  // Supporta link markdown anche con spazi/newline tra ] e (
  const markdownLinkRegex = /\[([^\]]+)\]\s*\(([^)]+)\)/g;
  
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  
  while ((match = markdownLinkRegex.exec(cleanedText)) !== null) {
    if (match.index > lastIndex) {
      parts.push(cleanedText.slice(lastIndex, match.index));
    }
    
    const linkText = match[1];
    const linkUrl = match[2].trim();
    
    // Check se è PDF guardando l'estensione nel pathname (non query params)
    const isPdfLink = (() => {
      try {
        const url = new URL(linkUrl, window.location.origin);
        return url.pathname.toLowerCase().endsWith('.pdf');
      } catch {
        return linkUrl.toLowerCase().endsWith('.pdf');
      }
    })();
    
    if (isPdfLink) {
      parts.push(
        <div key={match.index} className="my-2">
          <PDFDisplay 
            pdfPath={linkUrl}
            fileName={linkText || "documento.pdf"}
          />
        </div>
      );
    } else {
      parts.push(
        <a 
          key={match.index}
          href={linkUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline font-medium"
        >
          {linkText}
        </a>
      );
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < cleanedText.length) {
    parts.push(cleanedText.slice(lastIndex));
  }
  
  return <>{parts}</>;
};

// 📎 Componente per invio media
const SimpleMediaSender = ({ onSendMessage }: { onSendMessage?: MessageContentProps['onSendMessage'] }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setMediaRecorder(null);
    setIsRecording(false);
  };

  const startRecording = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Devi essere autenticato per inviare audio');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        try {
          const fileName = `${user.id}/${Date.now()}.webm`;
          
          const { error } = await supabase.storage
            .from('audio-messages')
            .upload(fileName, audioBlob, {
              cacheControl: '3600',
              upsert: false,
              contentType: 'audio/webm'
            });

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage
            .from('audio-messages')
            .getPublicUrl(fileName);

          onSendMessage?.({
            text: '🎵 Messaggio vocale',
            image_url: publicUrl,
            type: 'audio'
          });
        } catch (error) {
          console.error('❌ Errore upload audio:', error);
          alert('Errore nel caricamento dell\'audio');
        } finally {
          cleanup();
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('❌ Errore registrazione:', error);
      alert('Impossibile accedere al microfono');
      cleanup();
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, fileType: 'image' | 'audio' | 'pdf') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isValidType = 
      (fileType === 'image' && file.type.startsWith('image/')) ||
      (fileType === 'audio' && file.type.startsWith('audio/')) ||
      (fileType === 'pdf' && file.type === 'application/pdf');

    if (!isValidType) {
      alert(`Tipo di file non valido per ${fileType}`);
      return;
    }

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Devi essere autenticato per caricare file');
        return;
      }

      const fileExt = file.name.split('.').pop() || 'jpg';
      const bucketName = fileType === 'pdf' ? 'pdfs' : 'plant-images';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      const messageText = {
        image: '📸 Foto della pianta in consulenza',
        audio: '🎵 File audio allegato',
        pdf: `📄 PDF: ${file.name}`
      }[fileType];

      onSendMessage?.({
        text: messageText,
        image_url: publicUrl,
        type: fileType
      });
    } catch (error) {
      console.error('❌ Errore upload file:', error);
      alert('Errore nel caricamento del file');
    } finally {
      event.target.value = '';
    }
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
  // Controlla se c'è un PDF in pdf_path o image_url
  const pdfUrl = (message as any).pdf_path || (
    message.image_url && (
      message.image_url.toLowerCase().includes('.pdf') ||
      message.image_url.toLowerCase().includes('/pdfs/')
    ) ? message.image_url : null
  );

  const isAudioMessage = message.image_url && !pdfUrl && (
    message.image_url.includes('audio') || 
    message.image_url.endsWith('.webm') ||
    message.image_url.endsWith('.mp3') ||
    message.image_url.endsWith('.wav')
  );

  const isPDFMessage = !!pdfUrl;

  const isImageMessage = message.image_url && !isAudioMessage && !isPDFMessage;

  // 🔥 FIX: Mostra testo solo se non è vuoto DOPO trim
  const hasText = message.text && message.text.trim() !== '';

  // 🔍 DEBUG: Log per vedere cosa viene rilevato
  console.log('📊 MessageContent render:', {
    messageId: message.id,
    hasText,
    hasImageUrl: !!message.image_url,
    imageUrl: message.image_url?.substring(0, 50),
    hasPdfPath: !!(message as any).pdf_path,
    pdfPath: (message as any).pdf_path?.substring(0, 50),
    pdfUrl: pdfUrl?.substring(0, 50),
    isAudioMessage,
    isPDFMessage,
    isImageMessage
  });

  return (
    <div className="space-y-3">
      {/* Testo + parsing link - SOLO SE C'È TESTO VERO */}
      {hasText && (
        <div className="whitespace-pre-wrap leading-relaxed">
          {renderMarkdownLinks(message.text)}
        </div>
      )}
      
      {/* Audio */}
      {isAudioMessage && <AudioMessage audioUrl={message.image_url!} />}
      
      {/* Immagine (non audio, non PDF in image_url) */}
      {isImageMessage && <ImageDisplay imageUrl={message.image_url!} />}
      
      {/* PDF - può essere in pdf_path O in image_url */}
      {pdfUrl && (
        <PDFDisplay 
          pdfPath={pdfUrl} 
          fileName={message.text?.split(': ')[1] || 'documento.pdf'}
        />
      )}

      {/* Prodotti */}
      {message.products && message.products.length > 0 && (
        <ProductRecommendations products={message.products} />
      )}

      {/* Media Sender (se onSendMessage è disponibile) */}
      {onSendMessage && <SimpleMediaSender onSendMessage={onSendMessage} />}
    </div>
  );
};
