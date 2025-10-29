
import { supabase } from '@/integrations/supabase/client';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { DatabaseConversation } from './types';

export class ConversationService {
  static async findOrCreateConversation(
    userId: string, 
    conversationType: string = 'standard'
  ): Promise<DatabaseConversation | null> {
    try {
      console.log('🔍 ConversationService: Ricerca conversazione per utente:', userId, 'tipo:', conversationType);

      // Ricerca conversazione esistente per questo utente CON LO STESSO TIPO
      // Se esiste una conversazione finita, la riattiviamo invece di crearne una nuova
      const { data: existing, error: findError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('expert_id', MARCO_NIGRO_ID)
        .eq('conversation_type', conversationType)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (findError) {
        console.error('❌ ConversationService: Errore ricerca conversazione', findError);
        // Continua con la creazione invece di fallire
      }

      if (existing) {
        console.log('✅ ConversationService: Conversazione esistente trovata:', existing.id);
        
        // Se la conversazione è finita, riattiviamola
        if (existing.status === 'finished') {
          console.log('🔄 ConversationService: Riattivazione conversazione finita...');
          const { data: reactivated, error: updateError } = await supabase
            .from('conversations')
            .update({ 
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select()
            .single();
            
          if (updateError) {
            console.error('❌ ConversationService: Errore riattivazione conversazione', updateError);
            return existing; // Ritorna comunque la conversazione originale
          }
          
          console.log('✅ ConversationService: Conversazione riattivata');
          return reactivated;
        }
        
        return existing;
      }

      // Creazione nuova conversazione con fallback
      console.log('🆕 ConversationService: Creazione nuova conversazione tipo:', conversationType);
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          expert_id: MARCO_NIGRO_ID,
          title: conversationType === 'professional_quote' 
            ? 'Preventivo Professionale - Marco Nigro' 
            : 'Consulenza con Marco Nigro',
          status: 'active',
          conversation_type: conversationType
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ ConversationService: Errore creazione conversazione', createError);
        return null;
      }

      console.log('✅ ConversationService: Nuova conversazione creata:', newConversation.id);
      return newConversation;
    } catch (error: any) {
      console.error('❌ ConversationService: Errore in findOrCreateConversation:', error);
      return null;
    }
  }

  static async getConversation(conversationId: string): Promise<DatabaseConversation | null> {
    try {
      console.log('🔍 ConversationService: Caricamento conversazione:', conversationId);
      
      // Use edge function for better handling of archived/finished conversations
      const { data, error } = await supabase.functions.invoke('get-conversation', {
        body: { conversationId }
      });

      if (error) {
        console.error('❌ ConversationService: Errore edge function:', error);
        
        // Fallback to direct database query
        console.log('🔄 ConversationService: Fallback query diretta...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .maybeSingle();

        if (fallbackError) {
          console.error('❌ ConversationService: Errore fallback query:', fallbackError);
          return null;
        }

        return fallbackData;
      }

      if (!data || !data.conversation) {
        console.warn('⚠️ ConversationService: Conversazione non trovata:', conversationId);
        return null;
      }

      console.log('✅ ConversationService: Conversazione caricata via edge function:', data.conversation.id);
      return data.conversation;
    } catch (error: any) {
      console.error('❌ ConversationService: Errore getConversation:', error);
      return null;
    }
  }

  static async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      console.log('🗑️ ConversationService: Eliminazione conversazione:', conversationId);
      
      // Eliminazione diretta dei messaggi
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      if (messagesError) {
        console.error('❌ ConversationService: Errore eliminazione messaggi', messagesError);
        // Continua comunque con l'eliminazione della conversazione
      }

      // Eliminazione della conversazione
      const { error: conversationError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (conversationError) {
        console.error('❌ ConversationService: Errore eliminazione conversazione', conversationError);
        return false;
      }

      console.log('✅ ConversationService: Conversazione eliminata con successo');
      return true;

    } catch (error: any) {
      console.error('❌ ConversationService: Errore deleteConversation:', error);
      return false;
    }
  }

  static async refreshConversations(expertId: string = MARCO_NIGRO_ID): Promise<any[]> {
    try {
      console.log('🔄 ConversationService: Aggiornamento conversazioni...');
      
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          user_id,
          expert_id,
          last_message_text,
          last_message_at,
          status,
          created_at,
          updated_at,
          title
        `)
        .eq('expert_id', expertId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ ConversationService: Errore aggiornamento conversazioni', error);
        return [];
      }

      console.log('✅ ConversationService: Conversazioni aggiornate:', conversations?.length || 0);
      return conversations || [];
    } catch (error) {
      console.error('❌ ConversationService: Errore refreshConversations:', error);
      return [];
    }
  }
}
