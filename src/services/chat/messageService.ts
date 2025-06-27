
import { supabase } from '@/integrations/supabase/client';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { toast } from 'sonner';
import { PushNotificationService } from '@/services/notifications/pushNotificationService';

export class MessageService {
  /**
   * Carica messaggi direttamente dal database (senza edge function)
   */
  static async loadMessages(conversationId: string) {
    try {
      console.log('📚 MessageService: Carico messaggi direttamente dal database', conversationId);

      if (!conversationId) {
        return [];
      }

      // Prima verifica se la conversazione esiste
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .maybeSingle();

      if (convError) {
        console.error('❌ MessageService: Errore verifica conversazione', convError);
        throw convError;
      }

      if (!conversation) {
        console.log('⚠️ MessageService: Conversazione non trovata', conversationId);
        throw new Error('CONVERSATION_NOT_FOUND');
      }

      // Caricamento diretto dal database senza edge function
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('❌ MessageService: Errore caricamento messaggi', error);
        throw error;
      }

      console.log('✅ MessageService: Messaggi caricati direttamente', messages?.length || 0);
      return messages || [];

    } catch (error: any) {
      console.error('❌ MessageService: Errore caricamento messaggi', error);
      
      // Gestione specifica per conversazione non trovata
      if (error.message === 'CONVERSATION_NOT_FOUND') {
        throw new Error('Conversazione non trovata o eliminata');
      }
      
      toast.error('Errore caricamento messaggi');
      throw error;
    }
  }

  /**
   * Invia un messaggio usando la edge function con notifiche push e email
   */
  static async sendMessage(
    conversationId: string, 
    senderId: string, 
    content: string,
    imageUrl?: string,
    products?: any[]
  ) {
    try {
      console.log('📤 MessageService: Invio messaggio con notifiche', {
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

      // Prima verifica se la conversazione esiste ancora
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id, status')
        .eq('id', conversationId)
        .maybeSingle();

      if (convError) {
        console.error('❌ MessageService: Errore verifica conversazione', convError);
        throw convError;
      }

      if (!conversation) {
        console.log('⚠️ MessageService: Conversazione non trovata', conversationId);
        throw new Error('Conversazione non trovata o eliminata');
      }

      // Determina il recipientId
      const recipientId = senderId === MARCO_NIGRO_ID ? null : MARCO_NIGRO_ID;

      // Prova prima con la edge function (che include notifiche)
      try {
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
          throw new Error('Edge function error');
        }

        console.log('✅ MessageService: Messaggio inviato via edge function con notifiche', data);

        // Se il messaggio è diretto all'esperto, invia anche notifica push locale
        if (recipientId === MARCO_NIGRO_ID && senderId !== MARCO_NIGRO_ID) {
          await this.sendExpertPushNotification(content, senderId);
        }

        return true;
      } catch (edgeFunctionError) {
        console.log('⚠️ Edge function non disponibile, uso inserimento diretto');
        
        // Fallback: inserimento diretto nel database
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
          console.error('❌ MessageService: Errore inserimento diretto', insertError);
          throw insertError;
        }

        console.log('✅ MessageService: Messaggio inviato via inserimento diretto');
        
        // Invia notifica push anche con fallback
        if (recipientId === MARCO_NIGRO_ID && senderId !== MARCO_NIGRO_ID) {
          await this.sendExpertPushNotification(content, senderId);
        }

        return true;
      }

    } catch (error: any) {
      console.error('❌ MessageService: Errore invio messaggio', error);
      
      // Gestione specifica per conversazione non trovata
      if (error.message?.includes('non trovata') || error.message?.includes('eliminata')) {
        toast.error('Conversazione non più disponibile');
      } else {
        toast.error(error.message || 'Errore invio messaggio');
      }
      
      return false;
    }
  }

  /**
   * Invia notifica push all'esperto
   */
  private static async sendExpertPushNotification(messageContent: string, senderId: string) {
    try {
      // Ottieni info del mittente
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', senderId)
        .single();

      const senderName = senderProfile 
        ? `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim() || senderProfile.email
        : 'Utente sconosciuto';

      // Invia notifica push locale per test
      await PushNotificationService.sendLocalNotification({
        title: `Dr.Plant - Nuovo messaggio da ${senderName}`,
        body: messageContent.slice(0, 100) + (messageContent.length > 100 ? '...' : ''),
        tag: 'expert-message',
        data: {
          senderId,
          senderName,
          type: 'new_message'
        }
      });

      console.log('✅ Notifica push inviata all\'esperto');
    } catch (error) {
      console.error('❌ Errore invio notifica push:', error);
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
