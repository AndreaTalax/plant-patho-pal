
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
 * Verifica rigorosa che un'immagine contenga SOLO una pianta reale
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
      let objectPixels = 0;
      let uniformPixels = 0;
      
      // Analizza ogni pixel con criteri PIÙ RIGOROSI
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        totalPixels++;
        
        // Rileva verde naturale delle piante (CRITERI PIÙ RIGOROSI)
        const isNaturalGreen = (g > r + 15 && g > b + 15 && g > 60) || // Verde più dominante
                              (g > 80 && r < 120 && b < 120 && g > (r + b) / 1.5) || // Verde scuro naturale
                              (g > 100 && Math.abs(g - r) > 20 && Math.abs(g - b) > 20); // Verde con contrasto
        
        // Rileva marroni naturali (tronchi, terra, vasi) - più selettivo
        const isNaturalBrown = r > 80 && r < 160 && 
                              g > 60 && g < 140 && 
                              b > 30 && b < 120 && 
                              Math.abs(r - g) < 40 &&
                              (r > g && g > b); // Progressione naturale
        
        // Rileva altri colori naturali delle piante
        const isOtherNatural = (r > 120 && r < 200 && g > 100 && g < 180 && b < 90) || // Gialli/arancioni autunnali
                              (r > 80 && r < 150 && g > 60 && g < 120 && b > 40 && b < 100); // Toni terrosi
        
        // Rileva colori artificiali (MOLTO più severo)
        const isArtificial = (Math.abs(r - g) < 3 && Math.abs(g - b) < 3 && Math.abs(r - b) < 3) ||
                            (r > 240 && g > 240 && b > 240) || // Bianco puro
                            (r < 20 && g < 20 && b < 20) || // Nero puro
                            ((r > 200 || g > 200 || b > 200) && 
                             (Math.abs(r - g) > 100 || Math.abs(g - b) > 100)); // Colori troppo saturi
        
        // Rileva oggetti inorganici (metallo, plastica, vetro)
        const isObject = (r > 180 && g > 180 && b > 180 && Math.abs(r - g) < 10) || // Superfici riflettenti
                        (Math.abs(r - 128) < 20 && Math.abs(g - 128) < 20 && Math.abs(b - 128) < 20); // Grigio uniforme
        
        // Rileva uniformità eccessiva (non naturale)
        const isUniform = Math.abs(r - g) < 5 && Math.abs(g - b) < 5 && Math.abs(r - b) < 5;
        
        // Rilevamento pelle/volto più accurato
        const { y, cb, cr } = rgbToYCbCr(r, g, b);
        const skinYCbCr = cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173 && y > 80 && y < 230;
        const { h, s, v } = rgbToHsv(r, g, b);
        const skinHSV = h >= 0 && h <= 50 && s >= 0.20 && s <= 0.68 && v >= 0.35 && v <= 0.95;
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
        } else if (isObject) {
          objectPixels++;
        }
        
        if (isUniform) uniformPixels++;
      }
      
      const greenPercentage = (greenPixels / totalPixels) * 100;
      const brownPercentage = (brownPixels / totalPixels) * 100;
      const naturalPercentage = (naturalPixels / totalPixels) * 100;
      const artificialPercentage = (artificialPixels / totalPixels) * 100;
      const skinPercentage = (skinPixels / totalPixels) * 100;
      const objectPercentage = (objectPixels / totalPixels) * 100;
      const uniformPercentage = (uniformPixels / totalPixels) * 100;
      
      // Criteri MOLTO PIÙ RIGOROSI per piante reali
      const hasMinimumGreen = greenPercentage > 3; // Almeno 3% di verde naturale
      const hasNaturalColors = naturalPercentage > 15; // Almeno 15% di colori naturali
      const hasPlantIndicators = (greenPercentage + brownPercentage) > 5; // Verde + marrone > 5%
      const tooMuchArtificial = artificialPercentage > 60; // Troppo artificiale
      const tooMuchSkin = skinPercentage > 25; // Troppa pelle
      const tooMuchObject = objectPercentage > 50; // Troppi oggetti
      const tooUniform = uniformPercentage > 70; // Troppo uniforme
      
      let isPlant = false;
      let confidence = 0;
      let reason = '';
      
      if (tooMuchSkin) {
        isPlant = false;
        confidence = 0;
        reason = `Rilevata persona nell'immagine (${skinPercentage.toFixed(1)}%). Usa solo foto di piante.`;
        toast.error('❌ Immagine non valida', {
          description: 'Rilevata una persona. Carica solo foto di piante, foglie, fiori o parti vegetali.',
          duration: 6000
        });
      } else if (tooMuchArtificial || tooMuchObject) {
        isPlant = false;
        confidence = 0;
        reason = `Troppi elementi artificiali (${(artificialPercentage + objectPercentage).toFixed(1)}%). Non è una pianta.`;
        toast.error('❌ Immagine non valida', {
          description: 'L\'immagine contiene troppi oggetti artificiali. Fotografa solo piante vere.',
          duration: 6000
        });
      } else if (tooUniform) {
        isPlant = false;
        confidence = 0;
        reason = `Immagine troppo uniforme (${uniformPercentage.toFixed(1)}%). Non sembra una pianta naturale.`;
        toast.error('❌ Immagine non valida', {
          description: 'L\'immagine è troppo uniforme. Usa foto di piante reali con dettagli naturali.',
          duration: 6000
        });
      } else if (!hasMinimumGreen) {
        isPlant = false;
        confidence = Math.max(0, greenPercentage * 10);
        reason = `Verde insufficiente (${greenPercentage.toFixed(1)}%). Serve almeno 3% di verde per identificare una pianta.`;
        toast.error('🌿 Pianta non rilevata', {
          description: 'L\'immagine non contiene abbastanza verde naturale. Fotografa foglie, steli o parti verdi della pianta.',
          duration: 6000,
          action: {
            label: 'Consigli',
            onClick: () => {
              toast.info('📸 Consigli per foto migliori', {
                description: '• Inquadra foglie verdi ben visibili\n• Usa luce naturale\n• Avvicinati alla pianta\n• Evita sfondi artificiali',
                duration: 8000
              });
            }
          }
        });
      } else if (!hasNaturalColors || !hasPlantIndicators) {
        isPlant = false;
        confidence = Math.max(0, naturalPercentage * 3);
        reason = `Colori non naturali (${naturalPercentage.toFixed(1)}% naturali). Non è una pianta vera.`;
        toast.error('🌿 Pianta non identificata', {
          description: 'L\'immagine non contiene abbastanza elementi naturali tipici delle piante.',
          duration: 6000
        });
      } else {
        // Pianta identificata con successo
        isPlant = true;
        confidence = Math.min(95, (greenPercentage * 4) + (naturalPercentage * 2) + (brownPercentage * 3));
        reason = `Pianta rilevata: ${greenPercentage.toFixed(1)}% verde, ${naturalPercentage.toFixed(1)}% colori naturali`;
        
        toast.success('✅ Pianta rilevata!', {
          description: `Pianta identificata con confidenza ${confidence.toFixed(1)}%. Ottima qualità dell'immagine.`,
          duration: 4000
        });
      }
      
      console.log(`🔍 Analisi rigorosa: Verde=${greenPercentage.toFixed(1)}%, Naturale=${naturalPercentage.toFixed(1)}%, Artificiale=${artificialPercentage.toFixed(1)}%, Pelle=${skinPercentage.toFixed(1)}%`);
      console.log(`🔍 Risultato finale: isPianta=${isPlant}, confidenza=${confidence.toFixed(1)}%`);
      
      resolve({ isPlant, confidence, reason });
    };
    
    img.onerror = () => {
      resolve({ isPlant: false, confidence: 0, reason: 'Errore nel caricamento dell\'immagine' });
    };
    
    img.src = URL.createObjectURL(imageFile);
  });
};

