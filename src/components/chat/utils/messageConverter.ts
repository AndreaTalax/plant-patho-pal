
import { Message, DatabaseMessage } from '../types';

export const convertToUIMessage = (dbMessage: DatabaseMessage): Message => {
  return {
    id: dbMessage.id,
    sender: dbMessage.sender_id === dbMessage.recipient_id ? 'expert' : 
           (dbMessage.sender_id ? 'user' : 'expert'),
    text: dbMessage.content || dbMessage.text || '',
    time: new Date(dbMessage.sent_at).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    image_url: dbMessage.image_url || undefined,
    products: dbMessage.products || undefined
  };
};
