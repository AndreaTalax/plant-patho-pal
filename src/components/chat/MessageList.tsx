
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
    <div 
      className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4" 
      ref={messagesContainerRef}
    >
      <div className="max-w-4xl mx-auto space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-drplant-green/10 rounded-full mb-4">
              <svg className="w-8 h-8 text-drplant-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start the conversation</h3>
            <p className="text-gray-500">Send a message to begin chatting with the expert.</p>
          </div>
        ) : (
          messages.map(message => (
            <ChatMessage 
              key={message.id}
              message={message}
              isExpertView={isExpertView}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default MessageList;
