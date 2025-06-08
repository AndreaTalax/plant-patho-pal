
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { Message } from '@/components/chat/types';
import { DatabaseMessage } from './types';

export const convertToUIMessage = (dbMessage: DatabaseMessage): Message => {
  return {
    id: dbMessage.id,
    text: dbMessage.text,
    sender: dbMessage.sender_id === MARCO_NIGRO_ID ? 'expert' : 'user',
    time: new Date(dbMessage.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    products: Array.isArray(dbMessage.products) ? dbMessage.products : undefined
  };
};
