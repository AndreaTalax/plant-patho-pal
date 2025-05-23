
// Basic utility functions for plant analysis

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
 * Formats a number as a percentage string
 * @param value The number to format (between 0 and 1)
 * @returns A formatted percentage string
 */
export const formatPercentage = (value: number): string => {
  return `${Math.round(value * 100)}%`;
};

/**
 * Preprocesses image for better plant analysis
 * @param imageFile The original image file
 * @returns A processed image file with improved quality
 */
export const preprocessImage = async (imageFile: File): Promise<File> => {
  try {
    // Create an image element to load the file
    const img = new Image();
    const imageUrl = URL.createObjectURL(imageFile);
    
    // Load the image
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });
    
    // Create canvas for image processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error("Could not get canvas context");
    }
    
    // Set optimal dimensions - resize if too large
    const MAX_DIMENSION = 1024; // Many AI services work best with images around 1024px
    let width = img.width;
    let height = img.height;
    
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      if (width > height) {
        height = Math.round((height * MAX_DIMENSION) / width);
        width = MAX_DIMENSION;
      } else {
        width = Math.round((width * MAX_DIMENSION) / height);
        height = MAX_DIMENSION;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Apply basic enhancements
    ctx.filter = 'contrast(1.1) brightness(1.05)'; // Slightly enhance contrast and brightness
    ctx.drawImage(img, 0, 0, width, height);
    
    // Release the object URL
    URL.revokeObjectURL(imageUrl);
    
    // Convert to file with good quality
    const processedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    return dataURLtoFile(processedDataUrl, 'processed-' + imageFile.name);
  } catch (error) {
    console.error("Error preprocessing image:", error);
    // Return original file as fallback if processing fails
    return imageFile;
  }
};

/**
 * Cache system for API responses to reduce duplicate requests
 */
const responseCache = new Map<string, {
  timestamp: number; 
  data: any;
}>();

/**
 * Get cached response or null if expired or not found
 * @param key Cache key (usually image hash + service name)
 * @param maxAgeMs Maximum cache age in milliseconds (default: 1 hour)
 */
export const getCachedResponse = (key: string, maxAgeMs = 3600000): any => {
  const cached = responseCache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > maxAgeMs) {
    // Expired cache
    responseCache.delete(key);
    return null;
  }
  
  return cached.data;
};

/**
 * Store response in cache
 */
export const cacheResponse = (key: string, data: any): void => {
  responseCache.set(key, {
    timestamp: Date.now(),
    data
  });
};

/**
 * Generate a simple hash for an image file to use as cache key
 * @param file The image file
 */
export const generateImageHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  // Simple hash based on first 1000 bytes and file size 
  // (sufficient for our caching purposes)
  let hash = 0;
  const view = new DataView(buffer.slice(0, Math.min(1000, buffer.byteLength)));
  
  for (let i = 0; i < view.byteLength; i += 4) {
    hash = ((hash << 5) - hash + view.getUint32(i, true)) | 0;
  }
  
  return `${file.size}-${hash}`;
};

