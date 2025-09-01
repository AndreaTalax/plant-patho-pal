import { supabase } from '@/integrations/supabase/client';
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { PlantInfo } from '@/context/PlantInfoContext';
import { toast } from 'sonner';

export class PlantDataSyncService {
  /**
   * Sincronizza automaticamente i dati della pianta con la chat esistente
   */
  static async syncPlantDataToChat(userId: string, plantInfo: PlantInfo, imageUrl?: string, uploadedFile?: File): Promise<{ success: boolean; finalImageUrl?: string }> {
    try {
      console.log('🔄 Syncing plant data to existing chat...', { userId, plantInfo, imageUrl, hasFile: !!uploadedFile });

      // Ottieni la sessione per l'autenticazione
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ No active session for syncing data');
        return { success: false };
      }

      let finalImageUrl = imageUrl;

      // Gestione migliorata dell'upload dell'immagine
      if (imageUrl || uploadedFile) {
        console.log('📸 Processing plant image...', {
          imageUrl: imageUrl?.substring(0, 50) + '...',
          hasFile: !!uploadedFile,
          isBlobUrl: imageUrl?.startsWith('blob:')
        });

        // Se abbiamo un file direttamente, caricalo
        if (uploadedFile) {
          finalImageUrl = await this.uploadImageToStorage(uploadedFile, userId);
        }
        // Se abbiamo solo un blob URL, convertilo e caricalo
        else if (imageUrl && imageUrl.startsWith('blob:')) {
          try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const file = new File([blob], `plant-${Date.now()}.jpg`, { type: 'image/jpeg' });
            finalImageUrl = await this.uploadImageToStorage(file, userId);
          } catch (error) {
            console.error('❌ Error converting blob to file:', error);
            finalImageUrl = imageUrl; // Fallback al blob URL originale
          }
        }
        // Se abbiamo un data URL (base64), convertilo e caricalo
        else if (imageUrl && imageUrl.startsWith('data:image/')) {
          try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const file = new File([blob], `plant-${Date.now()}.jpg`, { type: 'image/jpeg' });
            finalImageUrl = await this.uploadImageToStorage(file, userId);
          } catch (error) {
            console.error('❌ Error converting data URL to file:', error);
            finalImageUrl = imageUrl; // Fallback al data URL originale
          }
        }

