
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
      <div className="flex gap-1">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your response..."
          className="flex-1 min-h-[60px] text-sm"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!isSending) handleSend();
            }
          }}
          disabled={disabled}
        />
        <Button 
          size="sm"
          className="bg-drplant-green hover:bg-drplant-green-dark h-full"
          onClick={handleSend}
          disabled={isSending || disabled}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      <Input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder={t("typeYourMessage") || "Type your message..."}
        className="flex-1 h-9 text-sm"
        onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSend()}
        disabled={isSending || disabled}
      />
      <Button 
        size="sm"
        className="bg-drplant-blue hover:bg-drplant-blue-dark h-9 w-9 p-0"
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
  );
};

export default MessageInput;
