
import { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import { Message } from './types';
import { MessageCircle, Sparkles } from 'lucide-react';

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

  // Debug log per messaggi
  useEffect(() => {
    console.log('📋 MessageList - Messaggi ricevuti:', {
      count: messages.length,
      messages: messages
    });
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
              <div className="text-sm text-gray-500 text-center mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <strong>🔍 Debug:</strong> Nessun messaggio ancora. Inizia la conversazione!
              </div>
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
          <>
            <div className="text-xs text-gray-400 text-center mb-4 p-2 bg-blue-50 rounded border">
              <strong>🔍 Debug:</strong> Mostrando {messages.length} messaggi
            </div>
            {messages.map(message => {
              console.log('🎨 Rendering messaggio:', message);
              return (
                <ChatMessage 
                  key={message.id}
                  message={message}
                  isExpertView={isExpertView}
                />
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default MessageList;
