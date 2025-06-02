import { analyzePlantImage } from './plantAnalysisUtils';
import { handleAnalysisError, createFallbackDiagnosisResult } from './errorHandling';

// Aggiungi questa funzione per verificare i servizi AI
const checkAIServicesAvailability = async (): Promise<{
  available: boolean;
  workingServices: string[];
  failedServices: string[];
}> => {
  const services = [
    { name: 'PictureThis Detection', check: () => checkPictureThisAPI() },
    { name: 'PlantNet Verify', check: () => checkPlantNetAPI() },
    { name: 'EPPO Database', check: () => checkEPPOAPI() },
    { name: 'HuggingFace Model', check: () => checkHuggingFaceAPI() }
  ];

  const workingServices: string[] = [];
  const failedServices: string[] = [];

  for (const service of services) {
    try {
      const isWorking = await service.check();
      if (isWorking) {
        workingServices.push(service.name);
      } else {
        failedServices.push(service.name);
      }
    } catch (error) {
      console.error(`Service ${service.name} failed:`, error);
      failedServices.push(service.name);
    }
  }

  return {
    available: workingServices.length > 0,
    workingServices,
    failedServices
  };
};

// Funzioni helper per verificare ogni servizio
const checkPictureThisAPI = async (): Promise<boolean> => {
  try {
    // Implementa la verifica specifica per PictureThis
    // Esempio: chiamata di test all'API
    return true; // Placeholder
  } catch {
    return false;
  }
};

const checkPlantNetAPI = async (): Promise<boolean> => {
  try {
    // Implementa la verifica specifica per PlantNet
    return true; // Placeholder
  } catch {
    return false;
  }
};

const checkEPPOAPI = async (): Promise<boolean> => {
  try {
    // Implementa la verifica specifica per EPPO
    return true; // Placeholder
  } catch {
    return false;
  }
};

const checkHuggingFaceAPI = async (): Promise<boolean> => {
  try {
    // Verifica se HuggingFace è disponibile
    const response = await fetch('https://api-inference.huggingface.co/status');
    return response.ok;
  } catch {
    return false;
  }
};