        console.log('✅ Final image URL prepared:', finalImageUrl?.substring(0, 50) + '...');
      }

      // Trova la conversazione esistente
      const { data: conversations, error: findError } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('expert_id', MARCO_NIGRO_ID)
        .order('created_at', { ascending: false })
        .limit(1);

      if (findError) {
        console.error('❌ Error finding conversation:', findError);
        return { success: false };
      }

      let conversationId: string;

      if (!conversations || conversations.length === 0) {
        conversationId = crypto.randomUUID();
        console.log('🆕 Creating new conversation with ID:', conversationId);
      } else {
        conversationId = conversations[0].id;
        console.log('✅ Using existing conversation:', conversationId);
      }

      // Costruisce il messaggio con tutti i dati della pianta
      const plantDataMessage = this.buildPlantDataMessage(plantInfo, finalImageUrl);

      // Invia il messaggio usando l'edge function send-message
      console.log('📤 Sending plant data message via edge function...');
      const { data: messageResult, error: messageError } = await supabase.functions.invoke('send-message', {
        body: {
          conversationId,
          recipientId: MARCO_NIGRO_ID,
          text: plantDataMessage,
          imageUrl: null,
          products: null
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (messageError) {
        console.error('❌ Error sending plant data message:', messageError);
        return { success: false };
      }

      console.log('✅ Plant data message sent successfully');

      // Se c'è un'immagine, inviala SEMPRE come messaggio separato
      if (finalImageUrl) {
        console.log('📸 Sending plant image as separate message...');
        const imageMessage = `📸 Immagine della pianta per la diagnosi`;
        
        const { data: imageResult, error: imageError } = await supabase.functions.invoke('send-message', {
          body: {
            conversationId,
            recipientId: MARCO_NIGRO_ID,
            text: imageMessage,
            imageUrl: finalImageUrl,
            products: null
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (imageError) {
          console.error('❌ Error sending plant image:', imageError);
          // Non fallire l'intera operazione per un errore nell'immagine
          toast.warning('Dati inviati ma errore nell\'invio dell\'immagine');
        } else {
          console.log('✅ Plant image sent successfully');
        }
      } else {
        console.log('ℹ️ No image to send');
      }

      // Se ci sono risultati AI, inviali come messaggio separato
      if (plantInfo.aiDiagnosis) {
        console.log('🤖 Sending AI diagnosis results...');
        const aiMessage = this.buildAIDiagnosisMessage(plantInfo.aiDiagnosis);
        
        const { data: aiResult, error: aiError } = await supabase.functions.invoke('send-message', {
          body: {
            conversationId,
            recipientId: MARCO_NIGRO_ID,
            text: aiMessage,
            imageUrl: null,
            products: null
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (aiError) {
          console.error('❌ Error sending AI diagnosis:', aiError);
        } else {
          console.log('✅ AI diagnosis sent successfully');
        }
      }

      console.log('✅ Plant data synced successfully to chat');
      
      // Emetti evento per notificare che i dati sono stati sincronizzati
      window.dispatchEvent(new CustomEvent('plantDataSynced', { 
        detail: { conversationId, finalImageUrl }
      }));
      
      return { success: true, finalImageUrl };

    } catch (error) {
      console.error('❌ Error syncing plant data to chat:', error);
      return { success: false };
    }
  }

  /**
   * Upload dell'immagine su Supabase Storage
   */
  private static async uploadImageToStorage(file: File, userId: string): Promise<string> {
    try {
      console.log('📤 Uploading image to Supabase Storage...', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${userId}/plant-${Date.now()}.${fileExt}`;
      
      const { data: storageData, error: storageError } = await supabase.storage
        .from('plant-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageError) {
        console.error('❌ Error uploading image to storage:', storageError);
        throw storageError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('plant-images')
        .getPublicUrl(fileName);
      
      const publicUrl = urlData.publicUrl;
      console.log('✅ Image uploaded to storage:', publicUrl);
      return publicUrl;

    } catch (error) {
      console.error('❌ Error in uploadImageToStorage:', error);
      throw error;
    }
  }

  /**
   * Costruisce un messaggio formattato con i dati della pianta
   */
  private static buildPlantDataMessage(plantInfo: PlantInfo, imageUrl?: string): string {
    let message = `🌿 **DATI AUTOMATICI DELLA PIANTA**\n\n`;
    
    if (plantInfo.name && plantInfo.name !== 'Pianta non identificata') {
      message += `🏷️ **Nome pianta:** ${plantInfo.name}\n`;
    } else {
      message += `🏷️ **Nome pianta:** Non identificata - richiede identificazione\n`;
    }
    
    message += `🏠 **Ambiente:** ${plantInfo.isIndoor ? 'Interno' : 'Esterno'}\n`;
    
    if (plantInfo.wateringFrequency) {
      message += `💧 **Irrigazione:** ${plantInfo.wateringFrequency}\n`;
    }
    
    if (plantInfo.lightExposure) {
      message += `☀️ **Esposizione luce:** ${plantInfo.lightExposure}\n`;
    }
    
    if (plantInfo.symptoms) {
      message += `🔍 **Sintomi osservati:** ${plantInfo.symptoms}\n`;
    }
    
    if (imageUrl) {
      message += `📸 **Immagine:** Allegata\n`;
    }
    
    message += `\n*Questi dati sono stati inviati automaticamente dal sistema Dr.Plant per la consultazione.*`;
    
    return message;
  }

  /**
   * Costruisce un messaggio con i risultati dell'analisi AI
   */
  private static buildAIDiagnosisMessage(aiDiagnosis: any): string {
    let message = `🤖 **ANALISI AI AUTOMATICA**\n\n`;
    
    if (aiDiagnosis?.consensus?.mostLikelyPlant) {
      const plant = aiDiagnosis.consensus.mostLikelyPlant;
      message += `🌱 **Pianta identificata:** ${plant.plantName}\n`;
      if (plant.scientificName) {
        message += `🔬 **Nome scientifico:** ${plant.scientificName}\n`;
      }
      message += `📊 **Confidenza:** ${Math.round(plant.confidence || 0)}%\n\n`;
    }
    
    if (aiDiagnosis?.consensus?.mostLikelyDisease) {
      const disease = aiDiagnosis.consensus.mostLikelyDisease;
      message += `⚠️ **Problema rilevato:** ${disease.disease}\n`;
      message += `📊 **Confidenza:** ${Math.round(disease.confidence || 0)}%\n`;
      if (disease.symptoms && disease.symptoms.length > 0) {
        message += `🔍 **Sintomi:** ${disease.symptoms.join(', ')}\n`;
      }
      if (disease.treatments && disease.treatments.length > 0) {
        message += `💊 **Trattamenti suggeriti:** ${disease.treatments.join(', ')}\n`;
      }
    } else {
      message += `✅ **Stato:** Pianta apparentemente sana secondo l'AI\n`;
    }
    
    message += `\n*Questa è un'analisi automatica AI. Per una diagnosi professionale accurata, descrivi i sintomi che osservi.*`;
    
    return message;
  }

  /**
   * Verifica se i dati della pianta sono già stati sincronizzati OGGI
   */
  static async isPlantDataSynced(userId: string): Promise<boolean> {
    try {
      // Prima trova la conversazione
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('expert_id', MARCO_NIGRO_ID);

      if (convError || !conversations || conversations.length === 0) {
        return false;
      }

      const conversationId = conversations[0].id;

      // Cerca messaggi inviati oggi con dati della pianta
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('content, sent_at')
        .eq('conversation_id', conversationId)
        .gte('sent_at', today.toISOString())
        .ilike('content', '%DATI AUTOMATICI DELLA PIANTA%');

      if (msgError || !messages) {
        return false;
      }

      // Se ci sono messaggi con dati della pianta inviati oggi
      return messages.length > 0;
    } catch (error) {
      console.error('Error checking plant data sync status:', error);
      return false;
    }
  }

  /**
   * Forza la re-sincronizzazione dei dati della pianta
   */
  static async forceSyncPlantData(userId: string, plantInfo: PlantInfo, imageUrl?: string, uploadedFile?: File): Promise<{ success: boolean; finalImageUrl?: string }> {
    console.log('🔄 Force syncing plant data...');
    return this.syncPlantDataToChat(userId, plantInfo, imageUrl, uploadedFile);
  }
}
