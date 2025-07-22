import { supabase } from "@/integrations/supabase/client";
import { searchEppoDatabase, formatEppoResults } from './eppoIntegration';

export interface PlantAnalysisResult {
  success: boolean;
  plantName: string;
  scientificName?: string;
  confidence: number;
  isHealthy: boolean;
  diseases: any[];
  recommendations: string[];
  analysisDetails: any;
  error?: string;
}

export interface ImageValidationResult {
  isValid: boolean;
  hasPlantContent: boolean;
  quality: number;
  issues: string[];
  suggestions: string[];
}

/**
 * Advanced image validation with enhanced plant detection
 */
const validatePlantImage = async (imageFile: File): Promise<ImageValidationResult> => {
  return new Promise((resolve) => {
    // First validate file type and size
    if (!imageFile.type.startsWith('image/')) {
      resolve({
        isValid: false,
        hasPlantContent: false,
        quality: 0,
        issues: ['Il file non è un\'immagine valida'],
        suggestions: ['Carica un file immagine (JPG, PNG, WebP)']
      });
      return;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > maxSize) {
      resolve({
        isValid: false,
        hasPlantContent: false,
        quality: 0,
        issues: ['File troppo grande (max 10MB)'],
        suggestions: ['Comprimi l\'immagine o usa una qualità inferiore']
      });
      return;
    }

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      if (!ctx) {
        resolve({
          isValid: false,
          hasPlantContent: false,
          quality: 0,
          issues: ['Errore nell\'elaborazione dell\'immagine'],
          suggestions: ['Riprova con un\'altra immagine']
        });
        return;
      }

      // Get image data for analysis
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let greenPixels = 0;
      let brownPixels = 0;
      let yellowPixels = 0;
      let darkPixels = 0;
      let brightPixels = 0;
      let totalPixels = data.length / 4;
      let averageBrightness = 0;
      let colorVariance = 0;
      let edgePixels = 0;
      
      // Enhanced color analysis for plant detection
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const brightness = (r + g + b) / 3;
        averageBrightness += brightness;
        
        // Detect various plant colors
        // Green tones (healthy plants)
        if (g > r && g > b && g > 60 && (g - Math.max(r, b)) > 20) {
          greenPixels++;
        }
        
        // Brown/earth tones (soil, bark, diseased parts)
        if (r > 80 && g > 50 && b < 80 && Math.abs(r - g) < 60 && r > b) {
          brownPixels++;
        }
        
        // Yellow tones (flowers, autumn leaves)
        if (r > 120 && g > 120 && b < 100 && Math.abs(r - g) < 50) {
          yellowPixels++;
        }
        
        // Dark areas (shadows, deep greens)
        if (brightness < 60) {
          darkPixels++;
        }
        
        // Bright areas (highlights, flowers)
        if (brightness > 200) {
          brightPixels++;
        }
        
        // Edge detection for texture analysis
        if (i > canvas.width * 4 && i < data.length - canvas.width * 4) {
          const topPixel = (data[i - canvas.width * 4] + data[i - canvas.width * 4 + 1] + data[i - canvas.width * 4 + 2]) / 3;
          const bottomPixel = (data[i + canvas.width * 4] + data[i + canvas.width * 4 + 1] + data[i + canvas.width * 4 + 2]) / 3;
          if (Math.abs(topPixel - bottomPixel) > 30) {
            edgePixels++;
          }
        }
      }
      
      averageBrightness /= totalPixels;
      const greenRatio = greenPixels / totalPixels;
      const brownRatio = brownPixels / totalPixels;
      const yellowRatio = yellowPixels / totalPixels;
      const darkRatio = darkPixels / totalPixels;
      const brightRatio = brightPixels / totalPixels;
      const edgeRatio = edgePixels / totalPixels;
      
      // Enhanced plant detection algorithm
      const hasPlantColors = greenRatio > 0.03 || brownRatio > 0.02 || yellowRatio > 0.01;
      const hasNaturalVariance = darkRatio > 0.1 && darkRatio < 0.7;
      const hasTexture = edgeRatio > 0.05; // Natural objects have more texture
      const hasGoodColorBalance = brightRatio < 0.3; // Not overexposed
      
      // Quality metrics
      const imageSize = img.width * img.height;
      const hasGoodResolution = imageSize > 100000; // At least ~316x316
      const hasExcellentResolution = imageSize > 400000; // At least ~632x632
      const hasGoodLighting = averageBrightness > 40 && averageBrightness < 220;
      const hasOptimalLighting = averageBrightness > 80 && averageBrightness < 180;
      
      const issues: string[] = [];
      const suggestions: string[] = [];
      
      // Lighting analysis
      if (!hasGoodLighting) {
        if (averageBrightness <= 40) {
          issues.push('Immagine troppo scura');
          suggestions.push('Usa più luce naturale o artificiale');
          suggestions.push('Evita ombre eccessive sulla pianta');
        } else {
          issues.push('Immagine sovraesposta');
          suggestions.push('Riduci la luce diretta');
          suggestions.push('Scatta in ombra o con luce diffusa');
        }
      }
      
      // Resolution analysis
      if (!hasGoodResolution) {
        issues.push('Risoluzione insufficiente');
        suggestions.push('Usa una risoluzione più alta (minimo 500x500)');
        suggestions.push('Avvicinati alla pianta per più dettagli');
      }
      
      // Plant content analysis
      if (!hasPlantColors) {
        issues.push('Colori vegetali non rilevati');
        suggestions.push('Assicurati che la pianta sia ben visibile');
        suggestions.push('Includi foglie, fiori o parti verdi/marroni');
        suggestions.push('Evita sfondi che dominano l\'inquadratura');
      }
      
      if (!hasTexture) {
        issues.push('Texture naturale insufficiente');
        suggestions.push('Avvicinati per catturare più dettagli');
        suggestions.push('Metti a fuoco la superficie della pianta');
      }
      
      if (!hasNaturalVariance) {
        issues.push('Contrasto colori inadeguato');
        suggestions.push('Migliora l\'illuminazione per evidenziare i dettagli');
      }
      
      // Calculate comprehensive quality score
      let quality = 0;
      
      // Plant content detection (40% of score)
      if (hasPlantColors) quality += 0.25;
      if (hasNaturalVariance) quality += 0.10;
      if (hasTexture) quality += 0.05;
      
      // Image quality (40% of score)
      if (hasGoodLighting) quality += 0.20;
      if (hasOptimalLighting) quality += 0.10;
      if (hasGoodResolution) quality += 0.10;
      
      // Technical excellence (20% of score)
      if (hasExcellentResolution) quality += 0.10;
      if (hasGoodColorBalance) quality += 0.10;
      
      // Determine if image is valid for plant analysis
      const isValid = quality > 0.6 && hasPlantColors;
      const hasPlantContent = hasPlantColors && hasNaturalVariance;
      
      // Add quality-specific suggestions
      if (quality > 0.8) {
        suggestions.unshift('Immagine di ottima qualità per l\'analisi!');
      } else if (quality > 0.6) {
        suggestions.unshift('Qualità sufficiente, ma migliorabile');
      }
      
      resolve({
        isValid,
        hasPlantContent,
        quality: Math.min(quality, 1.0),
        issues,
        suggestions
      });
    };
    
    img.onerror = () => {
      resolve({
        isValid: false,
        hasPlantContent: false,
        quality: 0,
        issues: ['Impossibile caricare l\'immagine'],
        suggestions: ['Verifica che il file sia un\'immagine valida (JPG, PNG, WebP)', 'Prova con un\'immagine diversa']
      });
    };
    
    // Create object URL for the image
    const objectUrl = URL.createObjectURL(imageFile);
    img.src = objectUrl;
    
    // Cleanup after processing
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
  });
};

