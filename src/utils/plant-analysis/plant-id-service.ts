
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Converte un file in base64 senza il prefisso del tipo di dati
export const fileToBase64WithoutPrefix = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // Rimuove il prefisso "data:image/jpeg;base64," (o simili)
      resolve(base64.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
};

// Analizza un'immagine di pianta utilizzando Google Cloud Vision API
export const analyzeWithCloudVision = async (imageFile: File): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('type', 'all'); // Richiedi tutti i tipi di analisi disponibili
    
    // Chiama l'edge function di Supabase che utilizza Google Cloud Vision
    const { data, error } = await supabase.functions.invoke('analyze-with-cloud-vision', {
      body: formData
    });
    
    if (error) {
      console.error("Errore nell'analisi con Cloud Vision:", error);
      toast.error("Errore nell'analisi dell'immagine con Cloud Vision");
      return null;
    }
    
    console.log("Risultato dell'analisi Cloud Vision:", data);
    return data;
  } catch (error) {
    console.error("Errore durante l'analisi dell'immagine con Cloud Vision:", error);
    toast.error("Errore nell'elaborazione dell'immagine");
    return null;
  }
};

// Determina il tipo di pianta in base ai risultati di Cloud Vision
export const identifyPlantTypeWithVision = (visionResults: any): string | null => {
  if (!visionResults || !visionResults.isPlant) {
    return null;
  }
  
  // Estrai etichette relative alle piante
  const plantLabels = visionResults.labels
    .filter((label: any) => label.description.toLowerCase().includes('plant') || 
             label.description.toLowerCase().includes('flower') || 
             label.description.toLowerCase().includes('tree'))
    .sort((a: any, b: any) => b.score - a.score);
  
  if (plantLabels.length > 0) {
    return plantLabels[0].description;
  } else if (visionResults.plantDetails?.type) {
    return visionResults.plantDetails.type;
  }
  
  return "Pianta generica";
};

// Determina se l'immagine contiene una malattia della pianta basandosi sui colori e sulle etichette
export const detectPlantDiseaseWithVision = (visionResults: any): { isHealthy: boolean, disease: string | null, confidence: number } => {
  if (!visionResults || !visionResults.isPlant) {
    return { isHealthy: true, disease: null, confidence: 0 };
  }
  
  // Cerca termini correlati a malattie delle piante nelle etichette
  const diseaseTerms = ['disease', 'spot', 'blight', 'mildew', 'rot', 'rust', 'yellow', 'brown', 'wilt', 'mold'];
  const diseaseLabels = visionResults.labels
    .filter((label: any) => diseaseTerms.some(term => label.description.toLowerCase().includes(term)))
    .sort((a: any, b: any) => b.score - a.score);
  
  // Controllo dei colori: le piante malate spesso hanno colori anomali
  const hasUnhealthyColors = visionResults.colors.some((color: any) => {
    const { red, green, blue } = color.color;
    // Gialli forti, marroni o colori innaturali potrebbero indicare malattie
    return (red > 200 && green > 200 && blue < 100) || // Giallo
           (red > 120 && green < 100 && blue < 100) || // Marrone-rossastro
           (red < 100 && green < 100 && blue < 100);   // Parti scure/necrotiche
  });
  
  if (diseaseLabels.length > 0) {
    return { 
      isHealthy: false, 
      disease: diseaseLabels[0].description, 
      confidence: diseaseLabels[0].score 
    };
  } else if (hasUnhealthyColors) {
    return { 
      isHealthy: false, 
      disease: 'Possibile problema di salute (basato sull\'analisi del colore)', 
      confidence: 0.65 
    };
  }
  
  return { isHealthy: true, disease: null, confidence: 0.8 };
};

// Identifica la parte della pianta mostrata nell'immagine
export const identifyPlantPartWithVision = (visionResults: any): string => {
  if (!visionResults || !visionResults.isPlant) {
    return "whole plant";
  }
  
  const partTerms = {
    'leaf': ['leaf', 'leaves', 'foliage'],
    'flower': ['flower', 'bloom', 'blossom', 'petal'],
    'fruit': ['fruit', 'berry', 'seed', 'pod'],
    'stem': ['stem', 'stalk', 'trunk'],
    'root': ['root', 'tuber', 'bulb'],
    'branch': ['branch', 'twig']
  };
  
  // Cerca nelle etichette per identificare parti specifiche della pianta
  for (const [part, terms] of Object.entries(partTerms)) {
    for (const label of visionResults.labels) {
      if (terms.some(term => label.description.toLowerCase().includes(term))) {
        return part;
      }
    }
  }
  
  // Cerca negli oggetti localizzati
  if (visionResults.objects) {
    for (const obj of visionResults.objects) {
      const objName = obj.name.toLowerCase();
      for (const [part, terms] of Object.entries(partTerms)) {
        if (terms.some(term => objName.includes(term))) {
          return part;
        }
      }
    }
  }
  
  return "whole plant"; // Default
};

// Integra i risultati di Cloud Vision con l'analisi della pianta
export const enhancePlantAnalysisWithVision = (baseAnalysis: any, visionResults: any): any => {
  if (!visionResults || !baseAnalysis) {
    return baseAnalysis;
  }
  
  // Crea una copia dell'analisi base
  const enhancedAnalysis = { ...baseAnalysis };
  
  // Integra i dati di Cloud Vision
  if (visionResults.isPlant) {
    // Aggiorna o conferma il tipo di pianta
    if (visionResults.plantDetails?.type && (!enhancedAnalysis.label || enhancedAnalysis.confidence < visionResults.plantDetails.confidence)) {
      enhancedAnalysis.label = visionResults.plantDetails.type;
      enhancedAnalysis.plantName = visionResults.plantDetails.type;
      enhancedAnalysis.confidence = visionResults.plantDetails.confidence;
    }
    
    // Determina la parte della pianta
    if (!enhancedAnalysis.plantPart) {
      enhancedAnalysis.plantPart = identifyPlantPartWithVision(visionResults);
    }
    
    // Valuta lo stato di salute della pianta
    const healthAssessment = detectPlantDiseaseWithVision(visionResults);
    if (!enhancedAnalysis.healthy || enhancedAnalysis.healthy === undefined) {
      enhancedAnalysis.healthy = healthAssessment.isHealthy;
      if (!healthAssessment.isHealthy && healthAssessment.disease) {
        enhancedAnalysis.disease = {
          name: healthAssessment.disease,
          confidence: healthAssessment.confidence
        };
      }
    }
    
    // Aggiungi etichette aggiuntive
    enhancedAnalysis.additionalLabels = visionResults.labels;
    
    // Aggiungi informazioni sui colori
    enhancedAnalysis.colorProfile = visionResults.colors;
    
    // Aggiungi riferimenti web
    if (visionResults.webEntities && visionResults.webEntities.length > 0) {
      enhancedAnalysis.webReferences = visionResults.webEntities;
    }
    
    // Aggiungi dati grezzi per debugging
    enhancedAnalysis._rawData = {
      ...enhancedAnalysis._rawData,
      cloudVision: visionResults.rawData
    };
  }
  
  return enhancedAnalysis;
};
