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
      console.log('🔄 Syncing plant data to existing chat...', { userId, plantInfo, imageUrl });

      // Ottieni la sessione per l'autenticazione
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ No active session for syncing data');
        return { success: false };
      }

      // Upload image to Supabase Storage if it's a blob URL
      let finalImageUrl = imageUrl;
      if (imageUrl && imageUrl.startsWith('blob:') && uploadedFile) {
        console.log('📸 Uploading image to Supabase Storage...');
        const fileName = `${Date.now()}.jpg`;
        const filePath = `${userId}/${fileName}`;
        
        const { data: storageData, error: storageError } = await supabase.storage
          .from('plant-images')
          .upload(filePath, uploadedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (storageError) {
          console.error('❌ Error uploading image to storage:', storageError);
          finalImageUrl = undefined;
        } else {
          const { data: urlData } = supabase.storage
            .from('plant-images')
            .getPublicUrl(filePath);
          
          finalImageUrl = urlData.publicUrl;
          console.log('✅ Image uploaded to storage:', finalImageUrl);
        }
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

      // ✅ FIX: Aggiungi senderId
      console.log('📤 Sending plant data message via edge function...');
      const { data: messageResult, error: messageError } = await supabase.functions.invoke('send-message', {
        body: {
          conversationId,
          senderId: userId,  // ✅ AGGIUNTO
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

      // Se c'è un'immagine, inviala come messaggio separato
      if (finalImageUrl) {
        console.log('📸 Sending plant image...');
        const imageMessage = `📸 Immagine della pianta`;
        
        // ✅ FIX: Aggiungi senderId
        const { data: imageResult, error: imageError } = await supabase.functions.invoke('send-message', {
          body: {
            conversationId,
            senderId: userId,  // ✅ AGGIUNTO
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
          return { success: false };
        }

        console.log('✅ Plant image sent successfully');
      }

      console.log('✅ Plant data synced successfully to chat');
      
      window.dispatchEvent(new CustomEvent('plantDataSynced'));
      
      return { success: true, finalImageUrl };

    } catch (error) {
      console.error('❌ Error syncing plant data to chat:', error);
      return { success: false };
    }
  }

  /**
   * Costruisce un messaggio formattato con i dati della pianta
   */
  private static buildPlantDataMessage(plantInfo: PlantInfo, imageUrl?: string): string {
    let message = `🌿 **Dati della pianta inseriti automaticamente**\n\n`;
    
    if (plantInfo.name && plantInfo.name !== 'Pianta non identificata') {
      message += `🏷️ **Nome pianta:** ${plantInfo.name}\n`;
    } else {
      message += `🏷️ **Nome pianta:** Non identificata\n`;
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
    
    message += `\n*Questi dati sono stati inseriti automaticamente dal sistema di diagnosi.*`;
    
    return message;
  }

  /**
   * Verifica se i dati della pianta sono già stati sincronizzati
   */
  static async isPlantDataSynced(userId: string): Promise<boolean> {
    try {
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('expert_id', MARCO_NIGRO_ID);

      if (convError || !conversations || conversations.length === 0) {
        return false;
      }

      const conversationId = conversations[0].id;

      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('metadata')
        .eq('conversation_id', conversationId)
        .not('metadata', 'is', null);

      if (msgError || !messages) {
        return false;
      }

      const hasSyncedData = messages.some((msg: any) => 
        msg.metadata && 
        (msg.metadata.type === 'plant_data_sync' || msg.metadata.autoSynced === true)
      );

      return hasSyncedData;
    } catch (error) {
      console.error('Error checking plant data sync status:', error);
      return false;
    }
  }
}
