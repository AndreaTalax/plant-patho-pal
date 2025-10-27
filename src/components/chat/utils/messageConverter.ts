import { Message, DatabaseMessage } from '../types';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';

export const convertToUIMessage = (dbMessage: DatabaseMessage): Message => {
  console.log('🔄 Conversione messaggio DB a UI:', {
    id: dbMessage.id,
    hasImageUrl: !!dbMessage.image_url,
    hasPdfPath: !!dbMessage.pdf_path,
    imageUrl: dbMessage.image_url?.substring(0, 100),
    pdfPath: dbMessage.pdf_path?.substring(0, 100)
  });
  
  // Use content field as primary, fallback to text for backward compatibility
  const messageText = dbMessage.content || dbMessage.text || '';
  
  // Verifica se image_url contiene un PDF
  let imageUrl = dbMessage.image_url;
  let pdfPath = dbMessage.pdf_path;
  
  if (imageUrl && (imageUrl.toLowerCase().includes('.pdf') || imageUrl.toLowerCase().includes('/pdfs/'))) {
    console.log('📄 PDF rilevato in image_url, spostamento a pdf_path');
    pdfPath = imageUrl;
    imageUrl = undefined;
  }
  
  if (!messageText && !imageUrl && !pdfPath) {
    console.warn('⚠️ Messaggio senza contenuto:', dbMessage.id);
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
  
  console.log('✅ Messaggio convertito:', {
    id: converted.id,
    hasImageUrl: !!converted.image_url,
    hasPdfPath: !!converted.pdf_path,
    sender: converted.sender
  });
  
  return converted;
};
