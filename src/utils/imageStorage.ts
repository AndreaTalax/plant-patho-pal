
import { supabase } from '@/integrations/supabase/client';

export const uploadPlantImage = async (file: File, userId: string): Promise<string | null> => {
  try {
    console.log(`Uploading plant image: ${file.name}, size: ${file.size}, type: ${file.type}`);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error("Il file deve essere un'immagine");
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("L'immagine deve essere inferiore a 10MB");
    }
    
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { data, error: uploadError } = await supabase.storage
      .from('plant-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Error uploading plant image:', uploadError);
      throw new Error('Errore durante il caricamento dell\'immagine');
    }
    
    const { data: urlData } = supabase.storage
      .from('plant-images')
      .getPublicUrl(fileName);
    
    if (!urlData?.publicUrl) {
      throw new Error("Impossibile ottenere la URL pubblica dell'immagine");
    }
    
    console.log('Plant image uploaded successfully:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadPlantImage:', error);
    throw error;
  }
};

export const uploadBase64Image = async (base64Data: string, userId: string): Promise<string | null> => {
  try {
    console.log('Uploading base64 image...');
    
    // Convert base64 to blob
    const response = await fetch(base64Data);
    const blob = await response.blob();
    
    console.log(`Base64 image converted to blob, size: ${blob.size}, type: ${blob.type}`);
    
    const fileName = `${userId}/${Date.now()}.jpg`;
    
    const { data, error: uploadError } = await supabase.storage
      .from('plant-images')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Error uploading base64 image:', uploadError);
      throw new Error('Errore durante il caricamento dell\'immagine');
    }
    
    const { data: urlData } = supabase.storage
      .from('plant-images')
      .getPublicUrl(fileName);
    
    console.log('Base64 image uploaded successfully:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadBase64Image:', error);
    throw error;
  }
};

export const uploadAvatarImage = async (file: File, userId: string): Promise<string | null> => {
  try {
    console.log(`Uploading avatar: ${file.name}, size: ${file.size}, type: ${file.type}`);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error("Il file deve essere un'immagine");
    }
    
    // Validate file size (max 5MB for avatars)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("L'avatar deve essere inferiore a 5MB");
    }
    
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      throw new Error('Errore durante il caricamento dell\'avatar');
    }
    
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    
    if (!urlData?.publicUrl) {
      throw new Error("Impossibile ottenere la URL pubblica dell'avatar");
    }
    
    // Update user profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Error updating profile with avatar URL:', updateError);
      // Don't throw here, avatar was uploaded successfully
    }
    
    console.log('Avatar uploaded successfully:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadAvatarImage:', error);
    throw error;
  }
};
