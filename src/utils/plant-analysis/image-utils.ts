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
  // For now, we're just returning the original file
  // In the future, this could enhance contrast, adjust brightness, or apply other image processing
  
  // Convert to canvas to potentially manipulate pixels (future enhancement)
  // const img = await createImageBitmap(imageFile);
  // const canvas = document.createElement('canvas');
  // canvas.width = img.width;
  // canvas.height = img.height;
  // const ctx = canvas.getContext('2d');
  // ctx?.drawImage(img, 0, 0);
  
  // Return original for now
  return imageFile;
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
  
  // Additional checks could be added here in the future, like minimum dimensions
  // or image quality assessment
  
  return true;
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
    
    // Enhance green channel slightly to emphasize plant features
    for (let i = 0; i < data.length; i += 4) {
      // Enhance green channel
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // If pixel has more green than other colors (likely plant)
      if (g > r && g > b) {
        // Enhance green while keeping natural look
        data[i + 1] = Math.min(255, g * 1.1);
        // Slightly reduce red and blue to make green more prominent
        data[i] = Math.max(0, r * 0.95);
        data[i + 2] = Math.max(0, b * 0.95);
      }
    }
    
    // Put enhanced data back to canvas
    ctx.putImageData(imageData, 0, 0);
    
    // Convert to file
    const dataUrl = canvas.toDataURL(imageFile.type);
    const filename = imageFile.name.split('.')[0] + '_enhanced.' + imageFile.name.split('.').pop();
    return dataURLtoFile(dataUrl, filename);
  } catch (error) {
    console.error('Error enhancing image:', error);
    return imageFile; // Return original if enhancement fails
  }
};
