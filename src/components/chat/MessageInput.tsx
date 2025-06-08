
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { ChatService } from './chatService';
import { toast } from 'sonner';

interface MessageInputProps {
  conversationId: string;
  senderId: string;
  recipientId: string;
  onMessageSent: () => void;
}

const MessageInput = ({ conversationId, senderId, recipientId, onMessageSent }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    console.log('🔄 Sending message...', { conversationId, senderId, recipientId, text: message });
    
    setIsSending(true);
    
    try {
      const success = await ChatService.sendMessage(
        conversationId,
        senderId,
        recipientId,
        message.trim() // Using the text field correctly
      );

      if (success) {
        setMessage('');
        onMessageSent();
        console.log('✅ Message sent successfully');
      } else {
        console.error('❌ Failed to send message');
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
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

  return (
    <div className="border-t border-drplant-green/20 bg-white/80 backdrop-blur-sm p-6">
      <div className="max-w-4xl mx-auto">
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
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isSending}
            className="h-[80px] px-6 bg-gradient-to-r from-drplant-green to-drplant-green-dark hover:from-drplant-green-dark hover:to-drplant-green text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        
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
