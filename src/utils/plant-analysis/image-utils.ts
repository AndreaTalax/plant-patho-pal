
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

