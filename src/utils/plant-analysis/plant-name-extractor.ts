import { plantSpeciesMap } from '../../data/plantDatabase';

interface Disease {
  name: string;
  confidence: number;
  symptoms: string[];
  treatments: string[];
  cause: string;
  source: string;
}

interface PlantFallback {
  name: string;
  scientificName: string;
  family?: string;
  confidence: number;
  source: string;
}

interface VisualFeatures {
  hasLargeLeaves: boolean;
  hasFlowers: boolean;
  seemsSucculent: boolean;
  leafColor: string;
  plantType: 'houseplant' | 'herb' | 'vegetable' | 'flower' | 'tree' | 'succulent' | 'unknown';
  leafShape?: 'ovale' | 'lanceolata' | 'dentata' | 'rotonda';
  texture?: 'liscia' | 'rugosa' | 'pelosa' | 'cerosa';
}

/**
 * Estrae il nome della pianta da un'etichetta di classificazione
 */
export const extractPlantName = (label: string, plantDatabase?: any): string => {
  if (!label || typeof label !== 'string') return 'Pianta';
  
  const cleanLabel = label.toLowerCase().trim();
  
  // Mapping diretto per etichette comuni
  const labelMap: Record<string, string> = {
    'houseplant': 'Pianta da interno',
    'succulent': 'Pianta grassa',
    'flowering plant': 'Pianta fiorita',
    'herb': 'Erba aromatica',
    'vegetable': 'Ortaggio',
    'tree': 'Albero',
    'shrub': 'Arbusto',
    'fern': 'Felce',
    'cactus': 'Cactus',
    'bamboo': 'Bambù'
  };
  
  if (labelMap[cleanLabel]) {
    return labelMap[cleanLabel];
  }
  
  // Cerca corrispondenze parziali
  for (const [key, value] of Object.entries(labelMap)) {
    if (cleanLabel.includes(key)) {
      return value;
    }
  }
  
  // Capitalizza la prima lettera
  return label.charAt(0).toUpperCase() + label.slice(1);
};

/**
 * Determina il tipo di pianta dal nome
 */
export const detectPlantType = (plantName: string | null): string | null => {
  if (!plantName) return null;
  
  const name = plantName.toLowerCase();
  
  if (['monstera', 'pothos', 'philodendron', 'sansevieria', 'spathiphyllum'].some(p => name.includes(p))) {
    return 'houseplant';
  }
  if (['basilico', 'rosmarino', 'prezzemolo', 'menta'].some(p => name.includes(p))) {
    return 'herb';
  }
  if (['pomodoro', 'lattuga', 'spinaci', 'carota'].some(p => name.includes(p))) {
    return 'vegetable';
  }
  if (['rosa', 'tulipano', 'girasole', 'orchidea'].some(p => name.includes(p))) {
    return 'flower';
  }
  if (['aloe', 'echeveria', 'cactus', 'jade'].some(p => name.includes(p))) {
    return 'succulent';
  }
  
  return 'unknown';
};

/**
 * Fallback intelligente avanzato
 * Genera suggerimenti di piante e malattie basati sulle caratteristiche visive
 */
