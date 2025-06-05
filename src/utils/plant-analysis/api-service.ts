
import { supabase } from "@/integrations/supabase/client";

export async function callPlantAnalysis(imageData: string, huggingFaceToken: string) {
  try {
    console.log('Calling plant analysis...');
    
    const response = await supabase.functions.invoke('analyze-plant', {
      body: {
        imageData,
        huggingFaceToken,
        isLeaf: false
      }
    });

    console.log('Supabase response:', response);

    if (response.error) {
      console.error('Supabase function error:', response.error);
      throw new Error(`Function error: ${response.error.message || JSON.stringify(response.error)}`);
    }

    if (!response.data) {
      console.error('No data in response:', response);
      throw new Error('No data returned from function');
    }

    return response.data;

  } catch (error) {
    console.error('Plant analysis error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      error: error
    });
    
    // Re-throw with more context
    throw new Error(`Plant analysis failed: ${error.message}`);
  }
}
