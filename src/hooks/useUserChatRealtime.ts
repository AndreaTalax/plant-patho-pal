
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DatabaseMessage } from '@/services/chat/types';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { ConversationService } from '@/services/chat/conversationService';
import { MessageService } from '@/services/chat/messageService';

// Funzioni di debug per diagnosticare problemi della chat
const validateChatParameters = (userId: string, expertId: string) => {
  const errors: string[] = [];
  
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    errors.push('userId non valido o mancante');
  }
  
  if (!expertId || typeof expertId !== 'string' || expertId.trim() === '') {
    errors.push('expertId non valido o mancante');
  }
  
  // Controlla se gli ID hanno un formato valido (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (userId && !uuidRegex.test(userId.trim())) {
    errors.push('userId non è un UUID valido');
  }
  
  if (expertId && !uuidRegex.test(expertId.trim())) {
    errors.push('expertId non è un UUID valido');
  }
  
  return errors;
};

const logSupabaseOperation = (operation: string, params: any) => {
  console.group(`🔍 Debug Operazione Supabase: ${operation}`);
  console.log('📦 Parametri:', JSON.stringify(params, null, 2));
  console.log('🕐 Timestamp:', new Date().toISOString());
  console.log('🔗 Supabase Project:', 'otdmqmpxukifoxjlgzmq');
  console.groupEnd();
};

const analyzeSupabaseError = (error: any, operation: string) => {
  console.group(`❌ Analisi Errore Supabase: ${operation}`);
  console.log('📊 Error code:', error?.code);
  console.log('📝 Error message:', error?.message);
  console.log('🔍 Error details:', error?.details);
  console.log('💡 Error hint:', error?.hint);
  console.log('🔗 Error context:', error);
  console.groupEnd();
};

const testSupabaseConnection = async () => {
  try {
    console.log('🧪 Test connessione Supabase...');
    
    const { data, error } = await supabase
      .from('conversations')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('⚠️ Errore test connessione:', error);
      analyzeSupabaseError(error, 'connection-test');
    } else {
      console.log('✅ Supabase connesso correttamente');
    }
    
  } catch (error) {
    console.error('❌ Supabase non raggiungibile:', error);
  }
};

