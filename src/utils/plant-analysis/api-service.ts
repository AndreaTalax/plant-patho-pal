
import { supabase } from "@/integrations/supabase/client";

/**
* Executes plant analysis using provided image data and authentication token through Supabase function invocation.
* @example
* callPlantAnalysis('base64ImageData', 'your_huggingFaceToken')
* // Returns an object containing the analysis result data.
* @param {string} imageData - A base64-encoded string representing the image data for analysis.
* @param {string} huggingFaceToken - Authentication token for accessing Hugging Face services.
* @returns {Object} Object containing the plant analysis data from the Supabase function.
* @description
*   - Handles errors by logging them and rethrowing with additional context for troubleshooting.
*   - Ensures that the response has valid data; throws an error if none is found.
*   - Uses Supabase serverless functions to perform the analysis with specified configurations.
*/
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
