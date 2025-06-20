
import { supabase } from '@/integrations/supabase/client';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { toast } from 'sonner';

export class ConversationService {
  /**
   * Trova o crea una conversazione tra utente e esperto
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

      // Prima cerca conversazione esistente
      const { data: existingConversation, error: findError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('expert_id', expertId)
        .eq('status', 'active')
        .maybeSingle();

      if (findError) {
        console.error('❌ ConversationService: Errore ricerca conversazione', findError);
        throw new Error(`Errore ricerca conversazione: ${findError.message}`);
      }

      if (existingConversation) {
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
      toast.error(error.message || 'Errore nel servizio conversazione');
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
   * Elimina una conversazione - VERSIONE FORZATA
   */
  static async deleteConversation(conversationId: string) {
    try {
      console.log('🗑️ ConversationService: FORZO eliminazione conversazione', conversationId);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sessione scaduta');
      }

      // PRIMA: Elimina direttamente dal database senza aspettare la funzione edge
      console.log('🔥 ConversationService: Eliminazione DIRETTA dal database');
      
      // Elimina prima i messaggi
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      if (messagesError) {
        console.error('❌ ConversationService: Errore eliminazione messaggi diretta', messagesError);
      } else {
        console.log('✅ ConversationService: Messaggi eliminati direttamente');
      }

      // Poi elimina la conversazione
      const { error: conversationError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (conversationError) {
        console.error('❌ ConversationService: Errore eliminazione conversazione diretta', conversationError);
        
        // Se fallisce l'eliminazione diretta, prova con la funzione edge
        console.log('🔄 ConversationService: Fallback alla funzione edge');
        const { error: edgeError } = await supabase.functions.invoke('delete-conversation', {
          body: { conversationId },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (edgeError) {
          console.error('❌ ConversationService: Errore anche con funzione edge', edgeError);
          throw new Error(edgeError.message || 'Errore eliminazione conversazione');
        }
      }

      console.log('✅ ConversationService: Conversazione ELIMINATA FORZATAMENTE');
      
      // Forza il refresh del browser per assicurare che la UI si aggiorni
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      return true;

    } catch (error: any) {
      console.error('❌ ConversationService: Errore eliminazione FORZATA', error);
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

  /**
   * Forza refresh completo delle conversazioni
   */
  static async forceRefreshConversations() {
    try {
      console.log('🔄 ConversationService: REFRESH FORZATO conversazioni');
      
      // Invalida cache del browser
      const timestamp = Date.now();
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('expert_id', MARCO_NIGRO_ID)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ ConversationService: Errore refresh forzato', error);
        return [];
      }

      console.log('✅ ConversationService: Refresh forzato completato', data?.length || 0);
      return data || [];

    } catch (error: any) {
      console.error('❌ ConversationService: Errore refresh forzato', error);
      return [];
    }
  }
}
