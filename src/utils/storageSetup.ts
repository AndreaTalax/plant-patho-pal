
import { supabase } from '@/integrations/supabase/client';

// Check bucket existence and provide accurate status information
export const ensureStorageBuckets = async () => {
  try {
    console.log('🔍 Checking storage buckets status...');
    
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.warn('⚠️ Cannot access storage bucket list (might be due to permissions):', error.message);
      console.log('📝 Note: This is usually not a problem if buckets exist in the Supabase dashboard');
      return { success: true, warning: 'Cannot verify buckets but this is non-critical' };
    }

    const bucketsNeeded = ['plant-images', 'avatars'];
    const existingBuckets = buckets?.map(bucket => bucket.name) || [];
    
    console.log('📊 Existing buckets:', existingBuckets);
    
    const status = bucketsNeeded.map(bucketName => {
      const exists = existingBuckets.includes(bucketName);
      return {
        name: bucketName,
        exists,
        status: exists ? '✅ Available' : '❌ Missing'
      };
    });

    console.log('📋 Bucket status:');
    status.forEach(bucket => {
      console.log(`  ${bucket.name}: ${bucket.status}`);
    });

    const missingBuckets = status.filter(bucket => !bucket.exists);
    
    if (missingBuckets.length === 0) {
      console.log('🎉 All required storage buckets are available and ready to use!');
      return { success: true, allBucketsReady: true };
    } else {
      console.warn(`⚠️ Missing buckets: ${missingBuckets.map(b => b.name).join(', ')}`);
      console.warn('📝 Note: If buckets exist in Supabase dashboard, this might be a permissions issue');
      return { 
        success: true,  // Changed to true since this is non-critical
        allBucketsReady: false,
        missingBuckets: missingBuckets.map(b => b.name),
        warning: 'Some buckets not visible via API'
      };
    }

  } catch (error) {
    console.warn('⚠️ Non-critical error during bucket check:', error);
    return { success: true, warning: 'Bucket verification skipped' };
  }
};

// Test bucket accessibility by attempting to list files
export const testBucketAccess = async (bucketName: string) => {
  try {
    console.log(`🧪 Testing access to bucket: ${bucketName}`);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1 });

    if (error) {
      console.error(`❌ Cannot access bucket ${bucketName}:`, error);
      return { accessible: false, error: error.message };
    }

    console.log(`✅ Bucket ${bucketName} is accessible`);
    return { accessible: true, fileCount: data?.length || 0 };

  } catch (error) {
    console.error(`❌ Error testing bucket ${bucketName}:`, error);
    return { accessible: false, error: 'Unexpected error during access test' };
  }
};
