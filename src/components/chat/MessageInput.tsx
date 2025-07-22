
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Image as ImageIcon, Loader2, Smile, Mic } from 'lucide-react';
import { toast } from 'sonner';
import { uploadPlantImage } from '@/utils/imageStorage';
import { useAuth } from '@/context/AuthContext';
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
    const file = event.target.files?.[0];
    if (!file || !userProfile?.id) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Seleziona solo immagini');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('L\'immagine deve essere inferiore a 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await uploadPlantImage(file, userProfile.id);
      await onSendMessage('📸 Immagine allegata', imageUrl);
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
  };

  const handleEmojiSelect = (emoji: any) => {
    if (emoji?.native) {
      setMessage(prev => prev + emoji.native);
      setShowEmojiPicker(false);
      
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
    <div className="bg-white border-t border-gray-200 p-4">
      
      <div className="flex items-end gap-3">
        {/* Message Input Area */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Scrivi un messaggio..."
            className="min-h-[50px] max-h-[200px] resize-none"
            disabled={isSending || isUploading}
          />
          
          {/* Emoji Picker */}
          {enableEmoji && (
            <div className="absolute top-2 right-2">
              <EmojiPicker
                onSelect={handleEmojiSelect}
                open={showEmojiPicker}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Audio Recorder Button */}
          {enableAudio && (
            <div>
              <AudioRecorder 
                onSendAudio={handleAudioSend}
                disabled={isSending || isUploading}
                conversationId={conversationId}
                senderId={senderId}
                recipientId={recipientId}
              />
            </div>
          )}

          {/* Emoji Button */}
          {enableEmoji && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={isSending || isUploading}
              className="h-10 w-10 p-0"
            >
              <Smile className="h-4 w-4" />
            </Button>
          )}

          {/* Image Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || isUploading}
            className="h-10 w-10 p-0"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
          </Button>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isSending || isUploading}
            className="h-10 px-4"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Invio...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Invia
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Helper Text */}
      <div className="text-xs text-gray-500 mt-2 text-center">
        Premi Invio per inviare, Shift+Invio per andare a capo
      </div>
    </div>
  );
};

export default MessageInput;