export function generateSuperIntelligentFallback(
  visualFeatures: VisualFeatures,
  observations?: string
): { plants: PlantFallback[]; diseases: Disease[]; message: string } {

  const plants: PlantFallback[] = [];
  const diseases: Disease[] = [];
  let message = "Non sono riuscito a identificare con certezza la pianta. Ecco i suggerimenti più probabili:";

  // Database semplificato di malattie comuni e problemi visivi
  const plantDiseasesMap: Record<string, Disease[]> = {
    tomato: [
      { name: 'Peronospora (Late Blight)', confidence: 60, symptoms: ['Macchie scure su foglie e frutti'], treatments: ['Fungicidi specifici', 'Rimuovere piante infette'], cause: 'Phytophthora infestans', source: 'Database Malattie' },
      { name: 'Septoria Leaf Spot', confidence: 55, symptoms: ['Macchie circolari sulle foglie'], treatments: ['Fungicidi', 'Rimuovere foglie infette'], cause: 'Septoria lycopersici', source: 'Database Malattie' }
    ],
    potato: [
      { name: 'Early Blight', confidence: 60, symptoms: ['Macchie concentriche sulle foglie'], treatments: ['Fungicidi', 'Rotazione colture'], cause: 'Alternaria solani', source: 'Database Malattie' },
      { name: 'Late Blight', confidence: 65, symptoms: ['Macchie scure sulle foglie e tuberi'], treatments: ['Fungicidi', 'Rimuovere piante infette'], cause: 'Phytophthora infestans', source: 'Database Malattie' }
    ],
    apple: [
      { name: 'Apple Scab', confidence: 60, symptoms: ['Macchie scure su foglie e frutti'], treatments: ['Fungicidi', 'Potatura corretta'], cause: 'Venturia inaequalis', source: 'Database Malattie' },
      { name: 'Fire Blight', confidence: 55, symptoms: ['Rami e fiori anneriti', 'Siringa batterica'], treatments: ['Potatura e disinfezione strumenti'], cause: 'Erwinia amylovora', source: 'Database Malattie' }
    ],
    basil: [
      { name: 'Downy Mildew', confidence: 60, symptoms: ['Macchie gialle e muffa grigia sotto le foglie'], treatments: ['Rimuovere foglie infette', 'Fungicidi specifici'], cause: 'Peronospora belbahrii', source: 'Database Malattie' }
    ],
    rose: [
      { name: 'Black Spot', confidence: 60, symptoms: ['Macchie nere su foglie'], treatments: ['Rimuovere foglie infette', 'Fungicidi'], cause: 'Diplocarpon rosae', source: 'Database Malattie' },
      { name: 'Powdery Mildew', confidence: 55, symptoms: ['Polvere bianca su foglie'], treatments: ['Rimuovere foglie infette', 'Fungicidi'], cause: 'Sphaerotheca pannosa', source: 'Database Malattie' }
    ]
  };

  // Problemi visivi comuni
  const visualProblems: Disease[] = [];
  if (visualFeatures.leafColor !== 'verde') {
    visualProblems.push({
      name: 'Clorosi fogliare',
      confidence: 50,
      symptoms: [`Foglie ${visualFeatures.leafColor}`],
      treatments: ['Controllare acqua e luce', 'Fertilizzante bilanciato'],
      cause: 'Stress ambientale o carenza nutrizionale',
      source: 'Analisi Visiva'
    });
  }

  // Cicla tutte le piante del database
  Object.entries(plantSpeciesMap).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    let matchScore = 50; // base score

    // Aumenta la probabilità se le caratteristiche corrispondono
    if (visualFeatures.hasLargeLeaves && ['monstera', 'ficus', 'philodendron', 'pothos', 'rubber plant'].some(p => lowerKey.includes(p))) matchScore += 20;
    if (visualFeatures.seemsSucculent && ['aloe', 'echeveria', 'jade', 'cactus', 'succulent'].some(p => lowerKey.includes(p))) matchScore += 20;
    if (visualFeatures.hasFlowers && ['rose', 'tulip', 'lily', 'orchid', 'geranium'].some(p => lowerKey.includes(p))) matchScore += 15;
    if (visualFeatures.plantType && lowerKey.includes(visualFeatures.plantType)) matchScore += 10;
    if (visualFeatures.leafShape && value.toLowerCase().includes(visualFeatures.leafShape)) matchScore += 5;
    if (visualFeatures.texture && value.toLowerCase().includes(visualFeatures.texture)) matchScore += 5;

    if (matchScore > 90) matchScore = 90;

    let scientificName = '';
    if (typeof value === 'string') {
      const match = value.match(/\((.*?)\)/);
      scientificName = match ? match[1] : '';
    }

    plants.push({
      name: key.replace(/_/g, ' '),
      scientificName,
      family: '', // opzionale
      confidence: matchScore,
      source: 'Fallback Super Intelligente'
    });

    // Aggiungi malattie se presenti
    if (plantDiseasesMap[lowerKey]) {
      plantDiseasesMap[lowerKey].forEach(d => diseases.push(d));
    }
  });

  // Unisci i problemi visivi generali
  diseases.push(...visualProblems);

  // Ordina le piante per confidenza
  plants.sort((a, b) => b.confidence - a.confidence);

  return { plants, diseases, message };
}
