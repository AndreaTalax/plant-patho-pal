
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
        
        // Rileva verde naturale delle piante (CRITERI PIÙ PERMISSIVI)
        const isNaturalGreen = g > r && g > b && 
                              g > 50 && g < 250 && 
                              (g - r) > 8 && (g - b) > 5 &&
                              r < 180 && b < 180;
        
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
      
      // Criteri MOLTO PIÙ REALISTICI per identificare una pianta
      const hasMinimumGreen = greenPercentage > 2; // Solo 2% di verde naturale
      const hasNaturalColors = naturalPercentage > 8; // Solo 8% di colori naturali
      const hasPlantIndicators = (greenPercentage + brownPercentage) > 3; // Verde + marrone > 3%
      const tooMuchArtificial = artificialPercentage > 80; // Solo se MOLTO artificiale
      
      let isPlant = false;
      let confidence = 0;
      let reason = '';
      
      if (tooMuchArtificial) {
        isPlant = false;
        confidence = Math.max(0, 100 - artificialPercentage);
        reason = `Troppi colori artificiali uniformi (${artificialPercentage.toFixed(1)}%). Potrebbe essere un oggetto artificiale.`;
      } else if (hasMinimumGreen && hasNaturalColors) {
        isPlant = true;
        confidence = Math.min(95, (greenPercentage * 8) + (naturalPercentage * 3) + (brownPercentage * 4));
        reason = `Rilevato ${greenPercentage.toFixed(1)}% di verde naturale, ${brownPercentage.toFixed(1)}% di marrone e ${naturalPercentage.toFixed(1)}% di colori naturali totali`;
      } else if (hasPlantIndicators && !tooMuchArtificial) {
        isPlant = true;
        confidence = Math.min(80, (greenPercentage * 10) + (brownPercentage * 8) + (naturalPercentage * 2));
        reason = `Possibile pianta: ${greenPercentage.toFixed(1)}% verde + ${brownPercentage.toFixed(1)}% marrone naturale`;
      } else if (hasNaturalColors && artificialPercentage < 50) {
        isPlant = true;
        confidence = Math.min(70, naturalPercentage * 3);
        reason = `Colori naturali rilevati (${naturalPercentage.toFixed(1)}%) compatibili con pianta`;
      } else {
        isPlant = false;
        confidence = Math.max(0, naturalPercentage * 2);
        reason = `Insufficienti colori naturali: ${greenPercentage.toFixed(1)}% verde, ${naturalPercentage.toFixed(1)}% naturali totali`;
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
