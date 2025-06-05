import { supabase } from '@/integrations/supabase/client';

export const uploadPlantImage = async (file: File, userId: string): Promise<string | null> => {
  try {
    console.log(`Uploading file: ${file.name}, size: ${file.size}, type: ${file.type}`);
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars') // <-- cambiato qui!
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }
    const { data } = supabase.storage
      .from('avatars') // <-- cambiato qui!
      .getPublicUrl(fileName);
    if (!data?.publicUrl) {
      console.error("No public URL returned for uploaded image");
      return null;
    }
    console.log('Image uploaded successfully:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadPlantImage:', error);
    return null;
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
    
    const { error: uploadError } = await supabase.storage
      .from('plant-images')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Error uploading base64 image:', uploadError);
      return null;
    }
    
    const { data } = supabase.storage
      .from('plant-images')
      .getPublicUrl(fileName);
    
    console.log('image uploaded successfully:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadBase64Image:', error);
    return null;
  }
};
