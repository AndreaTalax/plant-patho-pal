
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  sent_at: string;
  image_url?: string;
}

export const useSimpleRealtimeChat = (userId: string, conversationId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId || null);

  // Trova o crea conversazione
  const initializeConversation = useCallback(async () => {
    if (currentConversationId) return currentConversationId;

    try {
      console.log('🔍 Cerco conversazione esistente...');
      
      // Cerca conversazione esistente
      const { data: existingConv, error: searchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('expert_id', MARCO_NIGRO_ID)
        .eq('status', 'active')
        .single();

      if (!searchError && existingConv) {
        console.log('✅ Conversazione trovata:', existingConv.id);
        setCurrentConversationId(existingConv.id);
        return existingConv.id;
      }

      // Crea nuova conversazione
      console.log('🆕 Creo nuova conversazione...');
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          expert_id: MARCO_NIGRO_ID,
          status: 'active',
          title: 'Chat con Esperto'
        })
        .select()
        .single();

      if (createError) throw createError;

      console.log('✅ Nuova conversazione creata:', newConv.id);
      setCurrentConversationId(newConv.id);
      return newConv.id;

    } catch (error) {
      console.error('❌ Errore inizializzazione conversazione:', error);
      throw error;
    }
  }, [userId, currentConversationId]);

  // Carica messaggi esistenti
  const loadMessages = useCallback(async (convId: string) => {
    try {
      console.log('📬 Caricamento messaggi per:', convId);
      
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('sent_at', { ascending: true });

      if (error) throw error;

      console.log('✅ Messaggi caricati:', messagesData?.length || 0);
      setMessages(messagesData || []);
      
    } catch (error) {
      console.error('❌ Errore caricamento messaggi:', error);
      setMessages([]);
    }
  }, []);

  // Setup real-time subscription
  const setupRealtime = useCallback((convId: string) => {
    console.log('🔄 Setup sottoscrizione real-time per:', convId);
    
    const channel = supabase
      .channel(`simple-chat-${convId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${convId}`
        },
        (payload) => {
          console.log('📨 Nuovo messaggio ricevuto:', payload.new);
          const newMessage = payload.new as Message;
          
          setMessages(prev => {
            // Evita duplicati
            if (prev.find(msg => msg.id === newMessage.id)) {
              console.log('⚠️ Messaggio duplicato ignorato');
              return prev;
            }
            
            console.log('✅ Messaggio aggiunto alla chat');
            return [...prev, newMessage];
          });

          // Mostra notifica se il messaggio è dall'esperto
          if (newMessage.sender_id === MARCO_NIGRO_ID && newMessage.sender_id !== userId) {
            toast.success('Nuovo messaggio dall\'esperto!', {
              description: newMessage.content?.slice(0, 50) + '...',
              duration: 4000
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('🔗 Stato sottoscrizione:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return channel;
  }, [userId]);

  // Inizializza chat al mount
  useEffect(() => {
    let channel: any = null;

    const initializeChat = async () => {
      try {
        const convId = await initializeConversation();
        await loadMessages(convId);
        channel = setupRealtime(convId);
      } catch (error) {
        console.error('❌ Errore inizializzazione chat:', error);
        toast.error('Errore connessione chat');
      }
    };

    initializeChat();

    return () => {
      if (channel) {
        console.log('🔌 Cleanup sottoscrizione');
        channel.unsubscribe();
        supabase.removeChannel(channel);
      }
    };
  }, [initializeConversation, loadMessages, setupRealtime]);

  // Invia messaggio
  const sendMessage = useCallback(async (text: string, imageUrl?: string) => {
    if (!currentConversationId || !text.trim() || isSending) return;

    setIsSending(true);
    
    try {
      console.log('📤 Invio messaggio:', text.slice(0, 50));
      
      const { data: newMessage, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: currentConversationId,
          sender_id: userId,
          recipient_id: MARCO_NIGRO_ID,
          content: text.trim(),
          image_url: imageUrl,
          sent_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Messaggio inviato:', newMessage.id);
      
      // Aggiorna ultimo messaggio della conversazione
      await supabase
        .from('conversations')
        .update({
          last_message_text: text.trim(),
          last_message_at: new Date().toISOString()
        })
        .eq('id', currentConversationId);

      return true;
      
    } catch (error) {
      console.error('❌ Errore invio messaggio:', error);
      toast.error('Errore nell\'invio del messaggio');
      return false;
    } finally {
      setIsSending(false);
    }
  }, [currentConversationId, userId, isSending]);

  return {
    messages,
    isConnected,
    isSending,
    conversationId: currentConversationId,
    sendMessage
  };
};
