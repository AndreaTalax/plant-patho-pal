
/**
 * Convert a data URL to a File object
 * @param dataUrl The data URL string
 * @param filename The filename to use
 * @returns File object
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
 * Preprocessing function for optimizing images for plant detection
 * @param imageUrl URL of the image to preprocess
 * @returns Processed image URL
 */
export const preprocessImageForPlantDetection = async (imageUrl: string): Promise<string> => {
  // In a real implementation, this would apply image preprocessing
  // For now, we just return the original URL
  console.log("Preprocessing image for plant detection:", imageUrl);
  return imageUrl;
};

/**
 * Validates if an image is suitable for plant analysis
 * @param imageFile The image file to validate
 * @returns Boolean indicating if the image is valid
 */
export const validateImageForAnalysis = async (imageFile: File): Promise<boolean> => {
  // In a real implementation, this would check image quality, size, etc.
  // For now, we just do a simple size check
  console.log("Validating image for analysis:", imageFile.name);
  return imageFile.size > 0 && imageFile.size < 10 * 1024 * 1024; // Max 10MB
};

/**
 * Resize an image to optimal dimensions for detection algorithms
 * @param imageFile The image file to resize
 * @returns Resized image as a File
 */
export const resizeImageForOptimalDetection = async (imageFile: File): Promise<File> => {
  // In a real implementation, this would resize the image
  // For now, we just return the original file
  console.log("Resizing image for optimal detection:", imageFile.name);
  return imageFile;
};

/**
 * Format a decimal number as a percentage string
 * @param value The decimal value (0-1)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number): string => {
  return `${Math.round(value * 100)}%`;
};
