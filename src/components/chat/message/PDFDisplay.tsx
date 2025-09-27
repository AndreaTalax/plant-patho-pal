import React, { useState, useRef } from 'react';
import { Message } from '../types';
import { AudioMessage } from './AudioMessage';
import { ImageDisplay } from './ImageDisplay';
import { PDFDisplay } from './PDFDisplay';
import { ProductRecommendations } from './ProductRecommendations';

interface MessageContentProps {
  message: Message;
  onSendMessage?: (content: {
    text?: string;
    image_url?: string;
    audio?: File;
    pdf?: File;
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

// Componente per inviare contenuti multimediali
const MediaSender = ({ onSendMessage }: { onSendMessage?: MessageContentProps['onSendMessage'] }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Gestione registrazione audio
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
        const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
        
        onSendMessage?.({
          text: '🎵 Messaggio vocale',
          type: 'audio',
          audio: audioFile
        });

        // Ferma tutti i track dello stream
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Errore durante l\'avvio della registrazione:', error);
      alert('Impossibile accedere al microfono. Verifica le autorizzazioni.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  // Gestione upload file immagine
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      onSendMessage?.({
        text: '🖼️ Immagine allegata',
        image_url: imageUrl,
        type: 'image'
      });
    }
  };

  // Gestione upload audio file
  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      const audioUrl = URL.createObjectURL(file);
      onSendMessage?.({
        text: '🎵 File audio allegato',
        image_url: audioUrl,
        type: 'audio',
        audio: file
      });
    }
  };

  // Gestione upload PDF
  const handlePDFUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const pdfUrl = URL.createObjectURL(file);
      onSendMessage?.({
        text: `📄 PDF allegato: ${file.name}`,
        image_url: pdfUrl,
        type: 'pdf',
        pdf: file,
        originalFile: file  // ← Passa il file originale
      });
    }
  };

  // Invio emoticon
  const sendEmoji = (emoji: string) => {
    onSendMessage?.({
      text: emoji,
      type: 'text'
    });
  };

  if (!onSendMessage) return null;

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border-t">
      {/* Emoticon rapide */}
      <div className="flex gap-1">
        {['😊', '👍', '❤️', '😂', '🤔', '👌', '🎉', '😍'].map(emoji => (
          <button
            key={emoji}
            onClick={() => sendEmoji(emoji)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-lg"
            title={`Invia ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Controlli media */}
      <div className="flex gap-2">
        {/* Pulsante registrazione audio */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-2 rounded-lg transition-colors ${
            isRecording 
              ? 'bg-red-500 text-white animate-pulse' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          title={isRecording ? 'Ferma registrazione' : 'Registra audio'}
        >
          {isRecording ? '⏹️' : '🎤'}
        </button>

        {/* Upload immagine */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          title="Carica immagine"
        >
          🖼️
        </button>

        {/* Upload audio */}
        <button
          onClick={() => audioInputRef.current?.click()}
          className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          title="Carica file audio"
        >
          🎵
        </button>

        {/* Upload PDF */}
        <button
          onClick={() => pdfInputRef.current?.click()}
          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          title="Carica PDF"
        >
          📄
        </button>
      </div>

      {/* Input file nascosti */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        onChange={handleAudioUpload}
        className="hidden"
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf"
        onChange={handlePDFUpload}
        className="hidden"
      />
    </div>
  );
};

export const MessageContent = ({ message, onSendMessage }: MessageContentProps) => {
  // Verifica se il messaggio è audio
  const isAudioMessage = message.text?.includes('🎵 Messaggio vocale') || 
                         message.text === '🎵 Messaggio vocale' ||
                         message.text?.includes('🎵 File audio') ||
                         (message.image_url && (
                           message.image_url.includes('audio_') || 
                           message.image_url.includes('.webm') ||
                           message.image_url.includes('.mp3') ||
                           message.image_url.includes('.wav') ||
                           message.image_url.includes('.m4a') ||
                           message.image_url.includes('audio-messages')
                         ));

  // Verifica se il messaggio è un PDF
  const isPDFMessage = message.text?.includes('📄 PDF allegato') || 
                       message.text?.includes('PDF allegato') ||
                       (message.image_url && (
                         message.image_url.includes('.pdf') || 
                         message.image_url.includes('application/pdf')
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

  // Render del contenuto del messaggio
  const renderMessageContent = () => {
    if (isAudioMessage && message.image_url) {
      return <AudioMessage audioUrl={message.image_url} />;
    }

    if (isPDFMessage && message.image_url) {
      return (
        <div className="space-y-3">
          {message.text && (
            <div className="whitespace-pre-wrap leading-relaxed">
              {renderMarkdownLinks(message.text)}
            </div>
          )}
          <PDFDisplay 
            pdfPath={message.image_url} 
            fileName="Documento.pdf"
            originalFile={message.originalFile} 
          />
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {message.text && (
          <div className="whitespace-pre-wrap leading-relaxed">
            {renderMarkdownLinks(message.text)}
          </div>
        )}
        
        {message.image_url && !isAudioMessage && !isPDFMessage && (
          <ImageDisplay imageUrl={message.image_url} />
        )}

        {message.products && message.products.length > 0 && (
          <ProductRecommendations products={message.products} />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {renderMessageContent()}
      
      {/* Mostra i controlli per l'invio solo se è fornita la funzione onSendMessage */}
      {onSendMessage && (
        <MediaSender onSendMessage={onSendMessage} />
      )}
    </div>
  );
};