/**
 * Analisi qualità immagine più rigorosa
 */
export const analyzeImageQuality = (imageFile: File): {
  isGoodQuality: boolean;
  issues: string[];
  recommendations: string[];
} => {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Controlla dimensioni file più rigorosamente
  if (imageFile.size < 100000) { // < 100KB
    issues.push('Immagine troppo piccola o molto compressa');
    recommendations.push('Usa un\'immagine di almeno 100KB per migliore qualità');
  }
  
  if (imageFile.size > 15000000) { // > 15MB
    issues.push('Immagine troppo grande');
    recommendations.push('Riduci le dimensioni a meno di 15MB');
  }
  
  // Controlla formato più rigorosamente
  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'].includes(imageFile.type)) {
    issues.push('Formato immagine non supportato');
    recommendations.push('Usa JPG, PNG, WebP o HEIC');
  }
  
  // Controlla nome file per escludere screenshot o immagini generate
  const fileName = imageFile.name.toLowerCase();
  if (fileName.includes('screenshot') || fileName.includes('screen') || 
      fileName.includes('generated') || fileName.includes('artificial')) {
    issues.push('Il nome file suggerisce che non sia una foto reale');
    recommendations.push('Usa foto scattate direttamente di piante vere');
  }
  
  const isGoodQuality = issues.length === 0;
  
  return { isGoodQuality, issues, recommendations };
};
