
import { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import { Message } from './types';

interface MessageListProps {
  messages: Message[];
  isExpertView?: boolean;
}

const MessageList = ({ messages, isExpertView = false }: MessageListProps) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3" ref={messagesContainerRef}>
      {messages.map(message => (
        <ChatMessage 
          key={message.id}
          message={message}
          isExpertView={isExpertView}
        />
      ))}
    </div>
  );
};

export default MessageList;