export const useUserChatRealtime = (userId: string) => {
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<DatabaseMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const { user } = useAuth();

  // Inizializzazione chat con fallback robusto e debug
  const startChatWithExpert = useCallback(async () => {
    if (isInitializing) {
      console.log('🔄 useUserChatRealtime: Inizializzazione già in corso');
      return;
    }

    try {
      setIsInitializing(true);
      setInitializationError(null);
      
      // Validazione parametri con debug
      const validationErrors = validateChatParameters(userId, MARCO_NIGRO_ID);
      if (validationErrors.length > 0) {
        const errorMessage = `Errori di validazione: ${validationErrors.join(', ')}`;
        console.error('❌ Validazione fallita:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('🚀 useUserChatRealtime: Avvio chat con esperto per:', userId);
      logSupabaseOperation('findOrCreateConversation', { userId, expertId: MARCO_NIGRO_ID });

      // Test connessione Supabase prima di procedere
      await testSupabaseConnection();

      // Trova o crea conversazione usando il servizio diretto
      const conversation = await ConversationService.findOrCreateConversation(userId);
      
      if (!conversation) {
        throw new Error('Impossibile creare o trovare la conversazione');
      }

      setActiveChat(conversation);
      setCurrentConversationId(conversation.id);

      // Carica messaggi esistenti con fallback e debug
      try {
        logSupabaseOperation('loadMessages', { conversationId: conversation.id });
        const existingMessages = await MessageService.loadMessages(conversation.id);
        
        console.log('🔍 Messages loaded from database:', {
          count: existingMessages?.length || 0,
          messages: existingMessages?.map(m => ({
            id: m.id,
            sender_id: m.sender_id,
            text: (m.content || m.text || '').substring(0, 50),
            sent_at: m.sent_at
          })) || []
        });
        
        setMessages(existingMessages || []);
        console.log('✅ useUserChatRealtime: Messaggi caricati:', existingMessages?.length || 0);
      } catch (messageError) {
        console.warn('⚠️ useUserChatRealtime: Impossibile caricare messaggi esistenti:', messageError);
        analyzeSupabaseError(messageError, 'loadMessages');
        setMessages([]); // Fallback a lista vuota
      }

      // Configura sottoscrizione real-time con fallback
      try {
        const channel = supabase
          .channel(`conversation_${conversation.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${conversation.id}`
            },
            (payload) => {
              console.log('📨 useUserChatRealtime: Nuovo messaggio ricevuto:', payload.new);
              const newMessage = payload.new as DatabaseMessage;
              
              console.log('🔍 New message details:', {
                id: newMessage.id,
                sender_id: newMessage.sender_id,
                userId: userId,
                marcoId: MARCO_NIGRO_ID,
                isFromUser: newMessage.sender_id === userId,
                isFromExpert: newMessage.sender_id === MARCO_NIGRO_ID
              });
              
              setMessages(prev => {
                // Evita duplicati
                const exists = prev.some(msg => msg.id === newMessage.id);
                if (exists) {
                  console.log('⚠️ useUserChatRealtime: Messaggio già esistente, ignorato');
                  return prev;
                }
                
                const newMessages = [...prev, newMessage];
                console.log('✅ useUserChatRealtime: Messaggio aggiunto, totale:', newMessages.length);
                return newMessages;
              });
            }
          )
          .subscribe((status) => {
            console.log('🔗 useUserChatRealtime: Stato sottoscrizione:', status);
            setIsConnected(status === 'SUBSCRIBED');
          });

        // Cleanup function
        return () => {
          try {
            channel.unsubscribe();
          } catch (error) {
            console.warn('⚠️ useUserChatRealtime: Errore durante cleanup sottoscrizione:', error);
          }
        };
      } catch (realtimeError) {
        console.warn('⚠️ useUserChatRealtime: Errore configurazione real-time:', realtimeError);
        setIsConnected(false); // Funziona comunque senza real-time
      }

      console.log('✅ useUserChatRealtime: Inizializzazione completata con successo');

    } catch (error) {
      console.error('❌ useUserChatRealtime: Errore inizializzazione:', error);
      setInitializationError(error instanceof Error ? error.message : 'Errore sconosciuto');
    } finally {
      setIsInitializing(false);
    }
  }, [userId, isInitializing]);

  // Gestore invio messaggi con fallback
  const handleSendMessage = useCallback(async (
    text: string, 
    imageUrl?: string
  ) => {
    if (!activeChat || !currentConversationId || isSending) {
      console.log('⚠️ useUserChatRealtime: Condizioni invio non soddisfatte');
      return;
    }

    if (!text?.trim() && !imageUrl) {
      toast.error('Il messaggio non può essere vuoto');
      return;
    }

    setIsSending(true);
    
    try {
      console.log('📤 useUserChatRealtime: Invio messaggio:', { 
        text: text?.slice(0, 50), 
        hasImage: !!imageUrl,
        userId: userId,
        conversationId: currentConversationId
      });

      const success = await MessageService.sendMessage(
        currentConversationId,
        userId,
        text || '📸 Immagine allegata',
        imageUrl
      );

      if (!success) {
        throw new Error('Invio fallito');
      }

      console.log('✅ useUserChatRealtime: Messaggio inviato con successo');
      
      // Ricarica messaggi dopo l'invio (fallback se real-time non funziona)
      setTimeout(async () => {
        try {
          const refreshedMessages = await MessageService.loadMessages(currentConversationId);
          console.log('🔄 useUserChatRealtime: Messaggi ricaricati dopo invio:', refreshedMessages?.length || 0);
          setMessages(refreshedMessages || []);
        } catch (error) {
          console.warn('⚠️ useUserChatRealtime: Impossibile ricaricare messaggi:', error);
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ useUserChatRealtime: Errore invio messaggio:', error);
      toast.error('Errore nell\'invio del messaggio');
    } finally {
      setIsSending(false);
    }
  }, [activeChat, currentConversationId, userId, isSending]);

  // Reset stato chat
  const resetChat = useCallback(() => {
    console.log('🔄 useUserChatRealtime: Reset stato chat');
    setActiveChat(null);
    setMessages([]);
    setCurrentConversationId(null);
    setIsConnected(false);
    setInitializationError(null);
    setIsInitializing(false);
  }, []);

  return {
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
  };
};
