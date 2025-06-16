
import { toast } from 'sonner';

/**
 * Verifica RIGOROSA se un'immagine contiene effettivamente una pianta
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
      let naturalPixels = 0;
      let artificialPixels = 0;
      
      // Analizza ogni pixel con criteri più rigorosi
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        totalPixels++;
        
        // Rileva verde naturale delle piante (più specifico)
        const isNaturalGreen = g > r && g > b && 
                              g > 70 && g < 220 && 
                              (g - r) > 15 && (g - b) > 10 &&
                              r < 150 && b < 150;
        
        // Rileva marroni naturali (tronchi, terra)
        const isNaturalBrown = r > 80 && r < 160 && 
                              g > 60 && g < 140 && 
                              b > 40 && b < 120 && 
                              Math.abs(r - g) < 40;
        
        // Rileva colori artificiali (come tasti di tastiera)
        const isArtificial = (r === g && g === b) || // Grigi
                            (Math.abs(r - g) < 10 && Math.abs(g - b) < 10) || // Colori uniformi
                            (r > 200 && g > 200 && b > 200) || // Bianchi
                            (r < 50 && g < 50 && b < 50); // Neri
        
        if (isNaturalGreen) {
          greenPixels++;
          naturalPixels++;
        } else if (isNaturalBrown) {
          naturalPixels++;
        } else if (isArtificial) {
          artificialPixels++;
        }
      }
      
      const greenPercentage = (greenPixels / totalPixels) * 100;
      const naturalPercentage = (naturalPixels / totalPixels) * 100;
      const artificialPercentage = (artificialPixels / totalPixels) * 100;
      
      // Criteri MOLTO PIÙ RIGOROSI per identificare una pianta
      const hasEnoughGreen = greenPercentage > 8; // Almeno 8% di verde naturale
      const hasNaturalColors = naturalPercentage > 20; // Almeno 20% di colori naturali
      const tooMuchArtificial = artificialPercentage > 60; // Troppi colori artificiali
      
      let isPlant = false;
      let confidence = 0;
      let reason = '';
      
      if (tooMuchArtificial) {
        isPlant = false;
        confidence = Math.max(0, 100 - artificialPercentage);
        reason = `Troppi colori artificiali rilevati (${artificialPercentage.toFixed(1)}%). Sembra un oggetto artificiale, non una pianta.`;
      } else if (hasEnoughGreen && hasNaturalColors) {
        isPlant = true;
        confidence = Math.min(95, (greenPercentage * 3) + (naturalPercentage * 2) - (artificialPercentage));
        reason = `Rilevato ${greenPercentage.toFixed(1)}% di verde naturale e ${naturalPercentage.toFixed(1)}% di colori naturali`;
      } else if (!hasEnoughGreen) {
        isPlant = false;
        confidence = Math.max(0, greenPercentage * 5);
        reason = `Troppo poco verde naturale nell'immagine (${greenPercentage.toFixed(1)}%). Non sembra una pianta.`;
      } else {
        isPlant = false;
        confidence = Math.max(0, naturalPercentage * 2);
        reason = `Colori non compatibili con una pianta viva (${naturalPercentage.toFixed(1)}% naturali)`;
      }
      
      console.log(`🔍 Analisi immagine: Verde=${greenPercentage.toFixed(1)}%, Naturale=${naturalPercentage.toFixed(1)}%, Artificiale=${artificialPercentage.toFixed(1)}%`);
      console.log(`🔍 Risultato: isPianta=${isPlant}, confidenza=${confidence.toFixed(1)}%`);
      
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
