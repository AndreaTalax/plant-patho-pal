import { pipeline } from "@huggingface/transformers";

/**
 * Local plant disease detection using HuggingFace models trained on PlantVillage dataset
 * Runs inference in the browser using WebGPU for better performance
 */

let classifier: any = null;

interface DiseaseDetection {
  label: string;
  score: number;
}

interface LocalDiseaseResult {
  diseases: Array<{
    name: string;
    confidence: number;
    probability: number;
  }>;
  modelUsed: string;
  source: string;
}

/**
 * Initialize the plant disease classifier
 * Uses a model trained on PlantVillage dataset
 */
async function initializeClassifier() {
  if (classifier) return classifier;

  console.log("🌱 Initializing local plant disease detection model...");
  
  try {
    // Try WebGPU first for better performance
    classifier = await pipeline(
      "image-classification",
      "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification",
      { device: "webgpu" }
    );
    console.log("✅ Plant disease model loaded with WebGPU");
  } catch (error) {
    console.warn("⚠️ WebGPU not available, falling back to CPU:", error);
    // Fallback to CPU
    classifier = await pipeline(
      "image-classification",
      "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification"
    );
    console.log("✅ Plant disease model loaded with CPU");
  }

  return classifier;
}

/**
 * Detect plant diseases from an image
 * @param imageUrl - URL or base64 data URL of the plant image
 * @returns Disease detection results
 */
export async function detectPlantDiseases(
  imageUrl: string
): Promise<LocalDiseaseResult> {
  console.log("🔍 Starting local plant disease detection...");

  try {
    const model = await initializeClassifier();
    
    // Run inference
    const predictions = await model(imageUrl, {
      topk: 5, // Get top 5 predictions
    }) as DiseaseDetection[];

    console.log("📊 Local model predictions:", predictions);

    // Filter and format results
    const diseases = predictions
      .filter((pred: DiseaseDetection) => {
        // Filter out healthy predictions unless confidence is very high
        const isHealthy = pred.label.toLowerCase().includes('healthy');
        return !isHealthy || pred.score > 0.8;
      })
      .filter((pred: DiseaseDetection) => pred.score > 0.1) // Minimum 10% confidence
      .map((pred: DiseaseDetection) => ({
        name: formatDiseaseName(pred.label),
        confidence: Math.round(pred.score * 100),
        probability: pred.score,
      }));

    return {
      diseases,
      modelUsed: "MobileNetV2 (PlantVillage)",
      source: "local-browser-inference",
    };
  } catch (error) {
    console.error("❌ Error in local disease detection:", error);
    throw error;
  }
}

/**
 * Format disease name from model output
 * Converts labels like "Tomato___Late_blight" to "Tomato - Late Blight"
 */
function formatDiseaseName(label: string): string {
  // Replace triple underscores with separator
  let formatted = label.replace(/___/g, ' - ');
  // Replace single/double underscores with spaces
  formatted = formatted.replace(/_+/g, ' ');
  // Capitalize each word
  formatted = formatted
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return formatted;
}

/**
 * Check if the model is supported in the current browser
 */
export async function isModelSupported(): Promise<boolean> {
  try {
    // Check for WebGPU support
    if ('gpu' in navigator) {
      return true;
    }
    // Model can still work on CPU, just slower
    return true;
  } catch {
    return false;
  }
}

/**
 * Preload the model to improve first detection speed
 */
export async function preloadModel(): Promise<void> {
  try {
    await initializeClassifier();
    console.log("✅ Plant disease model preloaded successfully");
  } catch (error) {
    console.error("❌ Failed to preload model:", error);
  }
}
