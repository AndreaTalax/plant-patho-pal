
import { Message, DatabaseMessage } from '../types';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';

export const convertToUIMessage = (dbMessage: DatabaseMessage): Message => {
  console.log('🔄 Conversione messaggio DB a UI:', dbMessage);
  
  // Use content field as primary, fallback to text for backward compatibility
  const messageText = dbMessage.content || dbMessage.text || '';
  
  // Debug logging per messaggi PDF
  if (dbMessage.content?.includes('Preventivo Professionale') || dbMessage.text?.includes('Preventivo Professionale')) {
    console.log('🔍 PDF Message Conversion:', {
      id: dbMessage.id,
      content: dbMessage.content,
      text: dbMessage.text,
      finalText: messageText,
      contentLength: dbMessage.content?.length,
      textLength: dbMessage.text?.length,
      hasMarkdownInContent: dbMessage.content?.includes('[') && dbMessage.content?.includes(']'),
      hasMarkdownInText: dbMessage.text?.includes('[') && dbMessage.text?.includes(']')
    });
  }
  
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
    pdf_path: dbMessage.pdf_path || undefined,
    products: dbMessage.products || undefined
  };
  
  console.log('✅ Messaggio convertito:', converted);
  return converted;
};
