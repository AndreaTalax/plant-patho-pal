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

// 🔗 Converte i link markdown in <a> o <PDFDisplay>
const renderMarkdownLinks = (text: string) => {
  // Rimuovi prima eventuali ** di grassetto che avvolgono i link
  let cleanedText = text.replace(/\*\*\[/g, '[').replace(/\]\s*\([^)]+\)\*\*/g, (match) => {
    return match.replace(/\*\*/g, '');
  });
  
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
    const linkUrl = match[2].trim(); // Rimuovi spazi
    
    // Check if URL contains .pdf (before query params)
    const isPdfLink = linkUrl.toLowerCase().includes('.pdf');
    
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

// 📎 Componente semplificato per invio media
const SimpleMediaSender = ({ onSendMessage }: { onSendMessage?: MessageContentProps['onSendMessage'] }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        // IMPORTANTE: Carica l'audio su Supabase Storage invece di creare URL blob
        try {
          console.log('📤 Caricamento audio su Supabase Storage...');
          const { supabase } = await import('@/integrations/supabase/client');
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            alert('Devi essere autenticato per inviare audio');
            stream.getTracks().forEach(track => track.stop());
            return;
          }

          const fileName = `${user.id}/${Date.now()}.webm`;
          
          const { data, error } = await supabase.storage
            .from('audio-messages')
            .upload(fileName, audioBlob, {
              cacheControl: '3600',
              upsert: false,
              contentType: 'audio/webm'
            });

          if (error) {
            console.error('❌ Errore upload audio:', error);
            alert('Errore nel caricamento dell\'audio');
            stream.getTracks().forEach(track => track.stop());
            return;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('audio-messages')
            .getPublicUrl(fileName);

          console.log('✅ Audio caricato, URL pubblico:', publicUrl);
          
          onSendMessage?.({
            text: '🎵 Messaggio vocale',
            image_url: publicUrl,  // <- URL pubblico di Supabase Storage
            type: 'audio',
            audioBlob: audioBlob
          });
        } catch (error) {
          console.error('❌ Errore caricamento audio:', error);
          alert('Errore nel caricamento dell\'audio');
        }

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

    // IMPORTANTE: Carica il file su Supabase Storage invece di creare URL blob
    try {
      console.log('📤 Caricamento file su Supabase Storage...');
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Devi essere autenticato per caricare file');
        return;
      }

      const fileExt = file.name.split('.').pop() || 'jpg';
      const bucketName = fileType === 'pdf' ? 'pdfs' : 'plant-images';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      console.log(`📤 Caricamento su bucket ${bucketName}: ${fileName}`);
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Errore upload:', error);
        alert('Errore nel caricamento del file');
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      console.log('✅ File caricato, URL pubblico:', publicUrl);

      let messageText = '';
      
      switch (fileType) {
        case 'image':
          messageText = '📸 Foto della pianta in consulenza';
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
        image_url: publicUrl,  // <- URL pubblico di Supabase Storage
        type: fileType,
        fileData: file
      });
    } catch (error) {
      console.error('❌ Errore caricamento file:', error);
      alert('Errore nel caricamento del file');
    }

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
  const isAudioMessage =
    (message.image_url && (
      message.image_url.includes('audio') || 
      message.image_url.endsWith('.webm') ||
      message.image_url.endsWith('.mp3') ||
      message.image_url.endsWith('.wav')
    ));

  const isPDFMessage =
    (message.image_url && (
      message.image_url.toLowerCase().includes('.pdf') ||
      message.image_url.toLowerCase().includes('/pdfs/')
    ));

  const isImageMessage =
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
      {/* Testo + parsing link */}
      {message.text && (
        <div className="whitespace-pre-wrap leading-relaxed">
          {renderMarkdownLinks(message.text)}
        </div>
      )}
      
      {/* Media */}
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
    </div>
  );
};
