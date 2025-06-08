
import { supabase } from '@/integrations/supabase/client';

export const ensureStorageBuckets = async () => {
  try {
    console.log('🪣 Checking storage buckets...');
    
    // Check if plant-images bucket exists
    const { data: plantBucket, error: plantBucketError } = await supabase.storage
      .getBucket('plant-images');
    
    if (plantBucketError && plantBucketError.message.includes('not found')) {
      console.log('🆕 Creating plant-images bucket...');
      const { error: createError } = await supabase.storage
        .createBucket('plant-images', {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 10485760 // 10MB
        });
      
      if (createError) {
        console.error('❌ Error creating plant-images bucket:', createError);
      } else {
        console.log('✅ Plant-images bucket created successfully');
      }
    }
    
    // Check if avatars bucket exists
    const { data: avatarBucket, error: avatarBucketError } = await supabase.storage
      .getBucket('avatars');
    
    if (avatarBucketError && avatarBucketError.message.includes('not found')) {
      console.log('🆕 Creating avatars bucket...');
      const { error: createError } = await supabase.storage
        .createBucket('avatars', {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 5242880 // 5MB
        });
      
      if (createError) {
        console.error('❌ Error creating avatars bucket:', createError);
      } else {
        console.log('✅ Avatars bucket created successfully');
      }
    }
    
    console.log('✅ Storage buckets verified');
  } catch (error) {
    console.error('❌ Error setting up storage buckets:', error);
  }
};
