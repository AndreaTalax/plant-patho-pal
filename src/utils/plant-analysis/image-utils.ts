
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
  // For now, just return the original file
  // In the future, this could enhance contrast, adjust brightness, etc.
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
  
  // Check if the file size is reasonable
  const maxSizeBytes = 15 * 1024 * 1024; // 15MB
  if (imageFile.size > maxSizeBytes) {
    return false;
  }
  
  // Additional checks could be added here
  
  return true;
};
