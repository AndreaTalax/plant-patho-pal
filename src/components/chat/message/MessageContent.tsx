import React, { useState, useRef } from 'react';
import { Message } from '../types';
import { AudioMessage } from './AudioMessage';
import { ImageDisplay } from './ImageDisplay';
import PDFDisplay from './PDFDisplay';
import { ProductRecommendations } from './ProductRecommendations';

// ======================================================
// Tipi e interfacce
// ======================================================
interface MessageContentProps {
  message: Message;
  onSendMessage?: (content: {
    text?: string;
    image_url?: string;
    pdf_path?: string;
    type: 'text' | 'image' | 'audio' | 'pdf';
  }) => void;
}

// ======================================================
// Parser dei link Markdown (supporta PDF)
// ======================================================
const renderMarkdownLinks = (text: string) => {
  const cleanText = text.replace(/\*\*(\[.+?\]\(.+?\))\*\*/g, '$1');
  const regex = /\[([^\]]+)\]\s*\(([^)]+)\)/g;

  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(cleanText)) !== null) {
    if (match.index > lastIndex) {
      parts.push(cleanText.slice(lastIndex, match.index));
    }

    const [_, linkText, rawUrl] = match;
    const url = rawUrl.trim();

    const isPdf =
      (() => {
        try {
          const parsed = new URL(url, window.location.origin);
          return parsed.pathname.toLowerCase().endsWith('.pdf');
        } catch {
          return url.toLowerCase().endsWith('.pdf');
        }
      })();

    if (isPdf) {
      parts.push(
        <div key={match.index} className="my-2">
          <PDFDisplay pdfPath={url} fileName={linkText || 'documento.pdf'} />
        </div>
      );
    } else {
      parts.push(
        <a
          key={match.index}
          href={url}
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

  if (lastIndex < cleanText.length) parts.push(cleanText.slice(lastIndex));
  return <>{parts}</>;
};

// ======================================================
// Componente: Invio Media (immagini, audio, PDF, emoji)
// ======================================================
const SimpleMediaSender = ({ onSendMessage }: { onSendMessage?: MessageContentProps['onSendMessage'] }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  // ------------------------------------------------------
  // Gestione registrazione audio
  // ------------------------------------------------------
  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setRecorder(null);
    setIsRecording(false);
  };

  const startRecording = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert('Devi essere autenticato per registrare audio.');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = e => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const filePath = `${user.id}/${Date.now()}.webm`;

        try {
          const { error } = await supabase.storage
            .from('audio-messages')
            .upload(filePath, blob, { cacheControl: '3600', contentType: 'audio/webm' });
          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage.from('audio-messages').getPublicUrl(filePath);
          onSendMessage?.({
            text: '🎵 Messaggio vocale',
            image_url: publicUrl,
            type: 'audio',
          });
        } catch (err) {
          console.error('Errore upload audio:', err);
          alert('Errore nel caricamento dell’audio.');
        } finally {
          cleanup();
        }
      };

      mediaRecorder.start();
      setRecorder(mediaRecorder);
      setIsRecording(true);
    } catch (err) {
      console.error('Errore registrazione audio:', err);
      alert('Impossibile accedere al microfono.');
      cleanup();
    }
  };

  const stopRecording = () => recorder?.state === 'recording' && recorder.stop();

  // ------------------------------------------------------
  // Upload file generico (immagine, audio, pdf)
  // ------------------------------------------------------
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'audio' | 'pdf') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const valid =
      (type === 'image' && file.type.startsWith('image/')) ||
      (type === 'audio' && file.type.startsWith('audio/')) ||
      (type === 'pdf' && file.type === 'application/pdf');

    if (!valid) {
      alert(`Tipo di file non valido per ${type}.`);
      return;
    }

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert('Devi essere autenticato per caricare file.');

      const ext = file.name.split('.').pop() || 'dat';
      const bucket = type === 'pdf' ? 'pdfs' : 'plant-images';
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage.from(bucket).upload(filePath, file, { cacheControl: '3600' });
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
      console.log(`✅ File caricato (${type}):`, publicUrl);

      const messages = {
        image: '📸 Foto della pianta in consulenza',
        audio: '🎵 File audio allegato',
        pdf: `📄 PDF: ${file.name}`,
      };

      onSendMessage?.({
        text: messages[type],
        image_url: publicUrl,
        ...(type === 'pdf' && { pdf_path: publicUrl }),
        type,
      });
    } catch (err) {
      console.error('Errore upload file:', err);
      alert('Errore durante il caricamento.');
    } finally {
      e.target.value = '';
    }
  };

  // ------------------------------------------------------
  // Emoji sender
  // ------------------------------------------------------
  const sendEmoji = (emoji: string) => onSendMessage?.({ text: emoji, type: 'text' });

  if (!onSendMessage) return null;

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border-t">
      {/* Emojis */}
      <div className="flex gap-1 flex-wrap">
        {['😊', '👍', '❤️', '😂', '🤔', '👌', '🎉', '😍', '🔥', '👏'].map(emoji => (
          <button
            key={emoji}
            onClick={() => sendEmoji(emoji)}
            className="p-2 text-lg rounded-lg hover:bg-gray-200 hover:scale-110 transition"
            title={`Invia ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Media Controls */}
      <div className="flex gap-2">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-2 rounded-lg transition ${
            isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          title={isRecording ? 'Ferma registrazione' : 'Registra audio'}
        >
          {isRecording ? '⏹️' : '🎤'}
        </button>

        <button
          onClick={() => fileRef.current?.click()}
          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
          title="Carica immagine"
        >
          🖼️
        </button>

        <button
          onClick={() => audioRef.current?.click()}
          className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
          title="Carica audio"
        >
          🎵
        </button>

        <button
          onClick={() => pdfRef.current?.click()}
          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          title="Carica PDF"
        >
          📄
        </button>
      </div>

      {/* Hidden Inputs */}
      <input ref={fileRef} type="file" accept="image/*" onChange={e => handleFileUpload(e, 'image')} className="hidden" />
      <input ref={audioRef} type="file" accept="audio/*" onChange={e => handleFileUpload(e, 'audio')} className="hidden" />
      <input ref={pdfRef} type="file" accept=".pdf" onChange={e => handleFileUpload(e, 'pdf')} className="hidden" />
    </div>
  );
};

// ======================================================
// Componente principale
// ======================================================
export const MessageContent = ({ message, onSendMessage }: MessageContentProps) => {
  // Determinazione tipo messaggio
  const pdfUrl =
    (message as any).pdf_path ||
    (message.image_url && /\.(pdf)(\?|$)/i.test(message.image_url) ? message.image_url : null);

  const isAudio =
    message.image_url &&
    !pdfUrl &&
    (message.image_url.includes('audio') ||
      /\.(webm|mp3|wav)$/i.test(message.image_url));

  const isImage =
    message.image_url &&
    !isAudio &&
    !pdfUrl &&
    !message.image_url.toLowerCase().includes('.pdf');

  const hasText = message.text?.trim();

  return (
    <div className="space-y-3">
      {hasText && <div className="whitespace-pre-wrap leading-relaxed">{renderMarkdownLinks(message.text)}</div>}
      {isAudio && <AudioMessage audioUrl={message.image_url!} />}
      {isImage && <ImageDisplay imageUrl={message.image_url!} />}
      {pdfUrl && <PDFDisplay pdfPath={pdfUrl} fileName={message.text?.split(': ')[1] || 'documento.pdf'} />}
      {message.products?.length > 0 && <ProductRecommendations products={message.products} />}
      {onSendMessage && <SimpleMediaSender onSendMessage={onSendMessage} />}
    </div>
  );
};
