
import { useState } from 'react';
import { Send } from 'lucide-react';
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
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your response..."
            className="flex-1 min-h-[60px] resize-none border-gray-300 focus:border-drplant-green focus:ring-drplant-green"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!isSending) handleSend();
              }
            }}
            disabled={disabled}
          />
          <Button 
            size="lg"
            className="bg-drplant-green hover:bg-drplant-green/90 text-white px-6 py-3 h-auto self-end rounded-lg shadow-sm"
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
  }

  return (
    <div className="p-4 bg-white border-t border-gray-200">
      <div className="flex gap-3 max-w-md mx-auto">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={t("typeYourMessage") || "Type your message..."}
          className="flex-1 border-gray-300 focus:border-drplant-blue focus:ring-drplant-blue rounded-lg"
          onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSend()}
          disabled={isSending || disabled}
        />
        <Button 
          size="default"
          className="bg-drplant-blue hover:bg-drplant-blue/90 text-white px-4 rounded-lg shadow-sm"
          onClick={handleSend}
          disabled={isSending || disabled}
        >
          {isSending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
