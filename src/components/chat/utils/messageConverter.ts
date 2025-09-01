
import { Message, DatabaseMessage } from '../types';
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
