import { Message, DatabaseMessage } from '../types';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';

export const convertToUIMessage = (dbMessage: DatabaseMessage): Message => {
  // Use content field as primary, fallback to text for backward compatibility
  const messageText = dbMessage.content || dbMessage.text || '';
  
  // Verifica se image_url contiene un PDF
  let imageUrl = dbMessage.image_url;
  let pdfPath = dbMessage.pdf_path;
  
  if (imageUrl && (imageUrl.toLowerCase().includes('.pdf') || imageUrl.toLowerCase().includes('/pdfs/'))) {
    pdfPath = imageUrl;
    imageUrl = undefined;
  }
  
  const converted: Message = {
    id: dbMessage.id,
    text: messageText,
    sender: dbMessage.sender_id === MARCO_NIGRO_ID ? 'expert' : 'user',
    time: new Date(dbMessage.sent_at).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    image_url: imageUrl || undefined,
    pdf_path: pdfPath || undefined,
    products: dbMessage.products || undefined
  };
  
  return converted;
};
