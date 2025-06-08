
import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/context/ThemeContext';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  isSending: boolean;
  isMasterAccount?: boolean;
}

const MessageInput = ({
  onSendMessage,
  disabled = false,
  isSending,
  isMasterAccount = false
}: MessageInputProps) => {
  const { t } = useTheme();
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (newMessage.trim() === '' || isSending) return;
    
    onSendMessage(newMessage);
    setNewMessage('');
  };

  // Master account uses textarea, regular users use input
  if (isMasterAccount) {
    return (
      <div className="p-6 bg-gradient-to-r from-white/90 to-drplant-green/5 border-t border-drplant-green/20 backdrop-blur-sm">
        <div className="flex gap-4 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Scrivi la tua risposta esperta..."
              className="min-h-[80px] resize-none border-drplant-green/30 focus:border-drplant-green focus:ring-drplant-green/20 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!isSending) handleSend();
                }
              }}
              disabled={disabled}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              Premi Invio per inviare
            </div>
          </div>
          <Button 
            size="lg"
            className="bg-gradient-to-r from-drplant-green to-drplant-green-dark hover:from-drplant-green-dark hover:to-drplant-green text-white px-8 py-6 h-auto self-end rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={handleSend}
            disabled={isSending || disabled}
          >
            {isSending ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Send className="h-6 w-6 mr-2" />
                <span className="hidden sm:inline">Invia</span>
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-r from-white/90 to-drplant-blue/5 border-t border-drplant-blue/20 backdrop-blur-sm">
      <div className="flex gap-4 max-w-2xl mx-auto">
        <div className="flex-1 relative">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t("typeYourMessage") || "Scrivi il tuo messaggio..."}
            className="border-drplant-blue/30 focus:border-drplant-blue focus:ring-drplant-blue/20 rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm h-12"
            onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSend()}
            disabled={isSending || disabled}
          />
          <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-drplant-blue/40" />
        </div>
        <Button 
          size="default"
          className="bg-gradient-to-r from-drplant-blue to-drplant-blue-light hover:from-drplant-blue-dark hover:to-drplant-blue text-white px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 h-12"
          onClick={handleSend}
          disabled={isSending || disabled}
        >
          {isSending ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
