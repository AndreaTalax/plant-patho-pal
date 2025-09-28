
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Image as ImageIcon, Loader2, Smile, Mic, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { uploadPlantImage } from '@/utils/imageStorage';
import { useAuth } from '@/context/AuthContext';
import { AccessibleButton } from '@/components/ui/accessible-button';
import { AccessibleControlPanel } from '@/components/ui/accessible-controls';
import { voiceOverAnnouncements } from '@/utils/accessibility';
import { triggerHaptic } from '@/utils/hapticFeedback';
import AudioRecorder from './AudioRecorder';
import EmojiPicker from './EmojiPicker';

interface MessageInputProps {
  conversationId: string;
  senderId: string;
  recipientId: string;
  onSendMessage: (message: string, imageUrl?: string) => Promise<void>;
  isMasterAccount?: boolean;
  enableAudio?: boolean;
  enableEmoji?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  senderId,
  recipientId,
  onSendMessage,
  isMasterAccount = false,
  enableAudio = true,
  enableEmoji = true
}) => {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { userProfile } = useAuth();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    try {
      setIsSending(true);
      await onSendMessage(message.trim());
      
      // Feedback tattile per messaggio inviato
      triggerHaptic('message_sent');
      
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Errore invio messaggio:', error);
      toast.error('Errore nell\'invio del messaggio');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📎 Click su carica file per amministratore');
    const file = event.target.files?.[0];
    if (!file || !userProfile?.id) return;

    // Check if it's an image
    if (file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('L\'immagine deve essere inferiore a 10MB');
        return;
      }

      setIsUploading(true);
      try {
        const imageUrl = await uploadPlantImage(file, userProfile.id);
        await onSendMessage('📸 Immagine allegata', imageUrl);
        
        // Feedback tattile per foto inviata
        triggerHaptic('photo');
        
        toast.success('Immagine inviata con successo!');
      } catch (error) {
        console.error('Errore upload immagine:', error);
        toast.error('Errore nel caricamento dell\'immagine');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } 
    // Check if it's a PDF
    else if (file.type === 'application/pdf') {
      if (file.size > 20 * 1024 * 1024) {
        toast.error('Il PDF deve essere inferiore a 20MB');
        return;
      }

      setIsUploading(true);
      try {
        const pdfUrl = await uploadPlantImage(file, userProfile.id);
        await onSendMessage('📄 PDF allegato', pdfUrl);
        
        // Feedback tattile per PDF inviato
        triggerHaptic('message_sent');
        
        toast.success('PDF inviato con successo!');
      } catch (error) {
        console.error('Errore upload PDF:', error);
        toast.error('Errore nel caricamento del PDF');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } else {
      toast.error('Seleziona solo immagini o file PDF');
      return;
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    console.log('😀 Emoji selezionata:', emoji);
    if (emoji?.native) {
      // Feedback tattile per emoji selezionata
      triggerHaptic('reaction');
      
      setMessage(prev => prev + emoji.native);
      setShowEmojiPicker(false);
      
      console.log('😀 Emoji aggiunta al messaggio');
      
      // Focus back to textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleAudioSend = async (audioBlob: Blob) => {
    console.log('🎵 Gestione invio audio dal MessageInput');
    // L'AudioRecorder gestisce già l'upload tramite la funzione edge
  };

  console.log('📧 MessageInput render:', { enableAudio, enableEmoji, isMasterAccount });
  
  return (
    <div className="relative">
      {/* Emoji Picker - positioned above the input */}
      {enableEmoji && (
        <EmojiPicker
          onSelect={handleEmojiSelect}
          open={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}
      
      <div className="bg-white border-t border-gray-200 p-3 max-w-2xl mx-auto">
        {/* Message Input Area - centered */}
        <div className="w-full mb-3">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Scrivi un messaggio..."
            className="min-h-[40px] max-h-[120px] resize-none text-sm w-full"
            disabled={isSending || isUploading}
          />
        </div>

        {/* Action Buttons Row - centered below input */}
        <AccessibleControlPanel 
          className="bg-transparent p-0"
          title="Controlli Messaggio"
        >
          {/* Emoji Button */}
          {enableEmoji && (
            <AccessibleButton
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log('😀 Click emoji per amministratore, current state:', showEmojiPicker);
                setShowEmojiPicker(!showEmojiPicker);
              }}
              disabled={isSending || isUploading}
              label="Seleziona emoji"
              className="h-10 w-10 p-0"
              onLongPress={() => voiceOverAnnouncements.longPressAvailable()}
            >
              <Smile className="h-5 w-5" />
            </AccessibleButton>
          )}

          {/* Image Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleImageUpload}
            className="hidden"
          />
          <AccessibleButton
            variant="ghost"
            size="sm"
            onClick={() => {
              console.log('📎 Click allegati per amministratore');
              fileInputRef.current?.click();
            }}
            disabled={isSending || isUploading}
            label="Carica immagine o PDF"
            className="h-10 w-10 p-0"
            onSwipeUp={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
          </AccessibleButton>

          {/* Audio Recorder Button */}
          {enableAudio && (
            <AudioRecorder 
              onSendAudio={handleAudioSend}
              disabled={isSending || isUploading}
              conversationId={conversationId}
              senderId={senderId}
              recipientId={recipientId}
            />
          )}

          {/* Send Button */}
          <AccessibleButton
            onClick={handleSend}
            disabled={!message.trim() || isSending || isUploading}
            label="Invia messaggio"
            className="h-10 px-4"
            size="sm"
            onDoubleClick={handleSend}
            onSwipeRight={handleSend}
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </AccessibleButton>
        </AccessibleControlPanel>

        {/* Helper Text - smaller and less prominent */}
        <div className="text-xs text-gray-400 mt-2 text-center">
          Invio per inviare • Shift+Invio per andare a capo
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
