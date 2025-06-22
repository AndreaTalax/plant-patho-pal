
import { supabase } from '@/integrations/supabase/client';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { toast } from 'sonner';

export class ConversationService {
  /**
   * Trova o crea una conversazione tra utente e esperto - VERSIONE SISTEMATA
   */
  static async findOrCreateConversation(userId: string, expertId: string = MARCO_NIGRO_ID) {
    try {
      console.log('🔍 ConversationService: Cerco conversazione esistente', { userId, expertId });
      
      // Verifica sessione
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('❌ ConversationService: Sessione non valida', sessionError);
        throw new Error('Sessione scaduta');
      }

      // SISTEMATO: Usa select().limit(1).single() invece di maybeSingle() per gestire multiple righe
      const { data: existingConversations, error: findError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('expert_id', expertId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (findError) {
        console.error('❌ ConversationService: Errore ricerca conversazione', findError);
        throw new Error(`Errore ricerca conversazione: ${findError.message}`);
      }

      if (existingConversations && existingConversations.length > 0) {
        const existingConversation = existingConversations[0];
        console.log('✅ ConversationService: Conversazione trovata', existingConversation.id);
        return existingConversation;
      }

      // Crea nuova conversazione
      console.log('🆕 ConversationService: Creo nuova conversazione');
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          expert_id: expertId,
          title: 'Consulenza esperto',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ ConversationService: Errore creazione conversazione', createError);
        throw new Error(`Errore creazione conversazione: ${createError.message}`);
      }

      console.log('✅ ConversationService: Conversazione creata', newConversation.id);
      return newConversation;

    } catch (error: any) {
      console.error('❌ ConversationService: Errore generale', error);
      // Non mostrare toast per evitare spam durante tentatvi automatici
      return null;
    }
  }

  /**
   * Carica conversazioni per l'esperto
   */
  static async loadExpertConversations(expertId: string = MARCO_NIGRO_ID) {
    try {
      console.log('📚 ConversationService: Carico conversazioni esperto', expertId);

      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          user_profile:profiles!conversations_user_id_fkey(
            id,
            first_name,
            last_name,
            email,
            is_online,
            last_seen_at
          )
        `)
        .eq('expert_id', expertId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ ConversationService: Errore caricamento conversazioni', error);
        throw error;
      }

      console.log('✅ ConversationService: Conversazioni caricate', conversations?.length || 0);
      return conversations || [];

    } catch (error: any) {
      console.error('❌ ConversationService: Errore caricamento conversazioni', error);
      toast.error('Errore nel caricamento delle conversazioni');
      return [];
    }
  }

  /**
   * Elimina una conversazione - VERSIONE MIGLIORATA
   */
  static async deleteConversation(conversationId: string) {
    try {
      console.log('🗑️ ConversationService: Elimino conversazione', conversationId);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sessione scaduta');
      }

      // Usa solo la funzione edge che è più affidabile
      console.log('🔄 ConversationService: Chiamo funzione delete-conversation');
      const { data, error } = await supabase.functions.invoke('delete-conversation', {
        body: { conversationId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('❌ ConversationService: Errore funzione edge', error);
        throw new Error(error.message || 'Errore eliminazione conversazione');
      }

      console.log('✅ ConversationService: Conversazione eliminata con successo', data);
      return true;

    } catch (error: any) {
      console.error('❌ ConversationService: Errore eliminazione', error);
      toast.error(error.message || 'Errore eliminazione conversazione');
      return false;
    }
  }

  /**
   * Aggiorna stato conversazione
   */
  static async updateConversationStatus(conversationId: string, status: string) {
    try {
      console.log('🔄 ConversationService: Aggiorno stato conversazione', { conversationId, status });

      const { error } = await supabase
        .from('conversations')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', conversationId);

      if (error) {
        console.error('❌ ConversationService: Errore aggiornamento stato', error);
        throw error;
      }

      console.log('✅ ConversationService: Stato aggiornato');
      return true;

    } catch (error: any) {
      console.error('❌ ConversationService: Errore aggiornamento stato', error);
      toast.error('Errore aggiornamento stato conversazione');
      return false;
    }
  }
}
