
import { supabase } from '@/integrations/supabase/client';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { toast } from 'sonner';

export class MessageService {
  /**
   * Invia un messaggio
   */
  static async sendMessage(
    conversationId: string, 
    senderId: string, 
    content: string,
    imageUrl?: string,
    products?: any[]
  ) {
    try {
      console.log('📤 MessageService: Invio messaggio', {
        conversationId,
        senderId,
        contentLength: content?.length || 0,
        hasImage: !!imageUrl,
        hasProducts: !!products
      });

      // Verifica sessione
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('❌ MessageService: Sessione non valida', sessionError);
        throw new Error('Sessione scaduta');
      }

      if (!conversationId || !senderId || !content?.trim()) {
        throw new Error('Dati messaggio incompleti');
      }

      // Determina il recipientId
      const recipientId = senderId === MARCO_NIGRO_ID ? null : MARCO_NIGRO_ID;

      const { data, error } = await supabase.functions.invoke('send-message', {
        body: {
          conversationId,
          recipientId,
          text: content.trim(),
          imageUrl,
          products
        }
      });

      if (error) {
        console.error('❌ MessageService: Errore funzione send-message', error);
        throw new Error(error.message || 'Errore invio messaggio');
      }

      console.log('✅ MessageService: Messaggio inviato', data);
      return true;

    } catch (error: any) {
      console.error('❌ MessageService: Errore invio messaggio', error);
      toast.error(error.message || 'Errore invio messaggio');
      return false;
    }
  }

  /**
   * Carica messaggi di una conversazione
   */
  static async loadMessages(conversationId: string) {
    try {
      console.log('📚 MessageService: Carico messaggi', conversationId);

      if (!conversationId) {
        return [];
      }

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true });

      if (error) {
        console.error('❌ MessageService: Errore caricamento messaggi', error);
        throw error;
      }

      console.log('✅ MessageService: Messaggi caricati', messages?.length || 0);
      return messages || [];

    } catch (error: any) {
      console.error('❌ MessageService: Errore caricamento messaggi', error);
      toast.error('Errore caricamento messaggi');
      return [];
    }
  }

  /**
   * Segna messaggi come letti
   */
  static async markMessagesAsRead(conversationId: string, userId: string) {
    try {
      console.log('👁️ MessageService: Marco messaggi come letti', { conversationId, userId });

      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .is('read_at', null);

      if (error) {
        console.error('❌ MessageService: Errore marcatura messaggi letti', error);
        return false;
      }

      console.log('✅ MessageService: Messaggi marcati come letti');
      return true;

    } catch (error: any) {
      console.error('❌ MessageService: Errore marcatura messaggi', error);
      return false;
    }
  }
}
