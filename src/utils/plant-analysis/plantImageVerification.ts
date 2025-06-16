
import { toast } from 'sonner';

/**
 * Verifica se un'immagine contiene effettivamente una pianta usando analisi cromatica
 */
export const verifyImageContainsPlant = async (imageFile: File): Promise<{
  isPlant: boolean;
  confidence: number;
  reason: string;
}> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Ridimensiona per analisi più veloce
      const maxSize = 400;
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      if (!imageData) {
        resolve({ isPlant: false, confidence: 0, reason: 'Impossibile analizzare l\'immagine' });
        return;
      }
      
      const pixels = imageData.data;
      let totalPixels = 0;
      let greenPixels = 0;
      let plantLikePixels = 0;
      
      // Analizza ogni pixel
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        totalPixels++;
        
        // Rileva sfumature di verde tipiche delle piante
        const isGreen = g > r && g > b && g > 50;
        const isPlantGreen = isGreen && (g - r > 20) && (g - b > 10);
        const isNaturalGreen = g > 80 && g < 200 && r < g * 0.8 && b < g * 0.9;
        
        // Rileva marroni tipici di tronchi/terra
        const isBrown = r > 80 && r < 160 && g > 60 && g < 140 && b > 40 && b < 120 && 
                       Math.abs(r - g) < 50 && Math.abs(g - b) < 50;
        
        if (isPlantGreen || isNaturalGreen) {
          greenPixels++;
          plantLikePixels++;
        } else if (isBrown) {
          plantLikePixels++;
        }
      }
      
      const greenPercentage = (greenPixels / totalPixels) * 100;
      const plantLikePercentage = (plantLikePixels / totalPixels) * 100;
      
      // Criteri per identificare una pianta
      const hasEnoughGreen = greenPercentage > 5; // Almeno 5% di verde
      const hasPlantColors = plantLikePercentage > 15; // Almeno 15% di colori naturali
      const confidence = Math.min(95, Math.max(0, greenPercentage * 2 + plantLikePercentage));
      
      let isPlant = false;
      let reason = '';
      
      if (hasEnoughGreen && hasPlantColors) {
        isPlant = true;
        reason = `Rilevato ${greenPercentage.toFixed(1)}% di verde e ${plantLikePercentage.toFixed(1)}% di colori naturali`;
      } else if (!hasEnoughGreen) {
        reason = `Troppo poco verde nell'immagine (${greenPercentage.toFixed(1)}%)`;
      } else {
        reason = `Colori non compatibili con una pianta (${plantLikePercentage.toFixed(1)}% naturali)`;
      }
      
      resolve({ isPlant, confidence, reason });
    };
    
    img.onerror = () => {
      resolve({ isPlant: false, confidence: 0, reason: 'Errore nel caricamento dell\'immagine' });
    };
    
    img.src = URL.createObjectURL(imageFile);
  });
};

/**
 * Analisi avanzata per verificare che l'immagine sia di qualità sufficiente
 */
export const analyzeImageQuality = (imageFile: File): {
  isGoodQuality: boolean;
  issues: string[];
  recommendations: string[];
} => {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Controlla dimensioni file
  if (imageFile.size < 50000) { // < 50KB
    issues.push('Immagine troppo piccola o compressa');
    recommendations.push('Usa un\'immagine di dimensioni maggiori');
  }
  
  if (imageFile.size > 10000000) { // > 10MB
    issues.push('Immagine troppo grande');
    recommendations.push('Riduci le dimensioni dell\'immagine');
  }
  
  // Controlla formato
  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(imageFile.type)) {
    issues.push('Formato immagine non supportato');
    recommendations.push('Usa JPG, PNG o WebP');
  }
  
  const isGoodQuality = issues.length === 0;
  
  return { isGoodQuality, issues, recommendations };
};
