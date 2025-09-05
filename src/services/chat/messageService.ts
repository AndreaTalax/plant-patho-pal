
import { supabase } from '@/integrations/supabase/client';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { toast } from 'sonner';

export class MessageService {
  /**
   * Carica messaggi direttamente dal database con fallback robusto
   */
  static async loadMessages(conversationId: string) {
    try {
      console.log('📚 MessageService: Carico messaggi via edge function', conversationId);

      if (!conversationId) {
        console.log('📭 MessageService: ID conversazione mancante');
        return [];
      }

      // Prova prima con l'edge function (gestisce auth/RLS in modo affidabile)
      const { data, error } = await supabase.functions.invoke('get-conversation', {
        body: { conversationId }
      });

      if (error) {
        console.warn('⚠️ MessageService: Edge function fallita, fallback a query diretta', error);
      } else if (data?.messages) {
        console.log('✅ MessageService: Messaggi caricati via edge function', data.messages.length);
        return data.messages;
      }

      // Fallback: query diretta al DB
      const { data: messages, error: dbError } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, recipient_id, content, text, image_url, sent_at, read, metadata, products')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true })
        .limit(100);

      if (dbError) {
        console.error('❌ MessageService: Errore caricamento messaggi (fallback)', dbError);
        // Fallback: ritorna array vuoto invece di lanciare errore
        return [];
      }

      console.log('✅ MessageService: Messaggi caricati (fallback)', messages?.length || 0);
      return messages || [];

    } catch (error: any) {
      console.error('❌ MessageService: Errore caricamento messaggi', error);
      // Fallback silenzioso - non mostrare errore all'utente
      return [];
    }
  }

  /**
   * Invia un messaggio usando inserimento diretto con fallback
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

      // Verifica sessione con fallback
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('❌ MessageService: Sessione non valida', sessionError);
        toast.error('Sessione scaduta, ricarica la pagina');
        return false;
      }

      if (!conversationId || !senderId || !content?.trim()) {
        console.error('❌ MessageService: Dati messaggio incompleti');
        toast.error('Dati messaggio incompleti');
        return false;
      }

      // Verifica che la conversazione esista prima di inviare
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id, status, user_id, expert_id')
        .eq('id', conversationId)
        .maybeSingle();

      if (convError || !conversation) {
        console.error('❌ MessageService: Conversazione non trovata per invio', convError);
        toast.error('Conversazione non disponibile');
        return false;
      }

      // Verifica che la conversazione non sia archiviata
      if (conversation.status === 'finished') {
        console.error('❌ MessageService: Tentativo di inviare messaggio a conversazione archiviata');
        toast.error('Impossibile inviare messaggi a una conversazione archiviata');
        return false;
      }

      // Determina il recipientId basandosi sui partecipanti della conversazione
      let recipientId = null;
      if (senderId === conversation.user_id) {
        recipientId = conversation.expert_id;
      } else if (senderId === conversation.expert_id) {
        recipientId = conversation.user_id;
      } else {
        console.error('❌ MessageService: Sender non autorizzato per questa conversazione');
        toast.error('Non autorizzato a inviare messaggi in questa conversazione');
        return false;
      }

      // Inserimento diretto nel database
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          recipient_id: recipientId,
          content: content.trim(),
          text: content.trim(),
          image_url: imageUrl,
          sent_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('❌ MessageService: Errore inserimento', insertError);
        toast.error('Errore nell\'invio del messaggio');
        return false;
      }

      console.log('✅ MessageService: Messaggio inviato con successo');
      return true;

    } catch (error: any) {
      console.error('❌ MessageService: Errore invio messaggio', error);
      toast.error('Errore nell\'invio del messaggio');
      return false;
    }
  }

  /**
   * Invia un messaggio con immagine
   */
  static async sendImageMessage(
    conversationId: string,
    senderId: string,
    imageUrl: string
  ) {
    return this.sendMessage(conversationId, senderId, '📸 Immagine allegata', imageUrl);
  }

  /**
   * Segna messaggi come letti
   */
  static async markMessagesAsRead(conversationId: string, userId: string) {
    try {
      console.log('👁️ MessageService: Marco messaggi come letti', { conversationId, userId });

      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('read', false);

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
