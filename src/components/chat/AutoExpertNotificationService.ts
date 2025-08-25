
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DiagnosisData {
  plantType: string;
  plantVariety?: string;
  symptoms: string;
  imageUrl: string;
  analysisResult: any;
  confidence: number;
  isHealthy: boolean;
}

export class AutoExpertNotificationService {
  /**
   * Sends an automatic plant diagnosis to an expert.
   */
  static async sendDiagnosisToExpert(userId: string, diagnosisData: DiagnosisData): Promise<boolean> {
    try {
      console.log('📨 Sending diagnosis automatically to expert...');
      console.log('👤 User ID:', userId);
      console.log('🌿 Diagnosis data:', diagnosisData);
      console.log('🖼️ Image URL ricevuto:', diagnosisData.imageUrl);

      // Get current user to include their info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated');
        toast.error('Errore di autenticazione');
        return false;
      }

      // Get user profile for better context
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', userId)
        .single();

      console.log('👤 User profile:', userProfile);

      // Check if conversation exists with the expert
      let conversationId: string;
      const { data: existingConversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('expert_id', MARCO_NIGRO_ID);

      if (existingConversations && existingConversations.length > 0) {
        conversationId = existingConversations[0].id;
        console.log('💬 Using existing conversation:', conversationId);
      } else {
        console.log('🆕 Creating new conversation with expert');
        const { data: newConversation, error: conversationError } = await supabase
          .from('conversations')
          .insert({
            user_id: userId,
            expert_id: MARCO_NIGRO_ID,
            status: 'active',
            title: `Consulenza per ${diagnosisData.plantType}`
          })
          .select()
          .single();

        if (conversationError) {
          console.error('❌ Error creating conversation:', conversationError);
          toast.error('Errore nella creazione della conversazione');
          return false;
        }

        conversationId = newConversation.id;
      }

      // Create comprehensive message content with AI analysis details
      const messageContent = this.buildComprehensiveAnalysisMessage(diagnosisData, userProfile);

      console.log('📝 Message content:', messageContent);

      // Insert the message using both 'content' and 'text' fields
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          recipient_id: MARCO_NIGRO_ID,
          content: messageContent,
          text: messageContent,
          metadata: {
            type: 'automatic_diagnosis',
            confidence: diagnosisData.confidence,
            isHealthy: diagnosisData.isHealthy,
            plantType: diagnosisData.plantType,
            hasAiAnalysis: true
          }
        });

      if (messageError) {
        console.error('❌ Error sending message:', messageError);
        toast.error(`Errore nell'invio del messaggio: ${messageError.message}`);
        return false;
      }

      // Send image as separate message if available
      if (diagnosisData.imageUrl) {
        const imageMessage = `📸 Immagine della pianta allegata alla diagnosi`;
        const { error: imageMessageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: userId,
            recipient_id: MARCO_NIGRO_ID,
            content: imageMessage,
            text: imageMessage,
            image_url: diagnosisData.imageUrl,
            metadata: {
              type: 'image',
              isPlantImage: true,
              imageUrl: diagnosisData.imageUrl
            }
          });

