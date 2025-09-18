import { toast } from 'sonner';

export interface PlantValidationResult {
  isPlant: boolean;
  confidence: number;
  reason?: string;
}

/**
 * Validates if an image contains plant content using basic image analysis
 */
export class PlantImageValidator {
  private static async analyzeImageColors(imageFile: File): Promise<PlantValidationResult> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        if (!imageData) {
          resolve({ isPlant: true, confidence: 0.5, reason: 'Cannot analyze image' });
          return;
        }
        
        let greenPixels = 0;
        let totalPixels = 0;
        let brownPixels = 0;
        
        for (let i = 0; i < imageData.data.length; i += 4) {
          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];
          
          totalPixels++;
          
          // Check for green colors (leaves)
          if (g > r && g > b && g > 50) {
            greenPixels++;
          }
          
          // Check for brown colors (stems, bark, soil)
          if (r > 100 && g > 80 && b < 100 && Math.abs(r - g) < 50) {
            brownPixels++;
          }
        }
        
        const greenRatio = greenPixels / totalPixels;
        const brownRatio = brownPixels / totalPixels;
        const plantColorRatio = greenRatio + brownRatio;
        
        // If more than 15% of the image contains plant-like colors, consider it a plant
        const isPlant = plantColorRatio > 0.15;
        const confidence = Math.min(plantColorRatio * 3, 1); // Scale confidence
        
        resolve({
          isPlant,
          confidence,
          reason: isPlant 
            ? `Rilevati colori vegetali (${(plantColorRatio * 100).toFixed(1)}%)` 
            : `Pochi colori vegetali rilevati (${(plantColorRatio * 100).toFixed(1)}%)`
        });
      };
      
      img.onerror = () => {
        resolve({ isPlant: true, confidence: 0.5, reason: 'Errore nel caricamento immagine' });
      };
      
      img.src = URL.createObjectURL(imageFile);
    });
  }

  /**
   * Validates if the provided image contains plant content
   */
  static async validatePlantImage(imageFile: File): Promise<PlantValidationResult> {
    try {
      // Basic file type validation
      if (!imageFile.type.startsWith('image/')) {
        throw new Error('Il file deve essere un\'immagine');
      }

      // Analyze image content for plant-like features
      const result = await this.analyzeImageColors(imageFile);
      
      return result;
    } catch (error) {
      console.error('Error validating plant image:', error);
      return {
        isPlant: true, // Default to allowing the image if validation fails
        confidence: 0.5,
        reason: 'Errore durante la validazione'
      };
    }
  }

  /**
   * Shows appropriate user feedback based on validation result
   */
  static handleValidationResult(result: PlantValidationResult): boolean {
    if (!result.isPlant && result.confidence > 0.7) {
      toast.error(
        'L\'immagine non sembra contenere piante. Per favore carica una foto di una pianta, foglie, fiori o parti vegetali.',
        { duration: 5000 }
      );
      return false;
    }
    
    if (!result.isPlant && result.confidence > 0.4) {
      toast.warning(
        'L\'immagine potrebbe non contenere piante chiaramente visibili. Per risultati migliori, usa una foto con piante ben illuminate.',
        { duration: 4000 }
      );
    }
    
    return true; // Allow the image to proceed
  }
}