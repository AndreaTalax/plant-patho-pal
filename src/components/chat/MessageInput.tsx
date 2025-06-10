
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { sendMessage } from './chatService';
import { toast } from 'sonner';

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
 * Handles message input and sending logic within a chat interface.
 * @example
 * MessageInput({
 *   conversationId: '123',
 *   senderId: '456',
 *   recipientId: '789',
 *   onMessageSent: () => console.log('Message sent callback'),
 *   onSendMessage: async (message) => { console.log('Message:', message) },
 *   isSending: false,
 *   isMasterAccount: false
 * });
 * @param {string} conversationId - Unique identifier for the conversation.
 * @param {string} senderId - ID of the user sending the message.
 * @param {string} recipientId - ID of the user receiving the message.
 * @param {function} onMessageSent - Callback function triggered after a successful message send.
 * @param {function} onSendMessage - Optional function for custom message handling logic.
 * @param {boolean} [isSending=false] - External sending state indicator.
 * @param {boolean} [isMasterAccount=false] - Indicates if the current user is a master account.
 * @returns {JSX.Element} Returns the rendered message input component.
 * @description
 *   - Uses a controlled component approach to handle message input state.
 *   - Integrates both custom and legacy message sending approaches to support various use cases.
 *   - Employs a mechanism to prevent message sends when inputs are invalid or during ongoing sends.
 *   - Provides key-press handling to allow interaction using keyboard for improved UX.
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
  
  const isSending = externalIsSending || internalIsSending;

  /**
   * Sends a message using either a provided hook or a legacy service.
   * @example
   * sync()
   * undefined
   * @param {string} message - The message content to be sent.
   * @param {boolean} isSending - Flag indicating if a message is currently being sent.
   * @param {Function} onSendMessage - Optional function to send a message for hooks-based components.
   * @param {Function} setMessage - Function to reset the message input field after sending.
   * @returns {void} No return value.
   * @description
   *   - Requires `conversationId`, `senderId`, and `recipientId` for the legacy ChatService approach.
   *   - Utilizes `setInternalIsSending` to manage UI state during the message sending process.
   *   - Uses toast notifications for error handling.
   *   - Executes `onMessageSent` callback after a message is successfully sent.
   */
  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    // If onSendMessage is provided, use it (for hooks-based components)
    if (onSendMessage) {
      await onSendMessage(message.trim());
      setMessage('');
      return;
    }

    // Otherwise use the legacy ChatService approach
    if (!conversationId || !senderId || !recipientId) {
      toast.error('Errore: parametri mancanti');
      return;
    }

    console.log('🔄 Sending message...', { conversationId, senderId, recipientId, text: message });
    
    setInternalIsSending(true);
    
    try {
      const result = await sendMessage(
        conversationId,
        senderId,
        recipientId,
        message.trim()
      );

      if (result) {
        setMessage('');
        onMessageSent?.();
        console.log('✅ Message sent successfully');
      } else {
        console.error('❌ Failed to send message');
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast.error('Errore nell\'invio del messaggio');
    } finally {
      setInternalIsSending(false);
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
