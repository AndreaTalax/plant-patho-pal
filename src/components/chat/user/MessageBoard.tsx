
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Loader2,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { uploadPlantImage } from '@/utils/imageStorage';
import { useAuth } from '@/context/AuthContext';
import AudioRecorder from '@/components/chat/AudioRecorder';
import EmojiPicker from '@/components/chat/EmojiPicker';

interface MessageBoardProps {
  onSendMessage: (message: string, imageUrl?: string) => Promise<void>;
  isSending: boolean;
  isConnected: boolean;
  disabled?: boolean;
  conversationId?: string;
  senderId?: string;
  recipientId?: string;
}

export const MessageBoard: React.FC<MessageBoardProps> = ({
  onSendMessage,
  isSending,
  isConnected,
  disabled = false,
  conversationId,
  senderId,
  recipientId
}) => {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
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
    if (!message.trim() || isSending || !isConnected) return;

    try {
      await onSendMessage(message.trim());
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Errore invio messaggio:', error);
      toast.error('Errore nell\'invio del messaggio');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      console.log('📤 Upload immagine in corso...');
      const imageUrl = await uploadPlantImage(file, userProfile.id);
      console.log('✅ Immagine caricata:', imageUrl);
      
      await onSendMessage('📸 Immagine allegata', imageUrl);
      toast.success('Immagine inviata con successo!');
    } catch (error) {
      console.error('❌ Errore upload immagine:', error);
      toast.error('Errore nel caricamento dell\'immagine');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleAudioSend = async (audioBlob: Blob) => {
    console.log('🎵 Gestione invio audio dal MessageBoard');
    // L'AudioRecorder gestisce già l'upload tramite la funzione edge
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

  const isDisabled = disabled || !isConnected || isSending || isUploading;

  return (
    <div className="bg-white border-t border-gray-200 shadow-lg">
      <div className="p-4">
        {/* Connection Status - Sempre visibile quando disconnesso */}
        {!isConnected && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-700 text-sm font-medium">
                Connessione persa - Riconnessione in corso...
              </span>
            </div>
          </div>
        )}

        {/* Audio Recorder */}
        <AudioRecorder 
          onSendAudio={handleAudioSend}
          disabled={isDisabled}
          conversationId={conversationId}
          senderId={senderId}
          recipientId={recipientId}
        />

        {/* Message Input Area */}
        <div className="space-y-3">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isDisabled 
                  ? "Connessione in corso..." 
                  : "Scrivi il tuo messaggio a Marco Nigro..."
              }
              disabled={isDisabled}
              className={`
                min-h-[60px] max-h-[200px] resize-none pr-16 w-full
                ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                border border-gray-300 rounded-lg p-3
              `}
            />
            
            {/* Emoji Picker Button */}
            <div className="absolute bottom-2 right-2 flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={isDisabled}
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <Smile className="h-3 w-3" />
              </Button>
              
              <EmojiPicker
                onSelect={handleEmojiSelect}
                open={showEmojiPicker}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Attach Image */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="ghost"
                size="sm"
                disabled={isDisabled}
                onClick={triggerFileUpload}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
                <span className="text-xs">
                  {isUploading ? 'Upload...' : 'Immagine'}
                </span>
              </Button>
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={isDisabled || !message.trim()}
              className={`
                flex items-center space-x-2 min-w-[100px] px-4 py-2
                ${!message.trim() || isDisabled 
                  ? 'bg-gray-300 cursor-not-allowed hover:bg-gray-300' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }
              `}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Invio...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Invia</span>
                </>
              )}
            </Button>
          </div>

          {/* Helper Text */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Premi Invio per inviare, Shift+Invio per andare a capo</span>
            <span className={`
              font-medium
              ${isConnected ? 'text-green-600' : 'text-red-600'}
            `}>
              {isConnected ? '● Online' : '● Offline'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
