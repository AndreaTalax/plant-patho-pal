import React, { useState, useEffect } from 'react';
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
  const [autoDataSent, setAutoDataSent] = useState(false);
  const [showComprehensiveData, setShowComprehensiveData] = useState(false);
  
  console.log('🔵 UserChatViewRealtime render:', { 
    userId, 
    conversationId, 
    isProfessionalChat 
  });

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
  } = useUserChatRealtime(userId, conversationId);

  // Auto-avvio chat quando il componente si monta SOLO se non c'è conversationId
  useEffect(() => {
    if (!conversationId && !activeChat && !initializationError && !isInitializing) {
      console.log('🚀 UserChatViewRealtime: Avvio automatico chat');
      startChatWithExpert();
    }
  }, [conversationId, activeChat, startChatWithExpert, initializationError, isInitializing]);

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
        image_url: msg.image_url || undefined,
        pdf_path: msg.pdf_path || undefined,
        products: msg.products || undefined,
      };
      
      console.log(`🎨 Formatting message ${index + 1}/${dbMessages.length}:`, {
        id: formattedMessage.id,
        sender: formattedMessage.sender,
        hasPdf: !!formattedMessage.pdf_path,
        pdfPath: formattedMessage.pdf_path,
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
    const messagesWithPdf = formattedMessages.filter(m => m.pdf_path);
    console.log('📊 Messages debug info:', {
      totalMessages: messages.length,
      formattedMessages: formattedMessages.length,
      messagesWithPdf: messagesWithPdf.length,
      userMessages: formattedMessages.filter(m => m.sender === 'user').length,
      expertMessages: formattedMessages.filter(m => m.sender === 'expert').length,
      userId: userId,
      marcoId: MARCO_NIGRO_ID,
      isProfessionalChat: isProfessionalChat
    });
    
    if (messagesWithPdf.length > 0) {
      console.log('📄 Messaggi con PDF trovati:', messagesWithPdf.map(m => ({
        id: m.id,
        sender: m.sender,
        pdf_path: m.pdf_path
      })));
    }
  }, [messages, userId, isProfessionalChat]);

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
  if (isInitializing || (!activeChat && !conversationId)) {
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

  const formattedMessages = formatMessagesForDisplay(messages);

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
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Preventivo Professionale
                </h3>
                <p className="text-sm text-blue-700">
                  Questa è una chat dedicata alla tua richiesta di preventivo professionale. 
                  Il nostro team esaminerà la tua richiesta e ti risponderà con un'offerta personalizzata 
                  entro 2-3 giorni lavorativi.
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  📎 Il PDF con i dettagli della tua richiesta è stato inviato e dovresti vederlo nei messaggi qui sotto.
                </p>
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
          messages={formattedMessages}
          isTyping={isSending}
          typingUser="Esperto"
        />
      </div>

      {/* Input messaggi - Visibile anche per chat professionali per continuare la conversazione */}
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

      {/* Nota per chat professionali */}
      {isProfessionalChat && (
        <div className="flex-shrink-0 bg-blue-50 border-t border-blue-200 p-3">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xs text-blue-700">
              💬 Il nostro team risponderà alla tua richiesta via email e qui nella chat entro 2-3 giorni lavorativi
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
