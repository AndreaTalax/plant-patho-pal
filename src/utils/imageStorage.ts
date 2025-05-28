
import { supabase } from '@/integrations/supabase/client';

export const uploadPlantImage = async (file: File, userId: string): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('plant-images')
      .upload(fileName, file);
    
    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }
    
    const { data } = supabase.storage
      .from('plant-images')
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadPlantImage:', error);
    return null;
  }
};

export const uploadBase64Image = async (base64Data: string, userId: string): Promise<string | null> => {
  try {
    // Convert base64 to blob
    const response = await fetch(base64Data);
    const blob = await response.blob();
    
    const fileName = `${userId}/${Date.now()}.jpg`;
    
    const { error: uploadError } = await supabase.storage
      .from('plant-images')
      .upload(fileName, blob);
    
    if (uploadError) {
      console.error('Error uploading base64 image:', uploadError);
      return null;
    }
    
    const { data } = supabase.storage
      .from('plant-images')
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadBase64Image:', error);
    return null;
  }
};
