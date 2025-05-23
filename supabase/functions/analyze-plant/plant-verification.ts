
// Import required libraries
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Function to verify if the image contains a plant
export const verifyImageContainsPlant = async (imageArrayBuffer: ArrayBuffer, huggingFaceToken: string | undefined): Promise<{
  isPlant: boolean;
  confidence: number;
  detectedPlantType?: string;
  aiServices?: {serviceName: string; result: boolean; confidence: number}[];
}> => {
  try {
    // Check if the token is provided
    if (!huggingFaceToken) {
      console.log("No Hugging Face token provided. Assuming image contains a plant.");
      return { isPlant: true, confidence: 1.0 };
    }

    // Create request with image data
    const formData = new FormData();
    const blob = new Blob([imageArrayBuffer], { type: 'image/jpeg' });
    formData.append('image', blob, 'image.jpg');

    // Send request to the Hugging Face model
    const response = await fetch(
      "https://api-inference.huggingface.co/models/onnx-community/vit-plant-verification",
      {
        headers: { Authorization: `Bearer ${huggingFaceToken}` },
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    );

    if (!response.ok) {
      console.error(`Error verifying plant: ${response.statusText}`);
      // Default to true if the model fails - allow processing to continue
      return { isPlant: true, confidence: 0.6 };
    }

    const data = await response.json();
    const results = data.map(res => ({ 
      label: res.label, 
      score: res.score 
    })).filter(res => res.score > 0.1);

    // Get the top result
    const topResult = results[0];
    
    // Check if it's a plant with high confidence
    const isPlant = topResult && (
      topResult.label.includes('plant') || 
      topResult.label.includes('flower') || 
      topResult.label.includes('tree') || 
      topResult.label.includes('leaf')
    );
    
    // Determine plant type from results if possible
    let detectedPlantType = undefined;
    
    if (isPlant) {
      // Check for specific plant types in the labels
      const plantTypes = [
        { type: 'succulent', keywords: ['succulent', 'cactus', 'aloe'] },
        { type: 'houseplant', keywords: ['houseplant', 'indoor plant', 'potted plant'] },
        { type: 'herb', keywords: ['herb', 'basil', 'mint', 'parsley', 'cilantro', 'thyme'] },
        { type: 'flowering', keywords: ['flower', 'bloom', 'rose', 'tulip', 'orchid'] },
        { type: 'palm', keywords: ['palm'] },
        { type: 'vegetable', keywords: ['vegetable', 'tomato', 'lettuce', 'pepper'] },
        { type: 'tree', keywords: ['tree', 'shrub'] }
      ];
      
      for (const result of results) {
        const label = result.label.toLowerCase();
        for (const plantType of plantTypes) {
          if (plantType.keywords.some(keyword => label.includes(keyword))) {
            detectedPlantType = plantType.type;
            break;
          }
        }
        if (detectedPlantType) break;
      }
    }

    return { 
      isPlant: isPlant || topResult.score > 0.6,
      confidence: topResult ? topResult.score : 0.5,
      detectedPlantType,
      aiServices: [
        {
          serviceName: 'Plexi AI Plant Verification',
          result: isPlant || topResult.score > 0.6,
          confidence: topResult ? topResult.score : 0.5
        }
      ]
    };
  } catch (error) {
    console.error("Error in plant verification:", error);
    // Default to true if there's an error - allow processing to continue
    return { isPlant: true, confidence: 0.5 };
  }
};

// Function to check if the image is specifically of a leaf
export const isLeafImage = async (imageArrayBuffer: ArrayBuffer, huggingFaceToken: string | undefined): Promise<boolean> => {
  try {
    if (!huggingFaceToken) {
      return false; // Default to false if no token
    }

    const formData = new FormData();
    const blob = new Blob([imageArrayBuffer], { type: 'image/jpeg' });
    formData.append('image', blob, 'image.jpg');

    // Send request to object detection model
    const response = await fetch(
      "https://api-inference.huggingface.co/models/onnx-community/yolos-plant-parts",
      {
        headers: { Authorization: `Bearer ${huggingFaceToken}` },
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    );

    if (!response.ok) {
      console.error(`Error detecting plant parts: ${response.statusText}`);
      return false;
    }

    const data = await response.json();
    
    // Check if any leaf objects were detected with reasonable confidence
    const leafDetections = data.filter(obj => 
      (obj.label.toLowerCase().includes('leaf') || obj.label.toLowerCase() === 'leaf') && 
      obj.score > 0.3
    );

    return leafDetections.length > 0;
  } catch (error) {
    console.error("Error in leaf detection:", error);
    return false;
  }
};

// Function to check if the plant might be an EPPO regulated pest/disease concern
export const checkForEppoConcerns = async (
  imageArrayBuffer: ArrayBuffer, 
  huggingFaceToken: string | undefined
): Promise<{
  hasEppoConcern: boolean;
  concernName?: string;
  concernType?: string;
  eppoCode?: string;
  regulatoryStatus?: string;
  confidenceScore?: number;
}> => {
  try {
    if (!huggingFaceToken) {
      return { hasEppoConcern: false };
    }

    const formData = new FormData();
    const blob = new Blob([imageArrayBuffer], { type: 'image/jpeg' });
    formData.append('image', blob, 'image.jpg');

    // Send request to EPPO pest/disease detection model
    const response = await fetch(
      "https://api-inference.huggingface.co/models/onnx-community/eppo-regulated-pests",
      {
        headers: { Authorization: `Bearer ${huggingFaceToken}` },
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    );

    if (!response.ok) {
      console.error(`Error checking for EPPO concerns: ${response.statusText}`);
      return { hasEppoConcern: false };
    }

    const data = await response.json();
    
    // Process results
    if (data && Array.isArray(data)) {
      // Find any high-confidence regulated pest/disease matches
      const topConcern = data.find(item => 
        item && item.score > 0.7 && 
        item.label && typeof item.label === 'string' && // Check label is a string
        (item.label.toLowerCase().includes('xylella') || 
         item.label.toLowerCase().includes('regulated') ||
         item.label.toLowerCase().includes('quarantine'))
      );
      
      if (topConcern) {
        // Determine EPPO code if possible
        let eppoCode = '';
        const label = topConcern.label.toLowerCase();
        
        if (label.includes('xylella fastidiosa')) eppoCode = 'XYLEFA';
        else if (label.includes('fire blight')) eppoCode = 'ERWIAM';
        else if (label.includes('citrus greening')) eppoCode = 'LIBEAS';
        
        return {
          hasEppoConcern: true,
          concernName: topConcern.label,
          concernType: label.includes('bacteria') ? 'bacteria' : 
                      label.includes('virus') ? 'virus' :
                      label.includes('fungi') ? 'fungi' : 'pest',
          eppoCode,
          regulatoryStatus: 'Quarantine pest/disease',
          confidenceScore: topConcern.score
        };
      }
    }
    
    return { hasEppoConcern: false };
  } catch (error) {
    console.error("Error in EPPO concern check:", error);
    return { hasEppoConcern: false };
  }
};