/**
 * Enhanced plant analysis with improved validation and error handling
 */
export const performEnhancedPlantAnalysis = async (
  imageFile: File,
  plantInfo?: any
): Promise<PlantAnalysisResult> => {
  try {
    console.log('🔬 Starting enhanced plant analysis with improved validation...');
    
    // Step 1: Pre-validate image
    const validation = await validatePlantImage(imageFile);
    console.log('📋 Image validation result:', validation);
    
    if (!validation.isValid) {
      throw new Error(`INVALID_IMAGE: ${validation.issues.join(', ')}`);
    }
    
    if (!validation.hasPlantContent) {
      throw new Error('NOT_A_PLANT');
    }
    
    // Step 2: Convert image to base64 for API calls
    const base64Image = await convertToBase64(imageFile);
    
    // Step 3: Call the comprehensive plant diagnosis API with retry logic
    let diagnosisData;
    let apiError;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`🔄 Attempt ${attempt}/3 - Calling comprehensive plant diagnosis API...`);
      
      const { data, error } = await supabase.functions.invoke('comprehensive-plant-diagnosis', {
        body: {
          imageBase64: base64Image,
          plantInfo: {
            ...plantInfo,
            imageQuality: validation.quality,
            preValidation: validation
          }
        }
      });
      
      if (!error && data) {
        // Handle the case where the API returns NOT_A_PLANT error
        if (data.error === 'NOT_A_PLANT') {
          throw new Error('NOT_A_PLANT');
        }
        diagnosisData = data;
        break;
      }
      
      apiError = error;
      console.warn(`⚠️ Attempt ${attempt} failed:`, error?.message);
      
      // Progressive backoff: wait longer between retries
      if (attempt < 3) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
        console.log(`⏱️ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    if (!diagnosisData) {
      console.error('❌ All API attempts failed:', apiError);
      throw new Error(`API_ERROR: ${apiError?.message || 'Service unavailable after 3 attempts'}`);
    }
    
    console.log('✅ Initial diagnosis completed:', diagnosisData.plantName);
    
    // Step 4: Enhanced EPPO database search
    let eppoResults = [];
    const symptoms = plantInfo?.symptoms || diagnosisData.detectedSymptoms?.join(', ') || '';
    const plantName = diagnosisData.plantName || plantInfo?.name || '';
    
    if (symptoms || plantName) {
      console.log('🔍 Searching EPPO database...');
      try {
        eppoResults = await searchEppoDatabase(plantName, symptoms, plantInfo);
        console.log(`📊 EPPO search found ${eppoResults.length} relevant results`);
      } catch (eppoError) {
        console.warn('⚠️ EPPO search failed, continuing without:', eppoError.message);
      }
    }
    
    // Step 5: Combine and enhance results
    const combinedDiseases = [];
    
    // Add original diseases from diagnosis
    if (diagnosisData.diseases && Array.isArray(diagnosisData.diseases)) {
      combinedDiseases.push(...diagnosisData.diseases);
    }
    
    // Add EPPO results as diseases
    if (eppoResults.length > 0) {
      const formattedEppoResults = formatEppoResults(eppoResults);
      combinedDiseases.push(...formattedEppoResults);
    }
    
    // Remove duplicates and sort by probability
    const uniqueDiseases = removeDuplicateDiseases(combinedDiseases);
    uniqueDiseases.sort((a, b) => (b.probability || 0) - (a.probability || 0));
    
    // Step 6: Enhanced recommendations
    const enhancedRecommendations = generateEnhancedRecommendations(
      diagnosisData,
      eppoResults,
      plantInfo,
      validation
    );
    
    // Calculate overall confidence
    const overallConfidence = calculateOverallConfidence(
      diagnosisData.confidence || 0,
      eppoResults.length,
      validation.quality
    );
    
    const result: PlantAnalysisResult = {
      success: true,
      plantName: diagnosisData.plantName || 'Pianta identificata',
      scientificName: diagnosisData.scientificName || undefined,
      confidence: overallConfidence,
      isHealthy: uniqueDiseases.length === 0 || diagnosisData.isHealthy,
      diseases: uniqueDiseases.slice(0, 5), // Top 5 diseases
      recommendations: enhancedRecommendations,
      analysisDetails: {
        source: 'Enhanced Analysis with EPPO Database',
        verificationPassed: true,
        qualityCheck: true,
        imageQuality: validation.quality,
        eppoResultsCount: eppoResults.length,
        originalConfidence: diagnosisData.confidence,
        enhancedConfidence: overallConfidence,
        validationIssues: validation.issues
      }
    };
    
    console.log('✅ Enhanced plant analysis completed successfully');
    return result;
    
  } catch (error) {
    console.error('❌ Enhanced plant analysis failed:', error);
    
    // Enhanced error handling
    let errorMessage = 'Analisi non completata';
    let recommendations = ['Consultare un esperto per diagnosi accurata'];
    
    if (error.message.includes('NOT_A_PLANT')) {
      errorMessage = 'L\'immagine non sembra contenere una pianta chiaramente visibile';
      recommendations = [
        'Assicurati che la pianta sia ben visibile nell\'immagine',
        'Usa una buona illuminazione naturale',
        'Evita foto troppo sfocate o distanti',
        'Includi foglie, fiori o parti caratteristiche della pianta',
        'Scatta la foto da una distanza di 30-50 cm dalla pianta'
      ];
    } else if (error.message.includes('INVALID_IMAGE')) {
      errorMessage = 'Qualità dell\'immagine insufficiente per l\'analisi';
      const issues = error.message.split(': ')[1] || '';
      recommendations = [
        `Problemi rilevati: ${issues}`,
        'Usa una risoluzione più alta (minimo 500x500 pixel)',
        'Migliora l\'illuminazione',
        'Assicurati che l\'immagine sia a fuoco'
      ];
    } else if (error.message.includes('API_ERROR')) {
      errorMessage = 'Servizio di analisi temporaneamente non disponibile';
      recommendations = [
        'Riprova tra qualche minuto',
        'Verifica la connessione internet',
        'Se il problema persiste, contatta il supporto',
        'Il sistema ha tentato automaticamente 3 volte'
      ];
    } else if (error.message.includes('File too large')) {
      errorMessage = 'File immagine troppo grande';
      recommendations = [
        'Comprimi l\'immagine sotto i 10MB',
        'Riduci la qualità o risoluzione',
        'Usa un formato più efficiente (JPG invece di PNG)'
      ];
    } else if (error.message.includes('File is not an image')) {
      errorMessage = 'Tipo di file non supportato';
      recommendations = [
        'Carica solo file immagine (JPG, PNG, WebP)',
        'Verifica che l\'estensione del file sia corretta'
      ];
    }
    
    return {
      success: false,
      error: errorMessage,
      plantName: 'Analisi non completata',
      confidence: 0,
      isHealthy: false,
      diseases: [],
      recommendations: recommendations,
      analysisDetails: {
        source: 'Enhanced Analysis (Failed)',
        verificationPassed: false,
        qualityCheck: false,
        errorType: error.message.split(':')[0] || 'UNKNOWN'
      }
    };
  }
};

/**
 * Remove duplicate diseases based on name similarity
 */
const removeDuplicateDiseases = (diseases: any[]): any[] => {
  const unique = [];
  const seen = new Set();
  
  for (const disease of diseases) {
    const key = disease.name?.toLowerCase().trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      unique.push(disease);
    }
  }
  
  return unique;
};

/**
 * Generate enhanced recommendations combining original and EPPO data
 */
const generateEnhancedRecommendations = (
  diagnosisData: any,
  eppoResults: any[],
  plantInfo?: any,
  validation?: ImageValidationResult
): string[] => {
  const recommendations = [];
  
  // Add image quality recommendations first if needed
  if (validation && validation.quality < 0.8) {
    recommendations.push('💡 Per analisi più accurate, migliora la qualità delle foto future');
  }
  
  // Add original recommendations
  if (diagnosisData.recommendations && Array.isArray(diagnosisData.recommendations)) {
    recommendations.push(...diagnosisData.recommendations);
  }
  
  // Add EPPO-specific recommendations
  if (eppoResults.length > 0) {
    const regulatedDiseases = eppoResults.filter(r => r.regulatoryStatus && r.regulatoryStatus.length > 0);
    
    if (regulatedDiseases.length > 0) {
      recommendations.unshift('⚠️ ATTENZIONE: Rilevate possibili malattie regolamentate EPPO');
      recommendations.push('Consulenza fitopatologo URGENTE raccomandata');
      recommendations.push('Possibile obbligo di notifica alle autorità competenti');
    }
    
    recommendations.push('✅ Diagnosi arricchita con database EPPO europeo');
  }
  
  // Add plant-specific recommendations
  if (plantInfo?.isIndoor) {
    recommendations.push('🏠 Migliorare circolazione aria in ambiente interno');
  } else {
    recommendations.push('🌤️ Monitorare condizioni climatiche esterne');
  }
  
  // Add general monitoring recommendation
  recommendations.push('📸 Monitora l\'evoluzione con foto regolari');
  
  // Remove duplicates
  return [...new Set(recommendations)];
};

/**
 * Calculate overall confidence combining original and EPPO results
 */
const calculateOverallConfidence = (
  originalConfidence: number, 
  eppoResultsCount: number, 
  imageQuality: number
): number => {
  let confidence = originalConfidence;
  
  // Adjust confidence based on image quality
  confidence = confidence * (0.5 + imageQuality * 0.5);
  
  // Boost confidence if EPPO results are found
  if (eppoResultsCount > 0) {
    confidence += 0.1; // 10% boost for EPPO integration
    
    if (eppoResultsCount >= 3) {
      confidence += 0.05; // Additional boost for multiple matches
    }
  }
  
  return Math.min(confidence, 0.95); // Cap at 95%
};

/**
 * Convert file to base64 with error handling
 */
const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      reject(new Error('File too large (max 10MB)'));
      return;
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      if (result) {
        resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = error => reject(new Error('FileReader error: ' + error));
  });
};

/**
 * Utility function to check if the analysis service is available
 */
export const checkServiceStatus = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('health-check');
    return !error && data?.status === 'ok';
  } catch {
    return false;
  }
};
