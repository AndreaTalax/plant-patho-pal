/**
 * Utilities for image preprocessing and validation
 */

/**
 * Validates if an image is suitable for plant analysis
 * @param imageFile The image file to validate
 * @returns Promise<boolean> True if the image is valid for analysis
 */
export const validateImageForAnalysis = async (imageFile: File): Promise<boolean> => {
  // Basic size validation
  if (imageFile.size < 1000) {
    console.warn('Image file is too small for accurate analysis');
    return false;
  }
  
  if (imageFile.size > 15000000) {
    console.warn('Image file is too large, try reducing resolution');
    return false;
  }
  
  // Simple valid image type check
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(imageFile.type)) {
    console.warn('Image type not supported for plant analysis');
    return false;
  }
  
  return true;
};

/**
 * Preprocesses an image for optimal plant detection
 * @param imageFile The source image file
 * @returns Promise<File> The processed image file
 */
export const preprocessImageForPlantDetection = async (imageFile: File): Promise<File> => {
  // For now, just return the original image
  // In a real implementation, we would apply contrast enhancement, 
  // noise reduction, and other preprocessing techniques
  return imageFile;
};

/**
 * Resizes an image for optimal detection by ML models
 * @param imageFile The source image file
 * @returns Promise<File> The resized image file
 */
export const resizeImageForOptimalDetection = async (imageFile: File): Promise<File> => {
  try {
    // Create a URL for the image
    const imageUrl = URL.createObjectURL(imageFile);
    
    // Load the image into an HTML Image element
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });
    
    // If the image is already an optimal size, return the original
    if (img.width <= 1024 && img.height <= 1024) {
      URL.revokeObjectURL(imageUrl);
      return imageFile;
    }
    
    // Create a canvas to resize the image
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;
    
    // Calculate new dimensions (max 1024px on the longest side)
    if (width > height) {
      if (width > 1024) {
        height = Math.round(height * (1024 / width));
        width = 1024;
      }
    } else {
      if (height > 1024) {
        width = Math.round(width * (1024 / height));
        height = 1024;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Draw the resized image
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Couldn't get canvas context");
    
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(imageUrl);
    
    // Convert the canvas to a blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.92);
    });
    
    // Create a new file from the blob
    return new File([blob], imageFile.name, {
      type: 'image/jpeg',
      lastModified: Date.now()
    });
  } catch (error) {
    console.error('Error resizing image:', error);
    // Return original file if there was an error
    return imageFile;
  }
};

/**
 * Convert a data URL to a File object
 * @param dataUrl The data URL
 * @param filename The filename to use
 * @returns File object
 */
export function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
}