// Modifica la funzione analyzeImage principale
export const analyzeImage = async (
  imageDataUrl: string,
  lowQualityFallback = false,
  isVerificationOnly = false
) => {
  try {
    // Verifica la disponibilità dei servizi AI prima di procedere
    const servicesStatus = await checkAIServicesAvailability();
    
    if (!servicesStatus.available) {
      throw new Error('Analisi non completata - tutti i servizi AI non disponibili');
    }

    // Se solo alcuni servizi sono disponibili, logga un warning
    if (servicesStatus.failedServices.length > 0) {
      console.warn('Alcuni servizi AI non disponibili:', servicesStatus.failedServices);
    }

    // Simulate a brief delay for analysis
    await new Promise(resolve => setTimeout(resolve, 1500));
        
    // Verify if the image is a data URL
    if (!imageDataUrl.startsWith('data:')) {
      throw new Error('Invalid image format. Expected data URL.');
    }
        
    // Convert data URL to Blob/File for sending
    const base64Data = imageDataUrl.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
        
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArrays.push(byteCharacters.charCodeAt(i));
    }
        
    const byteArray = new Uint8Array(byteArrays);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });
    const imageFile = new File([blob], 'plant-image.jpg', { type: 'image/jpeg' });
        
    // Generation of a random ID for the disease
    const diseaseIds = ['powdery-mildew', 'leaf-spot', 'aphid-infestation', 'root-rot', 'spider-mites'];
        
    // Add EPPO regulated diseases
    const eppoRegulatedDiseaseIds = ['citrus-greening', 'xylella-fastidiosa', 'fire-blight'];
    const allDiseaseIds = [...diseaseIds, ...eppoRegulatedDiseaseIds];
        
    // For verification only, return simplified result
    if (isVerificationOnly) {
      return {
        analysisDetails: {
          plantVerification: {
            isPlant: true,
            confidence: 0.95
          }
        }
      };
    }
        
    // Analyze the image with HuggingFace solo se disponibile
    let huggingFaceResult = null;
    if (servicesStatus.workingServices.includes('HuggingFace Model')) {
      try {
        huggingFaceResult = await analyzePlantImage(imageFile);
        console.log("HuggingFace analysis result:", huggingFaceResult);
      } catch (error) {
        console.error("Error with HuggingFace analysis:", error);
        // Rimuovi HuggingFace dai servizi funzionanti
        const index = servicesStatus.workingServices.indexOf('HuggingFace Model');
        if (index > -1) {
          servicesStatus.workingServices.splice(index, 1);
          servicesStatus.failedServices.push('HuggingFace Model');
        }
      }
    }

    // Se dopo il tentativo con HuggingFace non ci sono più servizi disponibili
    if (servicesStatus.workingServices.length === 0) {
      throw new Error('Analisi non completata - tutti i servizi AI non disponibili');
    }

    // Resto del codice esistente...
    // Generate mock of visual elements and features for analysis
    const thermalMapUrl = imageDataUrl;
        
    // Common plant names for identification
    const plantNames = [
      'Tomato (Solanum lycopersicum)',
      'Basil (Ocimum basilicum)',
      'Monstera (Monstera deliciosa)',
      'Pothos (Epipremnum aureum)',
      'Rose (Rosa)',
      'Arrowhead Plant (Syngonium podophyllum)',
      'Snake Plant (Sansevieria)',
      'Aloe Vera (Aloe barbadensis miller)',
      'Fiddle Leaf Fig (Ficus lyrata)',
      'Peace Lily (Spathiphyllum)',
      'Citrus (Citrus spp.)',
      'Olive (Olea europaea)',
      'Apple (Malus domestica)'
    ];
        
    // Plant parts that can be identified
    const plantParts = [
      'leaf', 'stem', 'root', 'flower', 'fruit', 'shoot', 'collar region', 'branch', 'trunk'
    ];
        
    // Randomly select a plant name
    const randomPlantName = plantNames[Math.floor(Math.random() * plantNames.length)];
        
    // Randomly select a plant part if not determined by HuggingFace
    const randomPlantPart = plantParts[Math.floor(Math.random() * plantParts.length)];
        
    // Determine if the plant is healthy (70% chance)
    const isPlantHealthy = Math.random() < 0.7;
        
    // Features based on plant health status and plant part
    const plantPart = huggingFaceResult?.plantPart || randomPlantPart;
        
    // Check if this might be an EPPO regulated pest/disease (15% chance if unhealthy)
    const isEppoPest = !isPlantHealthy && Math.random() < 0.15;
    let eppoRegulatedPest = null;
        
    if (isEppoPest) {
      const eppoIndex = Math.floor(Math.random() * eppoRegulatedDiseaseIds.length);
      eppoRegulatedPest = {
        name: eppoRegulatedDiseaseIds[eppoIndex].replace('-', ' '),
        isQuarantine: true,
        warningLevel: 'high'
      };
    }
        
    const identifiedFeatures = isPlantHealthy ?       
      [
        `Healthy ${plantPart} tissue`,
        'Good coloration',
        'Normal growth pattern',
        'No visible damage'
      ] : isEppoPest ?
      [
        `ALERT: Potential ${eppoRegulatedPest.name} detected`,
        'This may be a regulated pest/disease',
        'Consider reporting to plant health authorities',
        'Further laboratory testing advised'
      ] :
      [
        `Discolored ${plantPart}`,
        'Abnormal tissue',
        'Visible lesions',
        'Signs of stress'
      ];
        
    // Create boundingBox for plant part verification
    const leafVerification = {
      isPlantPart: true,
      partName: plantPart,
      confidence: 85 + Math.floor(Math.random() * 10),
      boundingBox: {
        x: 50 + Math.floor(Math.random() * 50),
        y: 50 + Math.floor(Math.random() * 50),
        width: 200 + Math.floor(Math.random() * 100),
        height: 200 + Math.floor(Math.random() * 100)
      }
    };
        
    // Alternative diagnosis
    const alternativeDiagnoses = isPlantHealthy ?
      [] : // No alternative diagnoses for healthy plants
      allDiseaseIds
        .filter((_, i) => i !== Math.floor(Math.random() * allDiseaseIds.length))
        .slice(0, 2)
        .map(id => ({           
          disease: id,
          probability: 0.1 + Math.random() * 0.2
        }));
        
    // Results of AI services - usa solo i servizi funzionanti
    const aiServices = servicesStatus.workingServices.map(serviceName => ({
      serviceName,
      result: true,
      confidence: 0.75 + Math.random() * 0.20
    }));
        
    // Determine diseaseId and confidence, preferring the HuggingFace result if available
    let diseaseId, confidence;
        
    if (isPlantHealthy) {
      // For healthy plants, no disease id is assigned
      diseaseId = null;
      confidence = 0.95; // High confidence that the plant is healthy
    } else if (huggingFaceResult) {
      // Map HuggingFace label to an ID in our system
      const labelLower = huggingFaceResult.label.toLowerCase();
      if (labelLower.includes('healthy') || labelLower.includes('normal')) {
        return analyzeHealthyPlant(randomPlantName, huggingFaceResult.score, plantPart);
      } else if (labelLower.includes('blight')) {
        diseaseId = 'leaf-spot';
      } else if (labelLower.includes('mildew') || labelLower.includes('powdery')) {
        diseaseId = 'powdery-mildew';
      } else if (labelLower.includes('mite') || labelLower.includes('spider')) {
        diseaseId = 'spider-mites';
      } else if (labelLower.includes('rot')) {
        diseaseId = 'root-rot';
      } else if (labelLower.includes('aphid') || labelLower.includes('insect')) {
        diseaseId = 'aphid-infestation';
      } else if (labelLower.includes('citrus') && (labelLower.includes('greening') || labelLower.includes('huanglongbing'))) {
        diseaseId = 'citrus-greening';
      } else if (labelLower.includes('xylella') || labelLower.includes('olive decline')) {
        diseaseId = 'xylella-fastidiosa';
      } else if (labelLower.includes('fire') && labelLower.includes('blight')) {
        diseaseId = 'fire-blight';
      } else {
        // Fallback to a random choice
        diseaseId = allDiseaseIds[Math.floor(Math.random() * allDiseaseIds.length)];
      }
            
      confidence = huggingFaceResult.score;
    } else if (isEppoPest) {
      // If this is an EPPO regulated disease, choose from those
      diseaseId = eppoRegulatedDiseaseIds[Math.floor(Math.random() * eppoRegulatedDiseaseIds.length)];
      confidence = 0.75 + Math.random() * 0.20; // Generally high confidence for these serious pests
    } else {
      // Fallback to previous behavior for sick plants without HuggingFace results
      diseaseId = diseaseIds[Math.floor(Math.random() * diseaseIds.length)];
      confidence = 0.7 + Math.random() * 0.25;
    }
        
    // If the plant is healthy (based on our determination), return healthy plant analysis
    if (isPlantHealthy) {
      return analyzeHealthyPlant(randomPlantName, confidence, plantPart);
    }
        
    // Determine data source based on disease type and plant part
    const isEppoDisease = eppoRegulatedDiseaseIds.includes(diseaseId);
    const isLeafDisease = plantPart === 'leaf';
    let dataSource = "";
        
    if (isEppoDisease) {
      dataSource = "EPPO Global Database";
    } else if (isLeafDisease) {
      dataSource = "New Plant Diseases Dataset + OLID I";
    } else {
      dataSource = "TRY Plant Trait Database + PlantNet";
    }
        
    // Create EPPO data if relevant
    const eppoData = isEppoDisease ? {
      regulationStatus: 'Quarantine pest/disease',
      reportAdvised: true,
      warningLevel: 'high',
      infoLink: `https://gd.eppo.int/search?q=${encodeURIComponent(diseaseId.replace('-', ' '))}`
    } : null;
        
    // Create complete result for sick plants
    return {
      diseaseId,
      confidence,
      analysisDetails: {
        identifiedFeatures,
        alternativeDiagnoses,
        thermalMap: thermalMapUrl,
        leafVerification,
        plantVerification: {
          isPlant: true,
          confidence: 0.95,
          aiServices
        },
        multiServiceInsights: {
          agreementScore: 92,
          primaryService: isEppoDisease ? 'EPPO Regulatory Database' :
