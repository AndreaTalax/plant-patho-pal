
import { supabase } from '@/integrations/supabase/client';

/**
 * Uploads a plant image to storage and returns the public URL.
 */
export const uploadPlantImage = async (file: File, userId: string): Promise<string> => {
  try {
    console.log('📸 Starting plant image upload...');
    console.log('File info:', { name: file.name, size: file.size, type: file.type });
    console.log('User ID:', userId);
    
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File size must be less than 10MB');
    }
    
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    console.log('Uploading to path:', fileName);
    
    const { data, error } = await supabase.storage
      .from('plant-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Plant image upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    console.log('Upload successful, getting public URL...');
    
    const { data: { publicUrl } } = supabase.storage
      .from('plant-images')
      .getPublicUrl(fileName);

    console.log('✅ Plant image uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Plant image upload failed:', error);
    throw error;
  }
};

/**
 * Uploads an avatar image file to storage and returns its public URL.
 */
export const uploadAvatarImage = async (file: File, userId: string): Promise<string> => {
  try {
    console.log('👤 Starting avatar image upload...');
    
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }
    
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }
    
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}/avatar.${fileExt}`;
    
    console.log('Uploading avatar to path:', fileName);
    
    const { data, error } = await supabase.storage
      .from('plant-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Avatar upload error:', error);
      throw new Error(`Avatar upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('plant-images')
      .getPublicUrl(fileName);

    console.log('✅ Avatar uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Avatar upload failed:', error);
    throw error;
  }
};

/**
 * Uploads a base64 encoded image to storage and returns its public URL.
 */
export const uploadBase64Image = async (base64Data: string, userId: string): Promise<string> => {
  try {
    console.log('📸 Starting base64 image upload...');
    
    const base64Response = await fetch(base64Data);
    const blob = await base64Response.blob();
    
    if (blob.size > 10 * 1024 * 1024) {
      throw new Error('Image size must be less than 10MB');
    }
    
    const fileName = `${userId}/${Date.now()}.jpg`;
    
    console.log('Uploading base64 image to path:', fileName);
    
    const { data, error } = await supabase.storage
      .from('plant-images')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg'
      });

    if (error) {
      console.error('Base64 image upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('plant-images')
      .getPublicUrl(fileName);

    console.log('✅ Base64 image uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Base64 image upload failed:', error);
    throw error;
  }
};
