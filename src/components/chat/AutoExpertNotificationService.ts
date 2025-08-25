
import { supabase } from '@/integrations/supabase/client';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { ConversationService } from '@/services/chat/conversationService';
import { MessageService } from '@/services/chat/messageService';

export class AutoExpertNotificationService {
  /**
   * Invia i risultati della diagnosi AI all'esperto nella chat
   */
  static async sendDiagnosisToExpert(userId: string, diagnosisData: any): Promise<boolean> {
    try {
      console.log('📨 Invio diagnosi AI all\'esperto:', diagnosisData);

      // Trova o crea conversazione
      const conversation = await ConversationService.findOrCreateConversation(userId);
      if (!conversation) {
        throw new Error('Impossibile creare conversazione');
      }

      // Prepara il messaggio con i risultati dell'analisi AI
      const aiAnalysisMessage = this.formatAIAnalysisMessage(diagnosisData);

      // Invia messaggio con i risultati dell'analisi AI
      const success = await MessageService.sendMessage(
        conversation.id,
        userId,
        MARCO_NIGRO_ID,
        aiAnalysisMessage,
        diagnosisData.imageUrl
      );

      if (success) {
        console.log('✅ Risultati AI inviati all\'esperto con successo');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Errore invio diagnosi AI all\'esperto:', error);
      return false;
    }
  }

  /**
   * Formatta i risultati dell'analisi AI per la chat
   */
  private static formatAIAnalysisMessage(diagnosisData: any): string {
    const {
      plantType,
      plantVariety,
      confidence,
      isHealthy,
      analysisResult,
      plantInfo
    } = diagnosisData;

    let message = `🤖 **ANALISI AI COMPLETATA**\n\n`;
    
    // Informazioni sulla pianta identificata
    message += `🌿 **Pianta identificata:** ${plantType || 'Non identificata'}\n`;
    if (plantVariety) {
      message += `🔬 **Nome scientifico:** ${plantVariety}\n`;
    }
    
    // Stato di salute
    const healthStatus = isHealthy ? '✅ Sana' : '⚠️ Problemi rilevati';
    message += `💚 **Stato di salute:** ${healthStatus}\n`;
    
    // Confidenza dell'analisi
    const confidencePercent = Math.round((confidence || 0) * 100);
    message += `🎯 **Confidenza:** ${confidencePercent}%\n\n`;

    // Dettagli dell'ambiente
    if (plantInfo) {
      message += `🏠 **DETTAGLI AMBIENTE**\n`;
      message += `📍 **Posizione:** ${plantInfo.environment || 'Non specificata'}\n`;
      message += `💧 **Irrigazione:** ${plantInfo.watering || 'Non specificata'}\n`;
      message += `☀️ **Esposizione:** ${plantInfo.lightExposure || 'Non specificata'}\n`;
      if (plantInfo.symptoms) {
        message += `🔍 **Sintomi osservati:** ${plantInfo.symptoms}\n`;
      }
      message += `\n`;
    }

    // Malattie rilevate (se presenti)
    if (analysisResult && analysisResult.diseases && Array.isArray(analysisResult.diseases) && analysisResult.diseases.length > 0) {
      message += `🦠 **PROBLEMI RILEVATI**\n`;
      analysisResult.diseases.forEach((disease: any, index: number) => {
        const probability = disease.probability ? Math.round(disease.probability * 100) : 'N/A';
        message += `${index + 1}. **${disease.name}** (${probability}%)\n`;
        if (disease.description) {
          message += `   📝 ${disease.description}\n`;
        }
        if (disease.treatment) {
          message += `   💊 Trattamento suggerito: ${disease.treatment}\n`;
        }
        message += `\n`;
      });
    }

    // Raccomandazioni (se presenti)
    if (analysisResult && analysisResult.recommendations && Array.isArray(analysisResult.recommendations) && analysisResult.recommendations.length > 0) {
      message += `💡 **RACCOMANDAZIONI AI**\n`;
      analysisResult.recommendations.forEach((rec: string, index: number) => {
        message += `${index + 1}. ${rec}\n`;
      });
      message += `\n`;
    }

    // Nota finale
    message += `📸 **Immagine allegata per verifica**\n\n`;
    message += `⚠️ *Questa è un'analisi AI preliminare. Si prega di verificare e fornire diagnosi professionale.*`;

    return message;
  }

  /**
   * Invia notifica generale all'esperto (manteniamo per compatibilità)
   */
  static async notifyExpert(userId: string, message: string, imageUrl?: string): Promise<boolean> {
    try {
      const conversation = await ConversationService.findOrCreateConversation(userId);
      if (!conversation) {
        throw new Error('Impossibile creare conversazione');
      }

      const success = await MessageService.sendMessage(
        conversation.id,
        userId,
        MARCO_NIGRO_ID,
        message,
        imageUrl
      );

      return success;
    } catch (error) {
      console.error('❌ Errore notifica esperto:', error);
      return false;
    }
  }
}
