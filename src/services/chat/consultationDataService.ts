
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export class ConsultationDataService {
  /**
   * Invia i dati iniziali di consultazione usando l'edge function
   */
  static async sendInitialConsultationData(
    conversationId: string,
    plantData: any,
    userData: any,
    useAI: boolean = false
  ): Promise<boolean> {
    try {
      console.log('📤 Sending consultation data via edge function...');
      
      // Ottieni la sessione per autorizzare l'edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ No valid session');
        return false;
      }

      // Chiama l'edge function
      const { data, error } = await supabase.functions.invoke('send-consultation-data', {
        body: {
          conversationId,
          plantData,
          userData,
          useAI
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('❌ Error calling send-consultation-data:', error);
        throw error;
      }

      if (!data?.success) {
        console.error('❌ Edge function returned error:', data);
        throw new Error(data?.error || 'Unknown error from edge function');
      }

      console.log('✅ Consultation data sent successfully');
      return true;

    } catch (error) {
      console.error('❌ Error in sendInitialConsultationData:', error);
      return false;
    }
  }

  /**
   * Verifica se i dati di consultazione sono già stati inviati
   */
  static async isConsultationDataSent(conversationId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .or('metadata->>autoSent.eq.true,metadata->>messageType.eq.consultation_data')
        .limit(1);

      if (error) {
        console.error('❌ Error checking consultation data:', error);
        return false;
      }

      return (data && data.length > 0) || false;

    } catch (error) {
      console.error('❌ Error in isConsultationDataSent:', error);
      return false;
    }
  }

  /**
   * Marca i dati come inviati (per compatibilità)
   */
  static async markConsultationDataSent(conversationId: string): Promise<void> {
    console.log('📝 Consultation data marked as sent for:', conversationId);
  }
}
