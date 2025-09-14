
import { toast } from 'sonner';

// Color space helpers for skin detection
const rgbToYCbCr = (r: number, g: number, b: number) => {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return { y, cb, cr };
};

const rgbToHsv = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h /= 6;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h: h * 360, s, v };
};

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
      let skinPixels = 0;
      
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

        // Rilevamento pelle/volto con YCbCr e HSV (blocca foto di persone)
        const { y, cb, cr } = rgbToYCbCr(r, g, b);
        const skinYCbCr = cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173 && y > 60 && y < 245;
        const { h, s, v } = rgbToHsv(r, g, b);
        const skinHSV = h >= 0 && h <= 50 && s >= 0.23 && v >= 0.35 && v <= 0.98;
        const isSkin = skinYCbCr || skinHSV;
        if (isSkin) skinPixels++;
        
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
      const skinPercentage = (skinPixels / totalPixels) * 100;
      
      // Criteri RIGOROSI per identificare una pianta reale
      const hasMinimumGreen = greenPercentage > 5; // Almeno 5% di verde naturale
      const hasNaturalColors = naturalPercentage > 15; // Almeno 15% di colori naturali
      const hasPlantIndicators = (greenPercentage + brownPercentage) > 8; // Verde + marrone > 8%
      const tooMuchArtificial = artificialPercentage > 60; // Troppo artificiale se > 60%
      const tooMuchSkin = skinPercentage > 25 || (skinPercentage > 15 && greenPercentage < 8);
      const hasSignificantGreen = greenPercentage > 10; // Verde significativo
      
      let isPlant = false;
      let confidence = 0;
      let reason = '';
      
      if (tooMuchSkin) {
        isPlant = false;
        confidence = Math.max(0, 100 - skinPercentage);
        reason = `Rilevata pelle/volto nell'immagine (${skinPercentage.toFixed(1)}%). Carica solo foto di piante.`;
        toast.error('Immagine non valida', {
          description: 'Rilevata una persona nell\'immagine. Per privacy e accuratezza, usa solo foto di piante ben visibili.',
          duration: 5000
        });
      } else if (tooMuchArtificial) {
        isPlant = false;
        confidence = Math.max(0, 100 - artificialPercentage);
        reason = `Troppi colori artificiali uniformi (${artificialPercentage.toFixed(1)}%). Non sembra una pianta reale.`;
        toast.error('Immagine non valida', {
          description: reason,
          duration: 4000
        });
      } else if (hasMinimumGreen && hasNaturalColors && hasPlantIndicators && hasSignificantGreen) {
        isPlant = true;
        confidence = Math.min(95, (greenPercentage * 4) + (naturalPercentage * 1.5) + (brownPercentage * 2));
        reason = `Pianta rilevata: ${greenPercentage.toFixed(1)}% verde naturale, ${naturalPercentage.toFixed(1)}% colori naturali totali`;
      } else if (!hasMinimumGreen) {
        isPlant = false;
        confidence = Math.max(0, greenPercentage * 8);
        reason = `Verde insufficiente (${greenPercentage.toFixed(1)}%). Serve almeno 5% di verde naturale per identificare una pianta.`;
        toast.error('Pianta non rilevata', {
          description: 'L\'immagine non contiene abbastanza verde naturale. Assicurati che la pianta sia ben visibile e abbia foglie verdi.',
          duration: 5000
        });
      } else if (!hasSignificantGreen) {
        isPlant = false;
        confidence = Math.max(0, greenPercentage * 6);
        reason = `Verde insufficiente (${greenPercentage.toFixed(1)}%). Serve almeno 10% di verde significativo per una diagnosi accurata.`;
        toast.error('Verde insufficiente', {
          description: 'L\'immagine deve mostrare chiaramente le parti verdi della pianta (foglie, steli).',
          duration: 5000
        });
      } else if (!hasNaturalColors) {
        isPlant = false;
        confidence = Math.max(0, naturalPercentage * 3);
        reason = `Colori naturali insufficienti (${naturalPercentage.toFixed(1)}%). Serve almeno 15% di colori naturali.`;
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
