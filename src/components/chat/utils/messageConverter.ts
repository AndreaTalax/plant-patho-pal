
import { Message, DatabaseMessage } from '../types';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';

export const convertToUIMessage = (dbMessage: DatabaseMessage): Message => {
  console.log('🔄 Conversione messaggio DB a UI:', dbMessage);
  
  // Use content field as primary, fallback to text for backward compatibility
  const messageText = dbMessage.content || dbMessage.text || '';
  
  if (!messageText && !dbMessage.image_url) {
    console.warn('⚠️ Messaggio senza testo né immagine:', dbMessage);
  }
  
  // Fix timestamp conversion to show current date and time correctly
  const messageTime = new Date(dbMessage.sent_at);
  const now = new Date();
  
  // Check if the message is from today
  const isToday = messageTime.toDateString() === now.toDateString();
  
  // Format time based on whether it's today or not
  let timeString;
  if (isToday) {
    // Show only time for today's messages
    timeString = messageTime.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else {
    // Show date and time for older messages
    timeString = messageTime.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  const converted: Message = {
    id: dbMessage.id,
    text: messageText,
    sender: dbMessage.sender_id === MARCO_NIGRO_ID ? 'expert' : 'user',
    time: timeString,
    image_url: dbMessage.image_url || undefined,
    products: dbMessage.products || undefined
  };
  
  console.log('✅ Messaggio convertito con timestamp corretto:', {
    id: converted.id,
    originalTimestamp: dbMessage.sent_at,
    convertedTime: timeString,
    isToday
  });
  
  return converted;
};
