
// Versione migliorata della funzione checkForEppoConcerns per gestire in modo sicuro valori non stringa.
// Utilizza una struttura di risposta standardizzata con tutti i campi necessari.

export function checkForEppoConcerns(labelOrData: any): any {
  // Se è un ArrayBuffer (dall'altra versione sovraccaricata), restituisci semplicemente un risultato predefinito
  if (labelOrData instanceof ArrayBuffer) {
    return {
      isEppoConcern: false,
      concernName: null,
      eppoCode: null,
      concernType: null,
      regulatoryStatus: null
    };
  }
  
  // Assicurati che stiamo lavorando con una stringa
  const label = typeof labelOrData === 'string' ? labelOrData : 
                (labelOrData?.label && typeof labelOrData.label === 'string') ? 
                labelOrData.label : '';
  
  // Ora possiamo usare toLowerCase() in modo sicuro poiché abbiamo garantito che label sia una stringa
  const lowerLabel = label.toLowerCase();
  
  const eppoRegulatedKeywords = [
    { keywords: ["xylella", "fastidiosa"], name: "Xylella fastidiosa", code: "XYLEFA", type: "Bacteria", regulatoryStatus: "Quarantine" },
    { keywords: ["fire", "blight", "erwinia", "amylovora"], name: "Erwinia amylovora (Fire Blight)", code: "ERWIAM", type: "Bacteria", regulatoryStatus: "Regulated" },
    { keywords: ["potato", "cyst", "nematode", "globodera"], name: "Globodera (Potato Cyst Nematode)", code: "HETDSP", type: "Nematode", regulatoryStatus: "Quarantine" },
    { keywords: ["asian", "longhorn", "beetle", "anoplophora"], name: "Anoplophora glabripennis (Asian Longhorn Beetle)", code: "ANOLGL", type: "Insect", regulatoryStatus: "Quarantine" },
    { keywords: ["pine", "wood", "nematode", "bursaphelenchus"], name: "Bursaphelenchus xylophilus (Pine Wood Nematode)", code: "BURSXY", type: "Nematode", regulatoryStatus: "Quarantine" },
    { keywords: ["citrus", "greening", "huanglongbing"], name: "Candidatus Liberibacter asiaticus (Citrus Greening)", code: "LIBEAS", type: "Bacteria", regulatoryStatus: "Quarantine" },
    { keywords: ["brown", "marmorated", "stink", "bug", "halyomorpha"], name: "Halyomorpha halys (Brown Marmorated Stink Bug)", code: "HALYHA", type: "Insect", regulatoryStatus: "Regulated" },
    { keywords: ["fusarium", "wilt", "tropical", "race", "4"], name: "Fusarium oxysporum f.sp. cubense Tropical Race 4", code: "FUSOCB", type: "Fungi", regulatoryStatus: "Quarantine" }
  ];
  
  for (const entry of eppoRegulatedKeywords) {
    if (entry.keywords.some(keyword => lowerLabel.includes(keyword))) {
      return {
        isEppoConcern: true,
        concernName: entry.name,
        eppoCode: entry.code,
        concernType: entry.type,
        regulatoryStatus: entry.regulatoryStatus
      };
    }
  }
  
  return {
    isEppoConcern: false,
    concernName: null,
    eppoCode: null,
    concernType: null,
    regulatoryStatus: null
  };
}

