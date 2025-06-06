
import { supabase } from '@/integrations/supabase/client';

/**
 * Upload a plant image to Supabase storage
 * @param file The file to upload
 * @param userId The user ID for organization
 * @returns The URL of the uploaded image or null if the upload failed
 */
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
      if (uploadError.message.includes("The resource already exists")) {
        // Handle duplicate by creating a unique filename
        const uniqueFileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        
        const { data: retryData, error: retryError } = await supabase.storage
          .from('plant-images')
          .upload(uniqueFileName, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (retryError) {
          console.error('Error retrying plant image upload:', retryError);
          throw new Error('Errore durante il caricamento dell\'immagine');
        }
        
        const { data: retryUrlData } = supabase.storage
          .from('plant-images')
          .getPublicUrl(uniqueFileName);
          
        return retryUrlData?.publicUrl || null;
      }
      
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

/**
 * Upload a base64 image to Supabase storage
 * @param base64Data The base64 data URL of the image
 * @param userId The user ID for organization
 * @returns The URL of the uploaded image or null if the upload failed
 */
export const uploadBase64Image = async (base64Data: string, userId: string): Promise<string | null> => {
  try {
    console.log('Uploading base64 image...');
    
    if (!base64Data || !base64Data.startsWith('data:image/')) {
      throw new Error("Invalid base64 image data");
    }
    
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
      if (uploadError.message.includes("The resource already exists")) {
        // Handle duplicate by creating a unique filename
        const uniqueFileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
        
        const { data: retryData, error: retryError } = await supabase.storage
          .from('plant-images')
          .upload(uniqueFileName, blob, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (retryError) {
          console.error('Error retrying base64 image upload:', retryError);
          throw new Error('Errore durante il caricamento dell\'immagine');
        }
        
        const { data: retryUrlData } = supabase.storage
          .from('plant-images')
          .getPublicUrl(uniqueFileName);
          
        return retryUrlData?.publicUrl || null;
      }
      
      console.error('Error uploading base64 image:', uploadError);
      throw new Error('Errore durante il caricamento dell\'immagine');
    }
    
    const { data: urlData } = supabase.storage
      .from('plant-images')
      .getPublicUrl(fileName);
    
    if (!urlData?.publicUrl) {
      throw new Error("Impossibile ottenere la URL pubblica dell'immagine");
    }
    
    console.log('Base64 image uploaded successfully:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadBase64Image:', error);
    throw error;
  }
};

/**
 * Upload an avatar image to Supabase storage and update the user's profile
 * @param file The file to upload
 * @param userId The user ID
 * @returns The URL of the uploaded avatar or null if the upload failed
 */
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
      if (uploadError.message.includes("The resource already exists")) {
        // Handle duplicate by creating a unique filename
        const uniqueFileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        
        const { data: retryData, error: retryError } = await supabase.storage
          .from('avatars')
          .upload(uniqueFileName, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (retryError) {
          console.error('Error retrying avatar upload:', retryError);
          throw new Error('Errore durante il caricamento dell\'avatar');
        }
        
        const { data: retryUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(uniqueFileName);
          
        // Update user profile with new avatar URL
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: retryUrlData.publicUrl })
          .eq('id', userId);
        
        if (updateError) {
          console.error('Error updating profile with avatar URL:', updateError);
        }
        
        return retryUrlData?.publicUrl || null;
      }
      
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

// Utility function to handle camera captures
export const processAndUploadCameraCapture = async (imageDataUrl: string, userId: string): Promise<string> => {
  try {
    if (!imageDataUrl.startsWith('data:image/')) {
      throw new Error("Invalid image format");
    }
    
    return await uploadBase64Image(imageDataUrl, userId);
  } catch (error) {
    console.error('Error processing camera capture:', error);
    throw error;
  }
};

// Utility to get file from URL (useful for processing existing images)
export const getFileFromUrl = async (url: string, fileName: string): Promise<File> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type });
};
