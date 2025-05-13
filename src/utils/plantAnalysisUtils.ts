
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Interfaccia per il risultato dell'analisi
export interface PlantAnalysisResult {
  label: string;
  score: number;
  allPredictions?: Array<{
    label: string;
    score: number;
  }>;
  timestamp?: string;
  message?: string;
}

/**
 * Analizza un'immagine di pianta utilizzando il modello HuggingFace attraverso la Edge Function di Supabase
 * @param imageFile File dell'immagine da analizzare
 * @returns Promise con il risultato dell'analisi
 */
export const analyzePlantImage = async (imageFile: File): Promise<PlantAnalysisResult> => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const { data, error } = await supabase.functions.invoke('analyze-plant', {
      body: formData,
    });

    if (error) {
      console.error('Error analyzing plant:', error);
      toast.error('Errore durante l\'analisi dell\'immagine. Riprova più tardi.');
      throw new Error(error.message);
    }

    if (!data || (!data.label && !data.score)) {
      toast.error('Risultato dell\'analisi non valido. Riprova con un\'immagine più chiara.');
      throw new Error('Invalid analysis result');
    }

    // Trasformiamo l'etichetta da snake_case o underscore a formato leggibile
    const readableLabel = data.label
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

    if (data.message?.includes("salvata")) {
      toast.success(data.message);
    }

    return {
      ...data,
      label: readableLabel
    };
  } catch (e) {
    console.error('Errore durante l\'analisi dell\'immagine:', e);
    toast.error('Impossibile analizzare l\'immagine. Verifica la tua connessione.');
    throw e;
  }
};

// Funzione per ottenere informazioni dettagliate su una malattia specifica
export const getDiseaseMockInfo = (diseaseLabel: string): any => {
  // Mock di informazioni sulle malattie comuni
  const diseaseDatabase: Record<string, any> = {
    'Early Blight': {
      scientificName: 'Alternaria solani',
      description: 'Una malattia fungina che colpisce principalmente pomodori e patate, causando macchie scure circolari con anelli concentrici sulle foglie più vecchie.',
      causes: 'Causata dal fungo Alternaria solani, favorita da temperature calde (24-29°C) e condizioni di umidità alternata.',
      treatments: [
        'Rimuovere e distruggere le foglie infette',
        'Evitare di bagnare le foglie durante l\'irrigazione',
        'Applicare fungicidi a base di rame o prodotti biologici',
        'Garantire una buona circolazione dell\'aria tra le piante'
      ],
      prevention: 'Rotazione delle colture, pacciamatura, irrigazione alla base della pianta.'
    },
    'Late Blight': {
      scientificName: 'Phytophthora infestans',
      description: 'Malattia grave che colpisce pomodori e patate, con rapida diffusione in condizioni umide e fresche.',
      causes: 'Causata dall\'oomicete Phytophthora infestans, si sviluppa rapidamente con temperature moderate (15-21°C) e elevata umidità.',
      treatments: [
        'Rimuovere immediatamente le piante infette',
        'Applicare fungicidi preventivi a base di rame',
        'Evitare l\'irrigazione dall\'alto',
        'Migliorare il drenaggio del terreno'
      ],
      prevention: 'Utilizzare varietà resistenti, mantenere spazi adeguati tra le piante, monitorare regolarmente.'
    },
    'Healthy': {
      description: 'La pianta appare sana senza segni evidenti di malattie o infestazioni.',
      maintenance: [
        'Continuare con le normali pratiche di cura',
        'Monitorare regolarmente per eventuali cambiamenti',
        'Mantenere un regime di irrigazione adeguato',
        'Fornire nutrienti secondo le necessità della pianta'
      ]
    },
    'Powdery Mildew': {
      scientificName: 'Diverse specie di funghi',
      description: 'Infezione fungina che appare come una patina bianca polverosa su foglie, steli e talvolta frutti.',
      causes: 'Causata da varie specie di funghi, prospera in ambienti con alta umidità ma foglie asciutte.',
      treatments: [
        'Rimuovere e smaltire le foglie colpite',
        'Migliorare la circolazione dell\'aria intorno alle piante',
        'Applicare fungicidi contenenti zolfo o bicarbonato di potassio',
        'Utilizzare olio di neem come alternativa biologica'
      ],
      prevention: 'Distanziamento adeguato delle piante, irrigazione mattutina, varietà resistenti.'
    }
  };

  // Ricerca per corrispondenza parziale se non troviamo una corrispondenza esatta
  const exactMatch = diseaseDatabase[diseaseLabel];
  if (exactMatch) {
    return exactMatch;
  }

  // Cerca corrispondenze parziali
  const lowerLabel = diseaseLabel.toLowerCase();
  for (const [key, value] of Object.entries(diseaseDatabase)) {
    if (lowerLabel.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerLabel)) {
      return value;
    }
  }

  // Fallback per malattie non riconosciute
  return {
    description: `Possibile malattia identificata: ${diseaseLabel}. Considera di consultare un esperto per una diagnosi più accurata.`,
    treatments: [
      'Monitorare attentamente la diffusione dei sintomi',
      'Isolare le piante potenzialmente infette',
      'Fotografare i sintomi per consultazione specialistica',
      'Evitare di utilizzare acqua contaminata per l\'irrigazione'
    ],
    prevention: 'Mantenere buone pratiche generali di coltivazione e monitorare regolarmente la salute delle piante.'
  };
};
