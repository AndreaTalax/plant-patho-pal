
import { supabase } from '@/integrations/supabase/client';

/**
 * Ensures the existence of the 'plant-images' storage bucket in the Supabase storage and creates it if it doesn't exist.
 * @example
 * sync()
 * // Logs message regarding the status of 'plant-images' bucket.
 * @returns {void} No return value.
 * @description
 *   - The bucket is configured to be publicly accessible and limited to image files with a maximum size of 10MB.
 *   - Logs status messages to the console indicating the success or failure of operations.
 */
export const ensureStorageBuckets = async () => {
  try {
    console.log('Checking storage buckets...');
    
    // Check if plant-images bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    const plantImagesBucket = buckets?.find(bucket => bucket.name === 'plant-images');
    
    if (!plantImagesBucket) {
      console.log('Creating plant-images bucket...');
      const { error: createError } = await supabase.storage.createBucket('plant-images', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
      } else {
        console.log('Plant-images bucket created successfully');
      }
    } else {
      console.log('Plant-images bucket already exists');
    }
  } catch (error) {
    console.error('Error in ensureStorageBuckets:', error);
  }
};
