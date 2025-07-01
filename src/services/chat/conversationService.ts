
import { supabase } from '@/integrations/supabase/client';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { DatabaseConversation } from './types';

export class ConversationService {
  static async findOrCreateConversation(userId: string): Promise<DatabaseConversation | null> {
    try {
      console.log('🔍 ConversationService: Ricerca conversazione per utente:', userId);

      // Ricerca conversazione esistente con fallback robusto
      const { data: existing, error: findError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('expert_id', MARCO_NIGRO_ID)
        .eq('status', 'active')
        .maybeSingle();

      if (findError) {
        console.error('❌ ConversationService: Errore ricerca conversazione', findError);
        // Continua con la creazione invece di fallire
      }

      if (existing) {
        console.log('✅ ConversationService: Conversazione esistente trovata:', existing.id);
        return existing;
      }

      // Creazione nuova conversazione con fallback
      console.log('🆕 ConversationService: Creazione nuova conversazione...');
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          expert_id: MARCO_NIGRO_ID,
          title: 'Consulenza con Marco Nigro',
          status: 'active'
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
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('❌ ConversationService: Errore caricamento conversazione', error);
        return null;
      }

      console.log('✅ ConversationService: Conversazione caricata:', data.id);
      return data;
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
