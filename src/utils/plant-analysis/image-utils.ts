/**
 * Converts a data URL to a File object
 * @param dataUrl The data URL string (e.g., from canvas.toDataURL())
 * @param filename The desired filename
 * @returns A File object that can be uploaded
 */
export const dataURLtoFile = (dataUrl: string, filename: string): File => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
};

/**
 * Applies basic preprocessing to an image before analysis to improve detection
 * @param imageFile The original image file
 * @returns A processed image file with enhanced qualities for plant detection
 */
export const preprocessImageForPlantDetection = async (imageFile: File): Promise<File> => {
  try {
    // Apply a series of image enhancements for better plant detection
    let processedFile = await resizeImageForOptimalDetection(imageFile);
    processedFile = await enhancePlantFeatures(processedFile);
    
    // Compress the image to ensure it's not too large for API transmission
    return await compressImageForUpload(processedFile, 0.85); // Higher quality for better diagnosis
  } catch (error) {
    console.error("Error preprocessing image:", error);
    return imageFile; // Return original if preprocessing fails
  }
};

/**
 * Validates that an image is suitable for plant analysis
 * @param imageFile The image file to validate
 * @returns A boolean indicating if the image meets minimum requirements
 */
export const validateImageForAnalysis = async (imageFile: File): Promise<boolean> => {
  // Check if the file is an image
  if (!imageFile.type.startsWith('image/')) {
    return false;
  }
  
  // Check if the file size is reasonable - increased from 10MB to 15MB to allow more detailed photos
  const maxSizeBytes = 15 * 1024 * 1024; // 15MB
  if (imageFile.size > maxSizeBytes) {
    return false;
  }
  
  try {
    // Create an image element to check if it loads properly
    const img = await createImageBitmap(imageFile);
    
    // Check minimum dimensions
    if (img.width < 224 || img.height < 224) {
      console.warn("Image dimensions too small for optimal analysis");
      return false;
    }
    
    // Additional check for completely black or white images that might not be useful
    const canvas = document.createElement('canvas');
    canvas.width = 50; // Sample size
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0, 50, 50);
    
    const imageData = ctx?.getImageData(0, 0, 50, 50);
    if (imageData) {
      // Check for mostly black or white images (low information content)
      let totalPixels = imageData.data.length / 4;
      let blackPixels = 0;
      let whitePixels = 0;
      
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        
        if (r < 30 && g < 30 && b < 30) {
          blackPixels++;
        } else if (r > 225 && g > 225 && b > 225) {
          whitePixels++;
        }
      }
      
      if (blackPixels / totalPixels > 0.9 || whitePixels / totalPixels > 0.9) {
        console.warn("Image has too little information content (mostly black or white)");
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error validating image:", error);
    return false;
  }
};

/**
 * Resizes an image to a maximum dimension while preserving aspect ratio
 * This can help with model accuracy for very large or very small images
 * @param imageFile The original image file
 * @param maxDimension Maximum width or height
 * @returns A resized image file
 */
export const resizeImageForOptimalDetection = async (imageFile: File, maxDimension = 1024): Promise<File> => {
  try {
    // Create an image from the file
    const img = await createImageBitmap(imageFile);
    
    // Calculate aspect ratio and new dimensions
    const aspectRatio = img.width / img.height;
    let newWidth = img.width;
    let newHeight = img.height;
    
    // Only resize if image is larger than max dimension
    if (newWidth > maxDimension || newHeight > maxDimension) {
      if (aspectRatio > 1) {
        // Landscape
        newWidth = maxDimension;
        newHeight = Math.round(maxDimension / aspectRatio);
      } else {
        // Portrait
        newHeight = maxDimension;
        newWidth = Math.round(maxDimension * aspectRatio);
      }
    }
    
    // Draw resized image to canvas
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0, newWidth, newHeight);
    
    // Convert canvas to file
    const dataUrl = canvas.toDataURL(imageFile.type);
    const filename = imageFile.name.split('.')[0] + '_resized.' + imageFile.name.split('.').pop();
    return dataURLtoFile(dataUrl, filename);
  } catch (error) {
    console.error('Error resizing image:', error);
    return imageFile; // Return original if resize fails
  }
};

