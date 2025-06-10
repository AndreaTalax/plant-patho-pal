
import { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import { Message } from './types';
import { MessageCircle, Sparkles } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  isExpertView?: boolean;
}

/**
 * Renders a list of messages in a chat interface, automatically scrolling to the bottom when new messages are added.
 * @example
 * MessageList({ messages: [{ id: 1, text: 'Hello' }, { id: 2, text: 'Hi' }], isExpertView: true })
 * // Returns: Rendered list of chat messages with auto-scroll functionality
 * @param {Array<Object>} messages - An array of message objects to be displayed. Each message object should have at least an 'id' property and other relevant message information.
 * @param {boolean} [isExpertView=false] - Determines if the chat messages are displayed in expert view style.
 * @returns {JSX.Element} Rendered list of chat messages.
 * @description
 *   - Uses a ref to keep track of the message container element for managing scroll behavior.
 *   - Applies different styles and animations when there are no messages to display, encouraging user interaction.
 *   - Supports dynamic rendering of chat messages based on the `isExpertView` flag.
 */
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
      className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50/50 via-white/30 to-drplant-green/5 p-6 space-y-4" 
      ref={messagesContainerRef}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="relative mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-drplant-green/20 to-drplant-blue/20 rounded-full mb-6 relative">
                <MessageCircle className="w-12 h-12 text-drplant-green" />
                <Sparkles className="w-6 h-6 text-drplant-blue absolute -top-2 -right-2 animate-pulse" />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-drplant-blue to-drplant-green bg-clip-text text-transparent">
                Inizia la conversazione
              </h3>
              <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
                Invia un messaggio per iniziare a chattare con il nostro esperto di piante
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 max-w-2xl mx-auto">
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-drplant-green/20 shadow-sm">
                  <div className="w-8 h-8 bg-drplant-blue/20 rounded-lg flex items-center justify-center mb-3">
                    <MessageCircle className="w-4 h-4 text-drplant-blue" />
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Consulenza rapida</h4>
                  <p className="text-sm text-gray-600">Risposte immediate dai nostri esperti</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-drplant-green/20 shadow-sm">
                  <div className="w-8 h-8 bg-drplant-green/20 rounded-lg flex items-center justify-center mb-3">
                    <Sparkles className="w-4 h-4 text-drplant-green" />
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Consigli personalizzati</h4>
                  <p className="text-sm text-gray-600">Soluzioni su misura per le tue piante</p>
                </div>
              </div>
            </div>
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
