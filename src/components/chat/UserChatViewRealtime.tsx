import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserChatRealtime } from '@/hooks/useUserChatRealtime';
import MessageList from './MessageList';
import { ChatInitializer } from './user/ChatInitializer';
import { ComprehensiveDataDisplay } from './user/ComprehensiveDataDisplay';
import { MessageBoard } from './user/MessageBoard';
import ChatHeader from './user/ChatHeader';
import { DatabaseMessage } from '@/services/chat/types';
import { Message } from './types';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { useTheme } from '@/context/ThemeContext';

interface UserChatViewRealtimeProps {
  userId: string;
  conversationId?: string;
  onBackToList?: () => void;
  isProfessionalChat?: boolean;
}

export const UserChatViewRealtime: React.FC<UserChatViewRealtimeProps> = ({ 
  userId, 
  conversationId, 
  onBackToList,
  isProfessionalChat = false 
}) => {
  const navigate = useNavigate();
  const { language } = useTheme();
  const [autoDataSent, setAutoDataSent] = useState(false);
  const [showComprehensiveData, setShowComprehensiveData] = useState(false);
  
  const {
    activeChat,
    messages,
    isSending,
    isConnected,
    handleSendMessage,
    startChatWithExpert,
    currentConversationId,
    initializationError,
    resetChat,
    isInitializing
  } = useUserChatRealtime(userId);

  // Auto-avvio chat quando il componente si monta
  useEffect(() => {
    if (!activeChat && !initializationError && !isInitializing) {
      console.log('🚀 UserChatViewRealtime: Avvio automatico chat');
      startChatWithExpert();
    }
  }, [activeChat, startChatWithExpert, initializationError, isInitializing]);

  // Reset dati automatici quando cambia conversazione
  useEffect(() => {
    if (currentConversationId) {
      setAutoDataSent(false);
    }
  }, [currentConversationId]);

  // Mostra dati comprensivi quando vengono inviati
  useEffect(() => {
    if (autoDataSent) {
      setShowComprehensiveData(true);
    }
  }, [autoDataSent]);

  const formatMessagesForDisplay = (dbMessages: DatabaseMessage[]): Message[] => {
    console.log('🔄 Formatting messages for display:', dbMessages.length);
    
    return dbMessages.map((msg, index) => {
      // Determina il sender basandosi sugli ID
      let sender: 'user' | 'expert';
      if (msg.sender_id === userId) {
        sender = 'user';
      } else if (msg.sender_id === MARCO_NIGRO_ID) {
        sender = 'expert';
      } else {
        // Fallback per messaggi dove l'ID del sender non corrisponde
        sender = msg.sender_id === userId ? 'user' : 'expert';
      }
      
      const formattedMessage: Message = {
        id: msg.id,
        sender: sender,
        text: msg.content || msg.text || '',
        time: new Date(msg.sent_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit'
        }),
        image_url: msg.image_url || undefined
      };
      
      console.log(`🎨 Formatting message ${index + 1}/${dbMessages.length}:`, {
        id: formattedMessage.id,
        sender: formattedMessage.sender,
        text: formattedMessage.text.substring(0, 50),
        senderId: msg.sender_id,
        userId: userId,
        marcoId: MARCO_NIGRO_ID
      });
      
      return formattedMessage;
    });
  };

  // Gestione click pulsante indietro
  const handleBackClick = () => {
    if (onBackToList) {
      onBackToList();
    } else {
      const event = new CustomEvent('switchTab', { detail: 'diagnose' });
      window.dispatchEvent(event);
    }
  };

  // Gestione retry con reset completo
  const handleRetry = () => {
    console.log('🔄 UserChatViewRealtime: Tentativo di riconnessione');
    resetChat();
    setTimeout(() => {
      startChatWithExpert();
    }, 500);
  };

  // Log per debug dei messaggi formattati
  useEffect(() => {
    const formattedMessages = formatMessagesForDisplay(messages);
    console.log('📊 Messages debug info:', {
      totalMessages: messages.length,
      formattedMessages: formattedMessages.length,
      userMessages: formattedMessages.filter(m => m.sender === 'user').length,
      expertMessages: formattedMessages.filter(m => m.sender === 'expert').length,
      userId: userId,
      marcoId: MARCO_NIGRO_ID
    });
  }, [messages, userId]);

  // Stato di errore con opzioni di recupero
  if (initializationError) {
    return (
      <div className="flex flex-col h-full">
        <ChatHeader 
          onBackClick={handleBackClick}
          isConnected={isConnected}
        />

        <div className="flex-1 flex items-center justify-center p-4">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="mt-2">
              <p className="font-medium mb-2">Problema di connessione alla chat</p>
              <p className="text-sm mb-4">{initializationError}</p>
              <div className="space-y-2">
                <Button
                  onClick={handleRetry}
                  size="sm"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Riprova
                </Button>
                <Button
                  onClick={handleBackClick}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  Torna alla diagnosi
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Stato di caricamento
  if (isInitializing || !activeChat) {
    return (
      <div className="flex flex-col h-full">
        <ChatHeader 
          onBackClick={handleBackClick}
          isConnected={isConnected}
        />
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-drplant-green mx-auto mb-4"></div>
            <p className="text-gray-600">
              {isInitializing ? 'Inizializzazione chat...' : 'Connessione alla chat...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Inizializzatore dati automatico - Non per chat professionali */}
      {!isProfessionalChat && (
        <ChatInitializer
          activeChat={activeChat}
          currentConversationId={currentConversationId}
          autoDataSent={autoDataSent}
          setAutoDataSent={setAutoDataSent}
        />
      )}
      
      {/* Header con pulsante indietro */}
      <div className="flex-shrink-0">
        <ChatHeader 
          onBackClick={handleBackClick}
          isConnected={isConnected}
        />
      </div>

      {/* Messaggio informativo per chat professionali */}
      {isProfessionalChat && (
        <div className="flex-shrink-0 bg-blue-50 border-b border-blue-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">
                    {language === 'it' ? 'Preventivo Professionale' : 'Professional Quote'}
                  </h3>
                  <p className="text-sm text-blue-700">
                    {language === 'it' 
                      ? 'Questa è una chat dedicata alla tua richiesta di preventivo professionale. Il nostro team esaminerà la tua richiesta e ti risponderà con un\'offerta personalizzata entro 2-3 giorni lavorativi.'
                      : 'This is a chat dedicated to your professional quote request. Our team will review your request and respond with a personalized offer within 2-3 business days.'
                    }
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    {language === 'it'
                      ? 'Il PDF con i dettagli della tua richiesta è stato inviato e allegato qui sotto.'
                      : 'The PDF with the details of your request has been sent and attached below.'
                    }
                  </p>
                </div>
                
                {/* Pulsanti di navigazione */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/professional-quote')}
                    className="text-xs bg-white hover:bg-blue-100"
                  >
                    {language === 'it' ? '📝 Nuovo Preventivo' : '📝 New Quote'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/plan-subscription')}
                    className="text-xs bg-white hover:bg-blue-100"
                  >
                    {language === 'it' ? '💼 Vedi Abbonamenti' : '💼 View Plans'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visualizzazione dati quando necessario - Non per chat professionali */}
      {!isProfessionalChat && (
        <div className="flex-shrink-0">
          <ComprehensiveDataDisplay
            isVisible={showComprehensiveData}
            onToggle={() => setShowComprehensiveData(!showComprehensiveData)}
            isProfessionalChat={isProfessionalChat}
          />
        </div>
      )}

      {/* Area chat principale */}
      <div className="flex-1 overflow-hidden bg-white">
        <MessageList 
          messages={formatMessagesForDisplay(messages)}
          isTyping={isSending}
          typingUser="Esperto"
        />
      </div>

      {/* Input messaggi - Nascosto per chat professionali */}
      {!isProfessionalChat && (
        <div className="flex-shrink-0">
          <MessageBoard
            onSendMessage={handleSendMessage}
            isSending={isSending}
            isConnected={isConnected}
            disabled={!isConnected && !activeChat}
            conversationId={currentConversationId}
            senderId={userId}
            recipientId={MARCO_NIGRO_ID}
          />
        </div>
      )}

      {/* Nota per chat professionali */}
      {isProfessionalChat && (
        <div className="flex-shrink-0 bg-gray-100 border-t p-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm text-gray-600">
              💬 Riceverai una risposta via email e qui nella chat appena il nostro team 
              avrà preparato il preventivo personalizzato per te.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