// Aggiungiamo una nuova funzione per normalizzare i risultati di analisi delle piante
export function normalizeAnalysisResults(
  modelResult: any,
  plantIdResult: any,
  floraIncognitaResult: any,
  plantSnapResult: any,
  eppoCheck: any,
  isLeaf: boolean
): any {
  // Inizializza la risposta normalizzata con campi obbligatori
  let normalizedResponse = {
    label: "Pianta non identificata",
    plantPart: "unknown",
    healthy: true,
    disease: null,
    score: 0,
    eppoRegulatedConcern: null,
    dataSource: "Aggregazione dati",
    confidence: 0
  };
  
  // Determina il punteggio di confidenza più alto tra tutte le fonti
  const modelScore = modelResult?.score || 0;
  const plantIdScore = plantIdResult?.confidence || 0;
  const floraScore = floraIncognitaResult?.score || 0;
  const snapScore = plantSnapResult?.score || 0;
  
  // Seleziona la fonte con maggiore confidenza
  let bestSource = null;
  let bestScore = 0;
  
  if (plantIdScore > bestScore) {
    bestScore = plantIdScore;
    bestSource = "Plant.id";
  }
  
  if (floraScore > bestScore) {
    bestScore = floraScore;
    bestSource = "Flora Incognita";
  }
  
  if (snapScore > bestScore) {
    bestScore = snapScore;
    bestSource = "PlantSnap";
  }
  
  if (modelScore > bestScore) {
    bestScore = modelScore;
    bestSource = "AI Models";
  }
  
  // Se non abbiamo trovato nessuna fonte affidabile, il risultato rimane quello predefinito
  if (bestScore < 0.3) {
    // Fallback locale con euristica di base
    normalizedResponse.label = "Pianta non identificabile con confidenza";
    normalizedResponse.score = 0.3;
    normalizedResponse.confidence = 0.3;
    normalizedResponse.dataSource = "Analisi euristica di fallback";
    return normalizedResponse;
  }
  
  // Aggiorniamo la risposta con i dati della migliore fonte
  switch (bestSource) {
    case "Plant.id":
      normalizedResponse.label = plantIdResult.plantName || "Pianta";
      normalizedResponse.score = plantIdScore;
      normalizedResponse.confidence = plantIdScore;
      normalizedResponse.dataSource = "Plant.id API";
      normalizedResponse.healthy = plantIdResult.isHealthy !== undefined ? plantIdResult.isHealthy : true;
      normalizedResponse.plantPart = isLeaf ? "leaf" : (plantIdResult.plantPart || "whole plant");
      
      // Se non è sana, aggiungiamo le informazioni sulla malattia
      if (!normalizedResponse.healthy && plantIdResult.diseases && plantIdResult.diseases.length > 0) {
        const bestDisease = plantIdResult.diseases[0];
        normalizedResponse.disease = {
          name: bestDisease.name,
          confidence: bestDisease.probability || 0.7,
          description: bestDisease.description || "",
          treatment: bestDisease.treatment || {}
        };
      }
      break;
      
    case "Flora Incognita":
      normalizedResponse.label = floraIncognitaResult.species || "Pianta";
      normalizedResponse.score = floraScore;
      normalizedResponse.confidence = floraScore;
      normalizedResponse.dataSource = "Flora Incognita";
      normalizedResponse.plantPart = isLeaf ? "leaf" : "whole plant";
      break;
      
    case "PlantSnap":
      normalizedResponse.label = plantSnapResult.species || "Pianta";
      normalizedResponse.score = snapScore;
      normalizedResponse.confidence = snapScore;
      normalizedResponse.dataSource = "PlantSnap";
      normalizedResponse.plantPart = isLeaf ? "leaf" : "whole plant";
      break;
      
    case "AI Models":
      normalizedResponse.label = modelResult.label || "Pianta";
      normalizedResponse.score = modelScore;
      normalizedResponse.confidence = modelScore;
      normalizedResponse.dataSource = "AI Models";
      normalizedResponse.plantPart = isLeaf ? "leaf" : (modelResult.plantPart || "whole plant");
      normalizedResponse.healthy = modelResult.healthy !== undefined ? modelResult.healthy : true;
      break;
  }
  
  // Verifica preoccupazioni EPPO
  if (eppoCheck && eppoCheck.isEppoConcern) {
    normalizedResponse.eppoRegulatedConcern = {
      name: eppoCheck.concernName,
      code: eppoCheck.eppoCode,
      type: eppoCheck.concernType,
      regulatoryStatus: eppoCheck.regulatoryStatus
    };
    
    // Se c'è una preoccupazione EPPO, lo consideriamo unhealthy e aggiungiamo info sulla malattia
    normalizedResponse.healthy = false;
    if (!normalizedResponse.disease) {
      normalizedResponse.disease = {
        name: eppoCheck.concernName,
        confidence: 0.9,
        description: `Organismo regolamentato EPPO: ${eppoCheck.concernName} (${eppoCheck.eppoCode})`,
        treatment: {
          biological: ["Consultare immediatamente le autorità fitosanitarie locali"],
          chemical: ["Non applicare trattamenti senza consultare le autorità"],
          prevention: ["Isolamento della pianta", "Segnalazione alle autorità"]
        }
      };
    }
  }
  
  return normalizedResponse;
}
