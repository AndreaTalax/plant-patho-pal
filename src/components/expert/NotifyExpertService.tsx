
import { MARCO_NIGRO_ID } from '@/components/phytopathologist';
import { supabase } from '@/integrations/supabase/client';
import { uploadPlantImage, uploadBase64Image } from '@/utils/imageStorage';
import { PlantInfo } from '@/components/diagnose/types';
import { toast } from 'sonner';

/**
* Sends a consultation request to an expert regarding plant issues.
* @example
* sync(file, imageUrl, plantInfo)
* Returns a success message toast if the request is sent successfully.
* @param {File} file - Optional image file of the plant.
* @param {string} imageUrl - Optional URL of the plant's image.
* @param {PlantInfo} plantInfo - Optional object with plant details like symptoms, environment, watering frequency, and light exposure.
* @returns {void} Sends a toast notification on success or error.
* @description
*   - Requires user authentication.
*   - Uploads image to storage if file or base64 image URL is provided.
*   - Inserts consultation record into the 'expert_consultations' table in Supabase.
*   - Manages conversation with the expert by finding or creating it.
*   - Sends details as messages within a conversation.
*   - Uses Supabase functions to notify the expert about the consultation request.
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
      symptoms: plantInfo?.symptoms || null,
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

    // Find or create conversation with expert
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', user.id)
      .eq('expert_id', MARCO_NIGRO_ID)
      .single();

    let conversationId;
    if (!existingConversation) {
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
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
      conversationId = existingConversation.id;
    }

    // Send automatic message with consultation details
    let messageText = `🌿 Nuova richiesta di consulenza\n\n`;
    messageText += `📋 **Consultazione ID:** ${consultation.id}\n`;
    
    if (plantInfo?.symptoms) {
      messageText += `🔍 **Sintomi:** ${plantInfo.symptoms}\n`;
    }
    
    if (plantInfo) {
      messageText += `🏠 **Ambiente:** ${plantInfo.isIndoor ? 'Interno' : 'Esterno'}\n`;
      messageText += `💧 **Irrigazione:** ${plantInfo.wateringFrequency || 'Non specificata'} volte/settimana\n`;
      messageText += `☀️ **Esposizione luce:** ${plantInfo.lightExposure || 'Non specificata'}\n`;
    }
    
    if (finalImageUrl) {
      messageText += `📸 **Immagine:** Allegata alla consultazione`;
    }

    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        recipient_id: MARCO_NIGRO_ID,
        text: messageText
      });

    if (messageError) {
      console.error('Error sending message:', messageError);
      toast.error('Errore nell\'invio del messaggio');
      return;
    }

    // Send image as separate message if available
    if (finalImageUrl) {
      const { error: imageMessageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          recipient_id: MARCO_NIGRO_ID,
          text: finalImageUrl
        });

      if (imageMessageError) {
        console.error('Error sending image message:', imageMessageError);
        // Don't fail the whole process for image
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
