
import { toast } from 'sonner';

/**
 * Verifica se un'immagine contiene effettivamente una pianta con criteri più realistici
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
      let brownPixels = 0;
      
      // Analizza ogni pixel con criteri più realistici
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        totalPixels++;
        
        // Rileva verde naturale delle piante (CRITERI PIÙ FLESSIBILI)
        const isNaturalGreen = (g > r && g > b && g > 50) || // Verde classico
                              (g > 40 && r < 100 && b < 100 && g > (r + b) / 2) || // Verde scuro
                              (g > 60 && Math.abs(g - r) > 10 && Math.abs(g - b) > 10); // Verde variegate
        
        // Rileva marroni naturali (tronchi, terra, vasi)
        const isNaturalBrown = r > 60 && r < 180 && 
                              g > 40 && g < 160 && 
                              b > 20 && b < 140 && 
                              Math.abs(r - g) < 60;
        
        // Rileva altri colori naturali (foglie secche, fiori)
        const isOtherNatural = (r > 100 && r < 200 && g > 80 && g < 180 && b < 100) || // Gialli/arancioni
                              (r > 150 && g < 100 && b < 100) || // Rossi naturali
                              (r > 80 && g > 80 && b < 80); // Verdi scuri
        
        // Rileva colori artificiali SOLO se molto uniformi
        const isArtificial = (Math.abs(r - g) < 5 && Math.abs(g - b) < 5 && Math.abs(r - b) < 5) && // Molto uniformi
                            ((r > 220 && g > 220 && b > 220) || // Bianchi puri
                             (r < 30 && g < 30 && b < 30)); // Neri puri
        
        if (isNaturalGreen) {
          greenPixels++;
          naturalPixels++;
        } else if (isNaturalBrown) {
          brownPixels++;
          naturalPixels++;
        } else if (isOtherNatural) {
          naturalPixels++;
        } else if (isArtificial) {
          artificialPixels++;
        }
      }
      
      const greenPercentage = (greenPixels / totalPixels) * 100;
      const brownPercentage = (brownPixels / totalPixels) * 100;
      const naturalPercentage = (naturalPixels / totalPixels) * 100;
      const artificialPercentage = (artificialPixels / totalPixels) * 100;
      
      // Criteri FLESSIBILI per identificare una pianta reale
      const hasMinimumGreen = greenPercentage > 1; // Almeno 1% di verde naturale
      const hasNaturalColors = naturalPercentage > 8; // Almeno 8% di colori naturali
      const hasPlantIndicators = (greenPercentage + brownPercentage) > 3; // Verde + marrone > 3%
      const tooMuchArtificial = artificialPercentage > 80; // Troppo artificiale se > 80%
      
      let isPlant = false;
      let confidence = 0;
      let reason = '';
      
      if (tooMuchArtificial) {
        isPlant = false;
        confidence = Math.max(0, 100 - artificialPercentage);
        reason = `Troppi colori artificiali uniformi (${artificialPercentage.toFixed(1)}%). Non sembra una pianta reale.`;
        toast.error('Immagine non valida', {
          description: reason,
          duration: 4000
        });
      } else if (hasMinimumGreen && hasNaturalColors && hasPlantIndicators) {
        isPlant = true;
        confidence = Math.min(95, (greenPercentage * 6) + (naturalPercentage * 2) + (brownPercentage * 3));
        reason = `Pianta rilevata: ${greenPercentage.toFixed(1)}% verde naturale, ${naturalPercentage.toFixed(1)}% colori naturali totali`;
      } else if (!hasMinimumGreen) {
        isPlant = false;
        confidence = Math.max(0, greenPercentage * 10);
        reason = `Verde insufficiente (${greenPercentage.toFixed(1)}%). Serve almeno 1% di verde naturale per identificare una pianta.`;
        toast.error('Pianta non rilevata', {
          description: 'L\'immagine non contiene abbastanza verde naturale. Assicurati che la pianta sia ben visibile.',
          duration: 5000
        });
      } else if (!hasNaturalColors) {
        isPlant = false;
        confidence = Math.max(0, naturalPercentage * 4);
        reason = `Colori naturali insufficienti (${naturalPercentage.toFixed(1)}%). Serve almeno 8% di colori naturali.`;
        toast.error('Immagine non naturale', {
          description: 'L\'immagine non contiene abbastanza colori naturali tipici delle piante.',
          duration: 5000
        });
      } else {
        isPlant = false;
        confidence = Math.max(0, naturalPercentage * 2);
        reason = `Criteri insufficienti: verde=${greenPercentage.toFixed(1)}%, naturali=${naturalPercentage.toFixed(1)}%`;
        toast.error('Pianta non identificata', {
          description: 'Non riesco a identificare chiaramente una pianta in questa immagine.',
          duration: 4000
        });
      }
      
      console.log(`🔍 Analisi immagine: Verde=${greenPercentage.toFixed(1)}%, Marrone=${brownPercentage.toFixed(1)}%, Naturale=${naturalPercentage.toFixed(1)}%, Artificiale=${artificialPercentage.toFixed(1)}%`);
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
