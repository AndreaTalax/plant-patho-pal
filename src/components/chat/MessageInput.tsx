import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Image, X, Mic, Smile } from 'lucide-react';
import { sendMessage } from './chatService';
import { toast } from 'sonner';
import { uploadPlantImage } from '@/utils/imageStorage';
import { supabase } from '@/integrations/supabase/client';
import AudioRecorder from './AudioRecorder';
import EmojiPicker from './EmojiPicker';

interface MessageInputProps {
  conversationId?: string;
  senderId?: string;
  recipientId?: string;
  onMessageSent?: () => void;
  onSendMessage?: (text: string) => void | Promise<void>;
  isSending?: boolean;
  isMasterAccount?: boolean;
  disabledInput?: boolean;
}

const MessageInput = ({
  conversationId,
  senderId,
  recipientId,
  onMessageSent,
  onSendMessage,
  isSending: externalIsSending = false,
  isMasterAccount = false,
  disabledInput = false
}: any) => {
  const [message, setMessage] = useState('');
  const [internalIsSending, setInternalIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Emoji
  const [showEmoji, setShowEmoji] = useState(false);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);

  // AUDIO: stato solo per abilitare/disabilitare il bottone
  const [isSendingAudio, setIsSendingAudio] = useState(false);

  const isSending = externalIsSending || internalIsSending || uploadingImage || isSendingAudio;

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Il file deve essere un\'immagine');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'immagine deve essere inferiore a 5MB');
      return;
    }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // AUDIO: nuovo handler separato
  const handleSendAudio = async (audioBlob: Blob) => {
    if (!audioBlob) return;
    setIsSendingAudio(true);
    try {
      // Copia/usa la stessa logica che avevi in sendAudioMessage per upload su supabase e notifica
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('User non autenticato');
        setIsSendingAudio(false);
        return;
      }
      const fileName = `audio_${Date.now()}.webm`;
      const { data, error } = await supabase.storage
        .from('plant-images')
        .upload(`${user.id}/${fileName}`, audioBlob, { contentType: 'audio/webm' });
      if (error) throw error;
      const { data: pubUrl } = supabase.storage
        .from('plant-images')
        .getPublicUrl(`${user.id}/${fileName}`);
      if (pubUrl?.publicUrl && onSendMessage) {
        await onSendMessage(`[AUDIO] ${pubUrl.publicUrl}`);
        toast.success('Messaggio vocale inviato!');
      }
    } catch (e) {
      toast.error('Errore invio audio');
    }
    setIsSendingAudio(false);
  };

  /**
   * Sends a message with optional image attachment
   */
  const handleSend = async () => {
    if ((!message.trim() && !selectedImage) || isSending) return;
    let imageUrl: string | null = null;
    try {
      // Upload image if selected
      if (selectedImage) {
        setUploadingImage(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('User non autenticato');
          setUploadingImage(false);
          return;
        }
        imageUrl = await uploadPlantImage(selectedImage, user.id);
        console.log('✅ Image uploaded successfully:', imageUrl);
      }
      // Se fornita una funzione di invio esterna, usala (per hook realtime)
      if (onSendMessage) {
        if (imageUrl && message.trim()) {
          await onSendMessage(message.trim());
          await sendImageMessage(imageUrl, conversationId!, senderId!, recipientId!);
        } else if (imageUrl) {
          await sendImageMessage(imageUrl, conversationId!, senderId!, recipientId!);
        } else {
          await onSendMessage(message.trim());
        }
        setMessage('');
        removeSelectedImage();
        return;
      }
      if (!conversationId || !senderId || !recipientId) {
        toast.error('Errore: parametri mancanti');
        return;
      }
      setInternalIsSending(true);
      if (message.trim()) {
        const result = await sendMessage(
          conversationId,
          senderId,
          recipientId,
          message.trim()
        );
        if (!result) {
          throw new Error('Failed to send text message');
        }
      }
      if (imageUrl) {
        await sendImageMessage(imageUrl, conversationId, senderId, recipientId);
      }
      setMessage('');
      removeSelectedImage();
      onMessageSent?.();
      console.log('✅ Message sent successfully');
    } catch (error: any) {
      if (error && error.message && (error.message.includes("502") || error.message.includes("Bad Gateway"))) {
        toast.error('Errore server temporaneo (502). Riprova tra poco.');
      } else {
        toast.error(error?.message || 'Errore nell\'invio del messaggio');
      }
      console.error('❌ Error sending message:', error);
    } finally {
      setInternalIsSending(false);
      setUploadingImage(false);
    }
  };

  const sendImageMessage = async (imageUrl: string, conversationId: string, senderId: string, recipientId: string) => {
    try {
      console.log('📸 Sending image message with URL:', imageUrl);
      const imageMessage = `📸 Immagine allegata`;
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          recipient_id: recipientId,
          content: imageMessage,
          text: imageMessage,
          image_url: imageUrl,
          metadata: {
            type: 'user_image',
            imageUrl: imageUrl
          }
        });
      if (error) {
        console.error('❌ Error sending image message:', error);
        throw new Error(`Failed to send image: ${error.message}`);
      }
      console.log('✅ Image message sent successfully');
    } catch (err: any) {
      throw err;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // EMOJI HANDLER
  const handleSelectEmoji = (emoji: any) => {
    setMessage(prev => prev + (emoji.native ?? emoji.shortcodes ?? ''));
    setShowEmoji(false);
  };

  return (
    <div className="border-t border-drplant-green/20 bg-white/80 backdrop-blur-sm p-6">
      <div className="max-w-4xl mx-auto">
        {imagePreview && (
          <div className="mb-4 relative inline-block">
            <img 
              src={imagePreview} 
              alt="Anteprima" 
              className="max-h-32 rounded-lg shadow-md"
            />
            <button
              onClick={removeSelectedImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
              tabIndex={-1}
              disabled={disabledInput}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* AUDIO RECORDER */}
        <AudioRecorder onSendAudio={handleSendAudio} disabled={isSending || disabledInput} />

        <div className="flex gap-2 sm:gap-4 items-end">
          <div className="flex-1">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                disabledInput
                  ? "Chat non disponibile. Controlla la connessione e riprova tra poco."
                  : "Scrivi il tuo messaggio all'esperto..."}
              className="min-h-[80px] resize-none border-drplant-green/30 focus:border-drplant-blue focus:ring-drplant-blue/20 rounded-2xl bg-white/90 backdrop-blur-sm"
              disabled={isSending || disabledInput}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setShowEmoji(s => !s)}
              ref={emojiBtnRef}
              disabled={disabledInput}
              className="h-[44px] px-1 border-drplant-green/30 hover:bg-drplant-green/10 rounded-2xl"
            >
              <Smile className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending || disabledInput}
              className="h-[44px] px-1 border-drplant-green/30 hover:bg-drplant-green/10 rounded-2xl"
            >
              <Image className="h-5 w-5" />
            </Button>
          </div>
          <Button
            onClick={handleSend}
            disabled={(!message.trim() && !selectedImage) || isSending || disabledInput}
            className="h-[80px] px-6 bg-gradient-to-r from-drplant-green to-drplant-green-dark hover:from-drplant-green-dark hover:to-drplant-green text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        {/* EMOJI PICKER */}
        <EmojiPicker
          open={showEmoji}
          onSelect={handleSelectEmoji}
          onClose={() => setShowEmoji(false)}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
          disabled={disabledInput}
        />
      </div>
    </div>
  );
};

export default MessageInput;
