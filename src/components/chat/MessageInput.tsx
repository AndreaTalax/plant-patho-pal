import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Paperclip, Image, X } from 'lucide-react';
import { sendMessage } from './chatService';
import { toast } from 'sonner';
import { uploadPlantImage } from '@/utils/imageStorage';
import { supabase } from '@/integrations/supabase/client';

interface MessageInputProps {
  conversationId?: string;
  senderId?: string;
  recipientId?: string;
  onMessageSent?: () => void;
  onSendMessage?: (text: string) => void | Promise<void>;
  isSending?: boolean;
  isMasterAccount?: boolean;
}

/**
 * Handles message input and sending logic within a chat interface with image upload support.
 */
const MessageInput = ({ 
  conversationId, 
  senderId, 
  recipientId, 
  onMessageSent, 
  onSendMessage,
  isSending: externalIsSending = false,
  isMasterAccount = false
}: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [internalIsSending, setInternalIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isSending = externalIsSending || internalIsSending || uploadingImage;

  /**
   * Handles image file selection and creates preview
   */
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Il file deve essere un\'immagine');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('L\'immagine deve essere inferiore a 10MB');
      return;
    }

    setSelectedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Removes the selected image
   */
  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
          throw new Error('User not authenticated');
        }

        imageUrl = await uploadPlantImage(selectedImage, user.id);
        console.log('✅ Image uploaded successfully:', imageUrl);
      }

      // If onSendMessage is provided, use it (for hooks-based components)
      if (onSendMessage) {
        if (imageUrl && message.trim()) {
          // Send text message first
          await onSendMessage(message.trim());
          // Then send image as separate message
          await sendImageMessage(imageUrl, conversationId!, senderId!, recipientId!);
        } else if (imageUrl) {
          // Send only image
          await sendImageMessage(imageUrl, conversationId!, senderId!, recipientId!);
        } else {
          // Send only text
          await onSendMessage(message.trim());
        }
        
        setMessage('');
        removeSelectedImage();
        return;
      }

      // Otherwise use the legacy ChatService approach
      if (!conversationId || !senderId || !recipientId) {
        toast.error('Errore: parametri mancanti');
        return;
      }

      setInternalIsSending(true);
      
      // Send text message if present
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

      // Send image message if uploaded
      if (imageUrl) {
        await sendImageMessage(imageUrl, conversationId, senderId, recipientId);
      }

      setMessage('');
      removeSelectedImage();
      onMessageSent?.();
      console.log('✅ Message sent successfully');
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast.error('Errore nell\'invio del messaggio');
    } finally {
      setInternalIsSending(false);
      setUploadingImage(false);
    }
  };

  /**
   * Sends an image as a separate message
   */
  const sendImageMessage = async (imageUrl: string, conversationId: string, senderId: string, recipientId: string) => {
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
      throw new Error(`Failed to send image: ${error.message}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-drplant-green/20 bg-white/80 backdrop-blur-sm p-6">
      <div className="max-w-4xl mx-auto">
        {/* Image preview */}
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
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Scrivi il tuo messaggio all'esperto..."
              className="min-h-[80px] resize-none border-drplant-green/30 focus:border-drplant-blue focus:ring-drplant-blue/20 rounded-2xl bg-white/90 backdrop-blur-sm"
              disabled={isSending}
            />
          </div>
          
          {/* Image upload button */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            className="h-[80px] px-4 border-drplant-green/30 hover:bg-drplant-green/10 rounded-2xl"
          >
            <Image className="h-5 w-5" />
          </Button>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={(!message.trim() && !selectedImage) || isSending}
            className="h-[80px] px-6 bg-gradient-to-r from-drplant-green to-drplant-green-dark hover:from-drplant-green-dark hover:to-drplant-green text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        
        <div className="mt-3 text-center">
          <p className="text-sm text-gray-500">
            Premi <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd> per inviare, 
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs ml-1">Shift+Enter</kbd> per andare a capo
          </p>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
