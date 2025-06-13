import { supabase } from '@/integrations/supabase/client';

/**
 * Uploads a plant image to storage and returns the public URL.
 * @example
 * sync(file, userId)
 * 'https://example.com/plant-images/userId/timestamp.jpg'
 * @param {File} file - File object representing the image to be uploaded.
 * @param {string} userId - Unique identifier of the user uploading the image.
 * @returns {Promise<string>} Promise that resolves to the public URL of the uploaded image.
 * @description
 *   - Validates that the input file is an image and does not exceed 10MB.
 *   - Constructs a storage path using the user ID and current timestamp.
 *   - Logs the process at various steps for debugging purposes.
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
 * @example
 * sync(file, 'user123')
 * 'https://example.com/public/avatars/user123/avatar.jpg'
 * @param {File} file - The image file to be uploaded as avatar.
 * @param {string} userId - The ID of the user for whom the avatar is being uploaded.
 * @returns {Promise<string>} A promise that resolves with the public URL of the uploaded avatar image.
 * @description
 *   - Ensures that the provided file is an image before uploading.
 *   - Automatically determines the file extension from the uploaded file's name.
 *   - Overwrites any existing avatar for the user with the new file.
 *   - Logs upload operations and errors to the console.
 */
export const uploadAvatarImage = async (file: File, userId: string): Promise<string> => {
  try {
    console.log('👤 Starting avatar image upload...');
    
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }
    
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}/avatar.${fileExt}`;
    
    console.log('Uploading avatar to path:', fileName);
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true // Allow overwriting existing avatars
      });

    if (error) {
      console.error('Avatar upload error:', error);
      throw new Error(`Avatar upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
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
 * @example
 * sync('data:image/jpeg;base64,...', 'user123')
 * 'https://xyz.supabase.co/storage/v1/object/public/plant-images/user123/1697891234567.jpg'
 * @param {string} base64Data - The base64 encoded image data.
 * @param {string} userId - The ID of the user uploading the image.
 * @returns {Promise<string>} The public URL of the uploaded image.
 * @description
 *   - Ensures the uploaded image size is less than 10MB.
 *   - Generates a unique filename using the user ID and current timestamp.
 *   - Utilizes Supabase storage for image uploading and retrieval.
 *   - Throws an error if the upload or size validation fails.
 */
export const uploadBase64Image = async (base64Data: string, userId: string): Promise<string> => {
  try {
    console.log('📸 Starting base64 image upload...');
    
    // Convert base64 to blob
    const base64Response = await fetch(base64Data);
    const blob = await base64Response.blob();
    
    if (blob.size > 10 * 1024 * 1024) { // 10MB limit
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