/**
 * Compresses an image to reduce file size while maintaining acceptable quality
 * @param imageFile The original image file
 * @param quality The JPEG quality (0-1), where 1 is highest quality
 * @returns A compressed image file
 */
export const compressImageForUpload = async (imageFile: File, quality = 0.7): Promise<File> => {
  try {
    const img = await createImageBitmap(imageFile);
    
    // Create canvas with original dimensions
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw image to canvas
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0);
    
    // Convert to compressed JPEG
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const filename = imageFile.name.split('.')[0] + '_compressed.jpg';
    return dataURLtoFile(dataUrl, filename);
  } catch (error) {
    console.error('Error compressing image:', error);
    return imageFile; // Return original if compression fails
  }
};

/**
 * Extracts the dominant colors from an image
 * @param imageFile The image file to analyze
 * @returns Array of dominant colors in hex format
 */
export const extractDominantColors = async (imageFile: File): Promise<string[]> => {
  try {
    const img = await createImageBitmap(imageFile);
    
    // Create a small canvas to sample colors from
    const canvas = document.createElement('canvas');
    const sampleSize = 50; // Small enough for performance, large enough for accuracy
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0, sampleSize, sampleSize);
    
    // Get pixel data
    const imageData = ctx?.getImageData(0, 0, sampleSize, sampleSize);
    if (!imageData) return ['#00FF00']; // Default green if extraction fails
    
    // Simple color counting (could be improved with clustering algorithms)
    const colorCounts: Record<string, number> = {};
    const data = imageData.data;
    
    // Sample pixels (skip some for performance)
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Convert to hex and count occurrences
      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      colorCounts[hex] = (colorCounts[hex] || 0) + 1;
    }
    
    // Sort by frequency
    const sortedColors = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
    
    // Return top 3 colors
    return sortedColors.slice(0, 3);
  } catch (error) {
    console.error('Error extracting colors:', error);
    return ['#00FF00']; // Default green if extraction fails
  }
};

/**
 * Enhances plant features in an image to improve detection
 * @param imageFile The original image file
 * @returns An enhanced image with improved plant visibility
 */
export const enhancePlantFeatures = async (imageFile: File): Promise<File> => {
  try {
    const img = await createImageBitmap(imageFile);
    
    // Create canvas with original dimensions
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return imageFile;
    
    // Draw original image
    ctx.drawImage(img, 0, 0);
    
    // Get image data for manipulation
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Advanced image processing: Enhanced Vegetation Index (EVI)
    // This technique emphasizes plant materials in the image
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // If pixel has more green than other colors (likely plant)
      if (g > r && g > b) {
        // Enhanced green channel
        data[i + 1] = Math.min(255, g * 1.2);
        
        // Slightly reduce red and blue to make green more prominent
        data[i] = Math.max(0, r * 0.9);
        data[i + 2] = Math.max(0, b * 0.9);
      }
      
      // Enhance contrast for disease spots (often appear as brownish or yellowish spots)
      if ((r > g && r > b) || (r > 200 && g > 150 && b < 100)) {
        // Enhance possible disease markers
        data[i] = Math.min(255, r * 1.1);
      }
    }
    
    // Apply subtle sharpening to help with detail recognition
    const sharpnessMap = applyUnsharpMasking(data, canvas.width, canvas.height);
    
    // Apply sharpening result
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, sharpnessMap[i]));
      data[i + 1] = Math.min(255, Math.max(0, sharpnessMap[i + 1]));
      data[i + 2] = Math.min(255, Math.max(0, sharpnessMap[i + 2]));
    }
    
    // Put enhanced data back to canvas
    ctx.putImageData(imageData, 0, 0);
    
    // Convert to file
    const dataUrl = canvas.toDataURL(imageFile.type, 0.92);
    const filename = imageFile.name.split('.')[0] + '_enhanced.' + imageFile.name.split('.').pop();
    return dataURLtoFile(dataUrl, filename);
  } catch (error) {
    console.error('Error enhancing image:', error);
    return imageFile; // Return original if enhancement fails
  }
};

