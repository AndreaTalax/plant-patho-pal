
export interface AnalysisErrorResult {
  success: boolean;
  error: boolean;
  message: string;
  recommendExpert: boolean;
  fallbackAction: string;
  errorDetails?: {
    code?: string;
    timestamp: string;
    userFriendlyMessage: string;
  };
}

export const handleAnalysisError = (error: any): AnalysisErrorResult => {
  console.error('Analysis error handled:', error);
  
  // Determine error type and create appropriate user-friendly message
  let userMessage = "Analisi non disponibile";
  let errorCode = "UNKNOWN_ERROR";
  
  if (error?.message) {
    if (error.message.includes('accuracy') || error.message.includes('accuratezza')) {
      userMessage = "L'analisi non ha raggiunto l'accuratezza richiesta";
      errorCode = "LOW_ACCURACY";
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      userMessage = "Problema di connessione. Riprova più tardi";
      errorCode = "NETWORK_ERROR";
    } else if (error.message.includes('image') || error.message.includes('immagine')) {
      userMessage = "Problema nell'elaborazione dell'immagine";
      errorCode = "IMAGE_PROCESSING_ERROR";
    } else if (error.message.includes('timeout')) {
      userMessage = "Timeout durante l'analisi. Riprova con un'immagine più piccola";
      errorCode = "TIMEOUT_ERROR";
    }
  }
  
  // Non lanciare errori, ma restituire sempre un risultato utilizzabile
  return {
    success: false,
    error: true,
    message: userMessage,
    recommendExpert: true,
    fallbackAction: "expert_consultation",
    errorDetails: {
      code: errorCode,
      timestamp: new Date().toISOString(),
      userFriendlyMessage: userMessage
    }
  };
};

export const createFallbackDiagnosisResult = (errorResult: AnalysisErrorResult) => {
  return {
    id: `error-${Date.now()}`,
    name: "Analisi non completata",
    description: errorResult.message,
    causes: "Errore tecnico durante l'analisi",
    symptoms: ["Impossibile determinare i sintomi"],
    treatments: ["Consulta un esperto per una diagnosi accurata"],
    confidence: 0,
    healthy: null,
    disclaimer: errorResult.message,
    recommendExpertConsultation: true,
    error: true,
    fallbackAction: errorResult.fallbackAction
  };
};

// Global error boundary for analysis operations
export const safeAnalysisWrapper = async <T>(
  operation: () => Promise<T>,
  fallbackValue: T
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    const errorResult = handleAnalysisError(error);
    console.warn('Analysis operation failed safely:', errorResult);
    return fallbackValue;
  }
};
