import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const DiagnosisTestButton = ({ uploadedImage, plantInfo, analyzeUploadedImage }: {
  uploadedImage: string | null;
  plantInfo: any;
  analyzeUploadedImage: (file: File, plantInfo?: any) => Promise<void>;
}) => {
  const testDiagnosis = async () => {
    console.log('🧪 Testing diagnosis system...');
    
    // Test 1: Check API status
    try {
      console.log('📡 Testing API status...');
      const { data: apiStatus, error } = await supabase.functions.invoke('check-api-status');
      
      if (error) {
        console.error('❌ API Status Error:', error);
        toast.error('API Status test failed: ' + error.message);
        return;
      }
      
      console.log('✅ API Status:', apiStatus);
      toast.success('API Status: ' + JSON.stringify(apiStatus));
      
      // Test 2: Try plant identification if we have an image
      if (uploadedImage && plantInfo?.uploadedFile) {
        console.log('🌿 Testing plant identification...');
        
        // Convert image to base64
        const arrayBuffer = await plantInfo.uploadedFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < uint8Array.byteLength; i++) {
          binary += String.fromCharCode(uint8Array[i]);
        }
        const base64 = btoa(binary);
        const imageBase64 = `data:${plantInfo.uploadedFile.type};base64,${base64}`;
        
        const { data: identResult, error: identError } = await supabase.functions.invoke('enhanced-plant-identification', {
          body: { imageBase64 }
        });
        
        if (identError) {
          console.error('❌ Plant Identification Error:', identError);
          toast.error('Plant ID test failed: ' + identError.message);
        } else {
          console.log('✅ Plant Identification Result:', identResult);
          toast.success('Plant identified: ' + JSON.stringify(identResult?.identificazione?.consensus?.mostProbabile?.nomeComune || 'Unknown'));
        }
        
        // Test 3: Try unified diagnosis
        console.log('🔬 Testing unified diagnosis...');
        
        const { data: diagResult, error: diagError } = await supabase.functions.invoke('unified-plant-diagnosis', {
          body: { 
            imageBase64,
            plantInfo: {
              symptoms: plantInfo.symptoms,
              plantName: plantInfo.name,
              isIndoor: plantInfo.isIndoor,
              wateringFrequency: plantInfo.wateringFrequency,
              lightExposure: plantInfo.lightExposure
            }
          }
        });
        
        if (diagError) {
          console.error('❌ Unified Diagnosis Error:', diagError);
          toast.error('Diagnosis test failed: ' + diagError.message);
        } else {
          console.log('✅ Unified Diagnosis Result:', diagResult);
          toast.success('Diagnosis completed: ' + JSON.stringify(diagResult?.finalDiagnosis?.plant?.name || 'No diagnosis'));
        }
      } else {
        toast.info('Upload an image first to test plant identification and diagnosis');
      }
      
    } catch (error) {
      console.error('🚨 Test failed:', error);
      toast.error('Test failed: ' + error.message);
    }
  };

  return (
    <Button 
      onClick={testDiagnosis}
      variant="outline"
      className="mb-4"
    >
      🧪 Test Diagnosis System
    </Button>
  );
};