/**
 * Applies unsharp masking to sharpen an image
 * @param imgData The image data array
 * @param width Image width
 * @param height Image height
 * @returns The sharpened image data array
 */
const applyUnsharpMasking = (imgData: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray => {
  // Create a copy of the original data
  const result = new Uint8ClampedArray(imgData.length);
  
  // For each pixel, apply a simple sharpening kernel
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // For each RGB channel
      for (let c = 0; c < 3; c++) {
        const current = imgData[idx + c];
        
        // Get surrounding pixels
        const top = imgData[idx - width * 4 + c];
        const bottom = imgData[idx + width * 4 + c];
        const left = imgData[idx - 4 + c];
        const right = imgData[idx + 4 + c];
        
        // Calculate unsharp mask
        const blurred = (top + bottom + left + right) / 4;
        const sharpAmount = current + (current - blurred) * 0.6; // Sharpening factor
        
        // Set the result
        result[idx + c] = Math.min(255, Math.max(0, sharpAmount));
      }
      
      // Keep alpha channel the same
      result[idx + 3] = imgData[idx + 3];
    }
  }
  
  // Handle border pixels (just copy)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
        const idx = (y * width + x) * 4;
        result[idx] = imgData[idx];
        result[idx + 1] = imgData[idx + 1];
        result[idx + 2] = imgData[idx + 2];
        result[idx + 3] = imgData[idx + 3];
      }
    }
  }
  
  return result;
};

/**
 * Measures the quality of plant features in an image
 * @param imageFile The image file to analyze
 * @returns A score from 0 to 1 indicating how suitable the image is for plant diagnosis
 */
export const measurePlantFeatureQuality = async (imageFile: File): Promise<number> => {
  try {
    const img = await createImageBitmap(imageFile);
    
    // Create a small canvas to sample colors from
    const canvas = document.createElement('canvas');
    const sampleSize = 100; // Medium size for quality assessment
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0, sampleSize, sampleSize);
    
    // Get pixel data
    const imageData = ctx?.getImageData(0, 0, sampleSize, sampleSize);
    if (!imageData) return 0.5;
    
    // Count green pixels (likely to be plant)
    let greenPixels = 0;
    let totalPixels = imageData.data.length / 4;
    
    // Calculate image contrast and saturation
    let sumBrightness = 0;
    let sumSaturation = 0;
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      
      // Count green dominant pixels
      if (g > r && g > b && g > 60) {
        greenPixels++;
      }
      
      // Calculate brightness
      const brightness = (r + g + b) / 3;
      sumBrightness += brightness;
      
      // Calculate saturation
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      sumSaturation += saturation;
    }
    
    const greenRatio = greenPixels / totalPixels;
    const avgBrightness = sumBrightness / totalPixels;
    const avgSaturation = sumSaturation / totalPixels;
    
    // Score based on multiple factors
    // - Green ratio (plant content)
    // - Brightness (not too dark, not too bright)
    // - Saturation (colorful image has more information)
    
    const greenScore = Math.min(greenRatio * 2, 1); // 0-1 depending on green content
    const brightnessScore = 1 - Math.abs((avgBrightness - 128) / 128); // 0-1, best at medium brightness
    const saturationScore = Math.min(avgSaturation * 3, 1); // 0-1 depending on color information
    
    // Weighted average of scores
    const qualityScore = (greenScore * 0.5) + (brightnessScore * 0.3) + (saturationScore * 0.2);
    return Math.min(Math.max(qualityScore, 0), 1);
  } catch (error) {
    console.error('Error measuring image quality:', error);
    return 0.5; // Default middle score if assessment fails
  }
};
