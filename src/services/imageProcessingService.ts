
export interface ProcessedImage {
  processedImage: string;
  metadata?: {
    width: number;
    height: number;
    format: string;
  };
}

export class ImageProcessingService {
  static async processImage(imageBase64: string): Promise<ProcessedImage> {
    // Basic image processing - just return the image with minimal metadata
    return {
      processedImage: imageBase64,
      metadata: {
        width: 800,
        height: 600,
        format: 'jpeg'
      }
    };
  }
}
