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

/**
 * Handles errors and determines a user-friendly message and error code.
 * @example
 * error(anyError)
 * {
 *   success: false,
 *   error: true,
 *   message: "Analisi non disponibile",
 *   recommendExpert: true,
 *   fallbackAction: "expert_consultation",
 *   errorDetails: {
 *     code: "UNKNOWN_ERROR",
 *     timestamp: "2023-10-01T12:00:00Z",
 *     userFriendlyMessage: "Analisi non disponibile"
 *   }
 * }
 * @param {any} error - The error object containing details about the analysis failure.
 * @returns {AnalysisErrorResult} An object with error handling results including a user-friendly message and a recommendation to consult an expert.
 * @description
 *   - Determines user-friendly messages based on the error content for better user communication.
 *   - Provides a consistent error handling mechanism across the application.
 *   - The function ensures it does not throw errors and always returns a usable result.
 */
export const handleAnalysisError = (error: any): AnalysisErrorResult => {
  console.error('Analysis error handled:', error);
  
  // Determine error type and create appropriate user-friendly message
  let userMessage = "Analisi non disponibile";
  let errorCode = "UNKNOWN_ERROR";
  
  if (error?.message) {
    if (error.message.includes('tutti i servizi AI non disponibili') || 
        error.message.includes('all AI services unavailable')) {
      userMessage = "Tutti i servizi di intelligenza artificiale sono temporaneamente non disponibili. Riprova più tardi o consulta un esperto";
      errorCode = "ALL_AI_SERVICES_UNAVAILABLE";
    } else if (error.message.includes('servizi AI non disponibili') || 
               error.message.includes('AI services unavailable')) {
      userMessage = "Servizi di intelligenza artificiale non disponibili. Verifica la connessione internet";
      errorCode = "AI_SERVICES_UNAVAILABLE";
    } else if (error.message.includes('API key') || error.message.includes('authentication')) {
      userMessage = "Problema di autenticazione con i servizi AI. Contatta l'amministratore";
      errorCode = "AUTH_ERROR";
    } else if (error.message.includes('quota') || error.message.includes('limit')) {
      userMessage = "Limite di utilizzo raggiunto. Riprova più tardi";
      errorCode = "QUOTA_EXCEEDED";
    } else if (error.message.includes('accuracy') || error.message.includes('accuratezza')) {
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

/**
 * Generates an error result object for failed analysis.
 * @example
 * errorResult({ message: 'Network Error', fallbackAction: 'Retry Later' })
 * {
 *   id: 'error-1634567890123',
 *   name: 'Analisi non completata',
 *   description: 'Network Error',
 *   ...
 * }
 * @param {AnalysisErrorResult} errorResult - Contains error information and suggested fallback action.
 * @returns {Object} An object detailing the nature of the error and possible actions.
 * @description
 *   - The id is generated using the current timestamp to ensure uniqueness.
 *   - The function provides default descriptions, causes, symptoms, and treatments for the error.
 *   - Sets `recommendExpertConsultation` to true to emphasize seeking professional help.
 *   - Includes a `fallbackAction` specified in the `errorResult` for handling the error.
 */
export const createFallbackDiagnosisResult = (errorResult: AnalysisErrorResult) => {
  return {
    id: `error-${Date.now()}`,
    name: "Analisi non completata",
    description: errorResult.message,
    causes: "Errore tecnico durante l'analisi",
    symptoms: ["Impossibile determinare i sintomi"],
    treatments: [
      "Consulta un esperto per una diagnosi accurata",
      "Riprova l'analisi più tardi",
      "Verifica la qualità dell'immagine caricata"
    ],
    confidence: 0,
    healthy: null,
    disclaimer: errorResult.message,
    recommendExpertConsultation: true,
    error: true,
    fallbackAction: errorResult.fallbackAction
  };
};

// Global error boundary for analysis operations
/**
 * Executes an asynchronous operation safely, returning a fallback value on error.
 * @example
 * sync(asyncOperation, fallbackValue)
 * Promise.resolve(someValue) or fallbackValue
 * @param {() => Promise<T>} {operation} - A function that returns a Promise to be executed.
 * @param {T} {fallbackValue} - Value to return if the operation fails.
 * @returns {Promise<T>} Promise that resolves to the result of the operation or the fallback value on error.
 * @description
 *   - Catches errors in the provided async operation.
 *   - Logs a warning when the operation fails.
 *   - Uses a generic type T to apply function to different types of data.
 */
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

// Nuova funzione per verificare lo stato dei servizi AI
/**
 * Checks the availability status of various AI services.
 * @example
 * sync().then(response => console.log(response));
 * // Example output: { available: false, services: { openai: false, anthropic: false, google: false }, message: "Tutti i servizi AI non disponibili" }
 * @param {void}
 * @returns {Promise<{ available: boolean, services: Record<string, boolean>, message: string }>} An object containing the availability status, a record of services and a message.
 * @description
 *   - Implements a basic structure for service status checking using predefined API calls.
 *   - Handles errors gracefully by returning a default message and empty services object.
 *   - Customize service checks by implementing actual API status verification.
 *   - The function can be extended to include more AI services as needed.
 */
export const checkAIServicesStatus = async (): Promise<{
  available: boolean;
  services: Record<string, boolean>;
  message: string;
}> => {
  try {
    // Qui dovresti implementare la verifica dei tuoi servizi AI specifici
    // Esempio per servizi comuni:
    const services = {
      openai: false,
      anthropic: false,
      google: false
    };
    
    // Verifica ogni servizio (implementa secondo le tue API)
    // const openaiStatus = await checkOpenAIStatus();
    // const anthropicStatus = await checkAnthropicStatus();
    
    const availableServices = Object.values(services).filter(Boolean).length;
    
    return {
      available: availableServices > 0,
      services,
      message: availableServices === 0 
        ? "Tutti i servizi AI non disponibili" 
        : `${availableServices} servizi AI disponibili`
    };
  } catch (error) {
    return {
      available: false,
      services: {},
      message: "Impossibile verificare lo stato dei servizi AI"
    };
  }
};
