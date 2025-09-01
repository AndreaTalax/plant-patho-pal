
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSimpleRealtimeChat } from '@/hooks/useSimpleRealtimeChat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, MessageCircle, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';

interface SimpleRealtimeChatViewProps {
  onBack?: () => void;
}

export const SimpleRealtimeChatView: React.FC<SimpleRealtimeChatViewProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  
  const { messages, isConnected, isSending, sendMessage } = useSimpleRealtimeChat(user?.id || '');

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBack && (
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <MessageCircle className="h-5 w-5 text-drplant-green" />
              <CardTitle>Chat con Marco Nigro (Esperto)</CardTitle>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
                {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isConnected ? 'Connesso' : 'Disconnesso'}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Area messaggi */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nessun messaggio ancora</p>
                  <p className="text-sm">Inizia una conversazione con l'esperto!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isUser = message.sender_id === user?.id;
                  const isExpert = message.sender_id === MARCO_NIGRO_ID;
                  
                  return (
                    <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-lg p-3 ${
                        isUser 
                          ? 'bg-drplant-blue text-white' 
                          : isExpert
                          ? 'bg-drplant-green text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium opacity-75">
                            {isUser ? 'Tu' : isExpert ? 'Marco Nigro' : 'Utente'}
                          </span>
                          <span className="text-xs opacity-60">
                            {formatTime(message.sent_at)}
                          </span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        {message.image_url && (
                          <img 
                            src={message.image_url} 
                            alt="Allegato" 
                            className="mt-2 max-w-full h-auto rounded"
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Input messaggio */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Scrivi un messaggio..."
                className="flex-1 min-h-[60px] resize-none"
                disabled={!isConnected || isSending}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !isConnected || isSending}
                size="icon"
                className="self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {!isConnected && (
              <p className="text-sm text-red-600 mt-2">
                ⚠️ Connessione persa - ricarica la pagina se il problema persiste
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
