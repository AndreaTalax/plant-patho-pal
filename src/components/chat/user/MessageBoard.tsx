
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  MicOff,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface MessageBoardProps {
  onSendMessage: (message: string) => Promise<void>;
  isSending: boolean;
  isConnected: boolean;
  disabled?: boolean;
}

export const MessageBoard: React.FC<MessageBoardProps> = ({
  onSendMessage,
  isSending,
  isConnected,
  disabled = false
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      toast.info('Registrazione vocale terminata');
    } else {
      setIsRecording(true);
      toast.info('Registrazione vocale avviata');
      // TODO: Implementa registrazione vocale
    }
  };

  const isDisabled = disabled || !isConnected || isSending;

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

        {/* Message Input Area - SEMPRE VISIBILE */}
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
                min-h-[60px] max-h-[200px] resize-none pr-12 w-full
                ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                border border-gray-300 rounded-lg p-3
              `}
            />
            
            {/* Quick Actions in Textarea */}
            <div className="absolute bottom-2 right-2 flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  toast.info('Emoji picker - Coming soon!');
                }}
                disabled={isDisabled}
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <Smile className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Action Bar - SEMPRE VISIBILE */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Attach File */}
              <Button
                variant="ghost"
                size="sm"
                disabled={isDisabled}
                onClick={() => {
                  toast.info('Allegati file - Coming soon!');
                }}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
              >
                <Paperclip className="h-4 w-4" />
                <span className="text-xs">Allega</span>
              </Button>

              {/* Voice Record */}
              <Button
                variant="ghost"
                size="sm"
                disabled={isDisabled}
                onClick={handleVoiceRecord}
                className={`
                  flex items-center space-x-1 hover:text-gray-800
                  ${isRecording ? 'text-red-600' : 'text-gray-600'}
                `}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                <span className="text-xs">
                  {isRecording ? 'Stop' : 'Audio'}
                </span>
              </Button>
            </div>

            {/* Send Button - SEMPRE PRESENTE E VISIBILE */}
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

          {/* Helper Text - SEMPRE VISIBILE */}
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