        if (imageMessageError) {
          console.error('❌ Error sending image message:', imageMessageError);
          // Don't fail the whole process for image message
        }
      }

      // Send notification to expert using the edge function
      try {
        const { data, error } = await supabase.functions.invoke('send-specialist-notification', {
          body: {
            conversation_id: conversationId,
            sender_id: userId,
            recipient_id: MARCO_NIGRO_ID,
            message_text: messageContent,
            expert_email: 'agrotecnicomarconigro@gmail.com',
            image_url: diagnosisData.imageUrl,
            user_details: {
              firstName: userProfile?.first_name || 'Utente',
              lastName: userProfile?.last_name || '',
              email: user.email || ''
            },
            plant_details: [{
              name: diagnosisData.plantType,
              price: 'Diagnosi automatica'
            }]
          }
        });

        if (error) {
          console.error('❌ Error sending expert notification:', error);
        } else {
          console.log('✅ Expert notification sent successfully:', data);
        }
      } catch (notificationError) {
        console.error('❌ Failed to send expert notification:', notificationError);
        // Don't fail the whole process for notification error
      }

      console.log('✅ Successfully sent diagnosis to expert');
      toast.success('Diagnosi AI inviata all\'esperto!', {
        description: 'Il fitopatologo può ora vedere tutti i dettagli dell\'analisi'
      });

      return true;

    } catch (error) {
      console.error('❌ Failed to send diagnosis to expert:', error);
      toast.error('Impossibile contattare l\'esperto', {
        description: 'Prova a inviare manualmente dalla chat'
      });
      return false;
    }
  }

  /**
   * Builds a comprehensive message with AI analysis details
   */
  private static buildComprehensiveAnalysisMessage(diagnosisData: DiagnosisData, userProfile: any): string {
    const userName = userProfile?.first_name && userProfile?.last_name 
      ? `${userProfile.first_name} ${userProfile.last_name}`
      : userProfile?.first_name || 'Utente';

    let message = `🤖 **Analisi AI Completata - Richiesta Consulenza Esperto**\n\n`;
    
    // User info
    message += `👤 **Utente:** ${userName}\n`;
    message += `📧 **Email:** ${userProfile?.email || 'Non disponibile'}\n\n`;
    
    // Plant identification
    message += `🌿 **IDENTIFICAZIONE PIANTA**\n`;
    message += `• **Nome:** ${diagnosisData.analysisResult?.plantName || diagnosisData.plantType}\n`;
    if (diagnosisData.analysisResult?.scientificName) {
      message += `• **Nome Scientifico:** ${diagnosisData.analysisResult.scientificName}\n`;
    }
    message += `• **Confidenza AI:** ${Math.round(diagnosisData.confidence * 100)}%\n\n`;
    
    // Health status
    message += `🏥 **STATO DI SALUTE**\n`;
    message += `• **Condizione:** ${diagnosisData.isHealthy ? '✅ Pianta Sana' : '⚠️ Problemi Rilevati'}\n`;
    
    // Diseases detected
    if (diagnosisData.analysisResult?.diseases && diagnosisData.analysisResult.diseases.length > 0) {
      message += `\n🦠 **PROBLEMI RILEVATI**\n`;
      diagnosisData.analysisResult.diseases.forEach((disease: any, index: number) => {
        message += `\n**${index + 1}. ${disease.name}**\n`;
        if (disease.probability) {
          message += `   • Probabilità: ${Math.round(disease.probability * 100)}%\n`;
        }
        if (disease.description) {
          message += `   • Descrizione: ${disease.description}\n`;
        }
        if (disease.treatment) {
          message += `   • Trattamento suggerito: ${disease.treatment}\n`;
        }
      });
    }
    
    // AI recommendations
    if (diagnosisData.analysisResult?.recommendations && diagnosisData.analysisResult.recommendations.length > 0) {
      message += `\n💡 **RACCOMANDAZIONI AI**\n`;
      diagnosisData.analysisResult.recommendations.forEach((rec: string, index: number) => {
        message += `${index + 1}. ${rec}\n`;
      });
    }
    
    // Symptoms observed
    if (diagnosisData.symptoms && diagnosisData.symptoms.trim() !== '') {
      message += `\n🔍 **SINTOMI OSSERVATI**\n`;
      message += `${diagnosisData.symptoms}\n`;
    }
    
    // Technical details
    message += `\n🔬 **DETTAGLI TECNICI**\n`;
    message += `• **Modello AI utilizzato:** Analisi Multi-Provider\n`;
    message += `• **Timestamp:** ${new Date().toLocaleString('it-IT')}\n`;
    message += `• **Immagine:** ${diagnosisData.imageUrl ? 'Allegata' : 'Non disponibile'}\n`;
    
    // Expert request
    message += `\n👨‍🔬 **RICHIESTA CONSULENZA**\n`;
    message += `Il sistema AI ha completato l'analisi preliminare. `;
    message += `Si richiede la valutazione professionale del fitopatologo per:\n`;
    message += `• Confermare o correggere la diagnosi AI\n`;
    message += `• Fornire raccomandazioni specifiche di trattamento\n`;
    message += `• Valutare la gravità e urgenza dell'intervento\n`;
    
    message += `\n*Questo messaggio contiene l'analisi AI completa per facilitare la consulenza professionale.*`;
    
    return message;
  }
}
