
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { supabase } from '@/integrations/supabase/client';
import { uploadPlantImage, uploadBase64Image } from '@/utils/imageStorage';
import { PlantInfo } from '@/components/diagnose/types';
import { PlantDataSyncService } from '@/services/chat/plantDataSyncService';
import { toast } from 'sonner';

/**
* Sends a consultation request to an expert regarding plant issues.
*/
export const notifyExpert = async (file?: File, imageUrl?: string, plantInfo?: PlantInfo) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Devi essere autenticato per contattare l\'esperto');
      return;
    }

    let finalImageUrl = imageUrl;

    // Upload image to storage if file is provided
    if (file) {
      finalImageUrl = await uploadPlantImage(file, user.id);
    } else if (imageUrl && imageUrl.startsWith('data:image/')) {
      // Upload base64 image
      finalImageUrl = await uploadBase64Image(imageUrl, user.id);
    }

    // Create expert consultation record with proper Json casting
    const consultationData = {
      user_id: user.id,
      plant_info: plantInfo ? JSON.parse(JSON.stringify(plantInfo)) : null,
      symptoms: Array.isArray(plantInfo?.symptoms) ? plantInfo.symptoms.join(', ') : (plantInfo?.symptoms || null),
      image_url: finalImageUrl,
      status: 'pending'
    };

    const { data: consultation, error: consultationError } = await supabase
      .from('expert_consultations')
      .insert(consultationData)
      .select()
      .single();

    if (consultationError) {
      console.error('Error creating consultation:', consultationError);
      toast.error('Errore nella creazione della consultazione');
      return;
    }

    // Usa il nuovo servizio di sincronizzazione dati invece di creare messaggi manualmente
    if (plantInfo) {
      const success = await PlantDataSyncService.syncPlantDataToChat(
        user.id,
        plantInfo,
        finalImageUrl
      );

      if (!success) {
        console.warn('Failed to sync plant data, falling back to manual message creation');
        // Fallback al metodo precedente se la sincronizzazione fallisce
        await createManualExpertMessage(user.id, plantInfo, finalImageUrl, consultation.id);
      }
    }

    // Notify expert via edge function
    try {
      await supabase.functions.invoke('notify-expert', {
        body: {
          consultationId: consultation.id,
          userId: user.id,
          plantInfo: plantInfo,
          imageUrl: finalImageUrl
        }
      });
    } catch (functionError) {
      console.error('Error calling notify-expert function:', functionError);
    }

    toast.success('Richiesta inviata all\'esperto con successo!');

  } catch (error) {
    console.error('Error in notifyExpert:', error);
    toast.error('Errore nell\'invio della richiesta all\'esperto');
  }
};

// Funzione di fallback per creare messaggi manuali
const createManualExpertMessage = async (
  userId: string, 
  plantInfo: PlantInfo, 
  imageUrl: string | null, 
  consultationId: string
) => {
  try {
    // Find or create conversation with expert
    const { data: existingConversations, error: searchError } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('expert_id', MARCO_NIGRO_ID);

    if (searchError) {
      console.error('Error searching conversations:', searchError);
      return;
    }

    let conversationId;
    if (!existingConversations || existingConversations.length === 0) {
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          expert_id: MARCO_NIGRO_ID,
          status: 'active'
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        return;
      }
      conversationId = newConversation.id;
    } else {
      conversationId = existingConversations[0].id;
    }

    // Send automatic message with consultation details
    let messageText = `🌿 Nuova richiesta di consulenza\n\n`;
    messageText += `📋 **Consultazione ID:** ${consultationId}\n`;
    
    if (plantInfo?.symptoms) {
      messageText += `🔍 **Sintomi:** ${plantInfo.symptoms}\n`;
    }
    
    if (plantInfo) {
      messageText += `🏠 **Ambiente:** ${plantInfo.isIndoor ? 'Interno' : 'Esterno'}\n`;
      messageText += `💧 **Irrigazione:** ${plantInfo.wateringFrequency || 'Non specificata'}\n`;
      messageText += `☀️ **Esposizione luce:** ${plantInfo.lightExposure || 'Non specificata'}\n`;
    }
    
    if (imageUrl) {
      messageText += `📸 **Immagine:** Allegata alla consultazione`;
    }

    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        recipient_id: MARCO_NIGRO_ID,
        content: messageText, // Required field
        text: messageText // Also populate text field
      });

    if (messageError) {
      console.error('Error sending message:', messageError);
      return;
    }

    // Send image as separate message if available
    if (imageUrl) {
      const imageMessage = `📸 Immagine della pianta: ${imageUrl}`;
      const { error: imageMessageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          recipient_id: MARCO_NIGRO_ID,
          content: imageMessage, // Required field
          text: imageMessage // Also populate text field
        });

      if (imageMessageError) {
        console.error('Error sending image message:', imageMessageError);
        // Don't fail the whole process for image
      }
    }
  } catch (error) {
    console.error('Error in createManualExpertMessage:', error);
  }
};
