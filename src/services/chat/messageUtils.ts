
import { Message, DatabaseMessage } from '@/components/chat/types';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';

export const convertToUIMessage = (dbMessage: DatabaseMessage): Message => {
  console.log('🔄 Conversione messaggio DB a UI:', dbMessage);
  
  // Use content field as primary, fallback to text for backward compatibility
  const messageText = dbMessage.content || dbMessage.text || '';
  
  if (!messageText && !dbMessage.image_url) {
    console.warn('⚠️ Messaggio senza testo né immagine:', dbMessage);
  }
  
  const converted: Message = {
    id: dbMessage.id,
    text: messageText,
    sender: dbMessage.sender_id === MARCO_NIGRO_ID ? 'expert' : 'user',
    time: new Date(dbMessage.sent_at).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    image_url: dbMessage.image_url || undefined,
    products: dbMessage.products || undefined
  };
  
  console.log('✅ Messaggio convertito:', converted);
  return converted;
};

/**
 * Filtra e ordina i messaggi per evitare duplicati e garantire ordine cronologico
 */
export const processMessages = (messages: DatabaseMessage[]): Message[] => {
  console.log('📋 Processando messaggi dal database:', messages.length);
  
  // Rimuovi duplicati basandosi sull'ID
  const uniqueMessages = messages.filter((msg, index, array) => 
    array.findIndex(m => m.id === msg.id) === index
  );
  
  console.log('🔍 Messaggi unici dopo deduplicazione:', uniqueMessages.length);
  
  // Ordina per data di invio (più recenti alla fine)
  const sortedMessages = uniqueMessages.sort((a, b) => 
    new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
  );
  
  console.log('⏰ Messaggi ordinati per data');
  
  // Converti al formato UI
  const uiMessages = sortedMessages.map(msg => convertToUIMessage(msg));
  
  console.log('✅ Messaggi processati per UI:', uiMessages.length);
  return uiMessages;
};

/**
 * Pulisce la cache dei messaggi per forzare il reload
 */
export const clearMessageCache = (conversationId: string) => {
  console.log('🧹 Pulizia cache messaggi per conversazione:', conversationId);
  
  // Dispatcha un evento per notificare il clear della cache
  window.dispatchEvent(new CustomEvent('clearMessageCache', { 
    detail: { conversationId } 
  }));
};
