// Import required libraries
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Preliminary image classification using CLIP model
export async function classifyImageContent(imageArrayBuffer: ArrayBuffer, huggingFaceToken: string | undefined): Promise<{ isValidPlant: boolean; topLabel: string; confidence: number; allLabels?: any[] }> {
  if (!huggingFaceToken) {
    console.log('⚠️ Hugging Face token not available, skipping preliminary classification');
    return { isValidPlant: true, topLabel: "plant", confidence: 0.5 };
  }

  try {
    console.log('🔍 Starting preliminary image classification with CLIP...');
    
    const imageBytes = new Uint8Array(imageArrayBuffer);
    const labels = ["plant", "leaf", "tree", "flower", "soil", "nothing", "animal", "background", "wall", "person", "food", "object"];
    
    const response = await fetch('https://api-inference.huggingface.co/models/openai/clip-vit-base-patch16', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${huggingFaceToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          image: Array.from(imageBytes)
        },
        parameters: {
          candidate_labels: labels
        }
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.error(`❌ CLIP classification failed with status: ${response.status}`);
      // Fallback: assume it's a plant
      return { isValidPlant: true, topLabel: "plant", confidence: 0.5 };
    }

    const result = await response.json();
    console.log('📊 CLIP classification result:', result);
    
    const topLabel = result?.[0]?.label?.toLowerCase() || "unknown";
    const confidence = result?.[0]?.score || 0;
    
    const isValidPlant = ["plant", "leaf", "tree", "flower"].includes(topLabel);
    
    console.log(`🏷️ Top classification: ${topLabel} (confidence: ${Math.round(confidence * 100)}%)`);
    console.log(`🌿 Is valid plant: ${isValidPlant}`);
    
    return {
      isValidPlant,
      topLabel,
      confidence,
      allLabels: result
    };
    
  } catch (error) {
    console.error('❌ Error in preliminary classification:', error);
    // Fallback: assume it's a plant
    return { isValidPlant: true, topLabel: "plant", confidence: 0.5 };
  }
}

// Enhanced plant verification that includes preliminary classification
export const verifyImageContainsPlant = async (imageArrayBuffer: ArrayBuffer, huggingFaceToken: string | undefined): Promise<{
  isPlant: boolean;
  confidence: number;
  detectedPlantType?: string;
  aiServices?: {serviceName: string; result: boolean; confidence: number}[];
  preliminaryClassification?: any;
}> => {
  console.log('🔍 Starting enhanced plant verification...');
  
  // First, do preliminary classification with CLIP
  const preliminaryResult = await classifyImageContent(imageArrayBuffer, huggingFaceToken);
  
  // If preliminary classification says it's not a plant, return early
  if (!preliminaryResult.isValidPlant) {
    console.log(`❌ Preliminary classification failed: ${preliminaryResult.topLabel} (${Math.round(preliminaryResult.confidence * 100)}%)`);
    return {
      isPlant: false,
      confidence: preliminaryResult.confidence,
      detectedPlantType: preliminaryResult.topLabel,
      aiServices: [{
        serviceName: 'CLIP Preliminary Classification',
        result: false,
        confidence: preliminaryResult.confidence
      }],
      preliminaryClassification: preliminaryResult
    };
  }
  
  console.log(`✅ Preliminary classification passed: ${preliminaryResult.topLabel} (${Math.round(preliminaryResult.confidence * 100)}%)`);
  
  // If no token provided for detailed verification, use preliminary result
  if (!huggingFaceToken) {
    console.log('⚠️ No Hugging Face token provided, using preliminary classification only');
    return {
      isPlant: preliminaryResult.isValidPlant,
      confidence: preliminaryResult.confidence,
      detectedPlantType: preliminaryResult.topLabel,
      aiServices: [{
        serviceName: 'CLIP Preliminary Classification',
        result: preliminaryResult.isValidPlant,
        confidence: preliminaryResult.confidence
      }],
      preliminaryClassification: preliminaryResult
    };
  }

  try {
    console.log('🔍 Proceeding with detailed plant verification...');
    
    // Create request with image data
    const formData = new FormData();
    const blob = new Blob([imageArrayBuffer], { type: 'image/jpeg' });
    formData.append('image', blob, 'image.jpg');

    // Send request to the Hugging Face model for detailed analysis
    const response = await fetch(
      "https://api-inference.huggingface.co/models/onnx-community/vit-plant-verification",
      {
        headers: { Authorization: `Bearer ${huggingFaceToken}` },
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    );

    let detailedResult = null;
    let aiServices = [{
      serviceName: 'CLIP Preliminary Classification',
      result: preliminaryResult.isValidPlant,
      confidence: preliminaryResult.confidence
    }];

    if (response.ok) {
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
      
      detailedResult = {
        isPlant: isPlant || topResult.score > 0.6,
        confidence: topResult ? topResult.score : 0.5,
        topResult
      };

      aiServices.push({
        serviceName: 'VIT Plant Verification',
        result: detailedResult.isPlant,
        confidence: detailedResult.confidence
      });
    } else {
      console.error(`❌ Detailed verification failed: ${response.statusText}`);
    }

    // Determine plant type from preliminary results
    let detectedPlantType = preliminaryResult.topLabel;
    
    if (preliminaryResult.isValidPlant) {
      // Check for specific plant types based on CLIP classification
      const plantTypes = {
        'succulent': ['succulent', 'cactus', 'aloe'],
        'houseplant': ['houseplant', 'indoor', 'potted'],
        'herb': ['herb', 'basil', 'mint', 'parsley', 'cilantro', 'thyme'],
        'flowering': ['flower', 'bloom', 'rose', 'tulip', 'orchid'],
        'palm': ['palm'],
        'vegetable': ['vegetable', 'tomato', 'lettuce', 'pepper'],
        'tree': ['tree', 'shrub']
      };
      
      const label = preliminaryResult.topLabel.toLowerCase();
      for (const [type, keywords] of Object.entries(plantTypes)) {
        if (keywords.some(keyword => label.includes(keyword))) {
          detectedPlantType = type;
          break;
        }
      }
    }

    // Combine preliminary and detailed results
    const isPlant = preliminaryResult.isValidPlant && (detailedResult?.isPlant !== false);
    const confidence = detailedResult ? 
      Math.max(preliminaryResult.confidence, detailedResult.confidence) : 
      preliminaryResult.confidence;

    console.log(`✅ Final verification result: ${isPlant} (confidence: ${Math.round(confidence * 100)}%)`);

    // Return the results with preliminary classification
    return {
      isPlant: isPlant,
      confidence: confidence,
      detectedPlantType: detectedPlantType,
      aiServices: aiServices,
      preliminaryClassification: preliminaryResult
    };
  } catch (error) {
    console.error("❌ Error in detailed plant verification:", error);
    // Fall back to preliminary classification result
    return {
      isPlant: preliminaryResult.isValidPlant,
      confidence: preliminaryResult.confidence,
      detectedPlantType: preliminaryResult.topLabel,
      aiServices: [{
        serviceName: 'CLIP Preliminary Classification',
        result: preliminaryResult.isValidPlant,
        confidence: preliminaryResult.confidence
      }],
      preliminaryClassification: preliminaryResult
    };
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