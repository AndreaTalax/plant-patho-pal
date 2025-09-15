import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FastAnalysisResult {
  plantName: string;
  scientificName: string;
  confidence: number;
  isHealthy: boolean;
  issues: Array<{
    name: string;
    type: string;
    severity: string;
    confidence: number;
    description: string;
    symptoms: string[];
    treatment: string[];
  }>;
  recommendations: {
    immediate: string[];
    longTerm: string[];
  };
}

interface FastAnalysisState {
  isAnalyzing: boolean;
  result: FastAnalysisResult | null;
  error: string | null;
}

export const useFastPlantAnalysis = () => {
  const [state, setState] = useState<FastAnalysisState>({
    isAnalyzing: false,
    result: null,
    error: null
  });

  const analyzePlantFast = useCallback(async (imageFile: File) => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      // Converti immagine in base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      console.log('🚀 Avvio analisi veloce...');
      const startTime = Date.now();

      // Chiamata al sistema di diagnosi con API reali
      const { data, error } = await supabase.functions.invoke('real-plant-diagnosis', {
        body: { imageBase64: base64 }
      });

      const endTime = Date.now();
      console.log(`⚡ Analisi completata in ${endTime - startTime}ms`);

      if (error) {
        throw new Error(error.message || 'Errore durante l\'analisi');
      }

      if (!data?.success) {
        throw new Error('Analisi fallita');
      }

      const diagnosis = data.diagnosis;
      
      // Prendi la migliore identificazione di pianta
      const bestPlant = diagnosis.plantIdentification?.[0] || {
        name: 'Pianta non identificata',
        scientificName: '',
        confidence: 0
      };
      
      const result: FastAnalysisResult = {
        plantName: bestPlant.name,
        scientificName: bestPlant.scientificName,
        confidence: bestPlant.confidence,
        isHealthy: diagnosis.healthAnalysis.isHealthy,
        issues: diagnosis.healthAnalysis.issues,
        recommendations: diagnosis.recommendations
      };

      setState(prev => ({ 
        ...prev, 
        result, 
        isAnalyzing: false,
        error: null 
      }));

      toast.success(`✅ Pianta identificata: ${result.plantName}`, {
        description: `Analisi completata in ${endTime - startTime}ms`,
        duration: 3000
      });

      return result;

    } catch (error: any) {
      console.error('❌ Errore analisi veloce:', error);
      
      const errorMessage = error.message || 'Errore durante l\'analisi veloce';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isAnalyzing: false 
      }));

      toast.error('❌ Analisi fallita', {
        description: errorMessage,
        duration: 4000
      });

      throw error;
    }
  }, []);

  const clearResult = useCallback(() => {
    setState({
      isAnalyzing: false,
      result: null,
      error: null
    });
  }, []);

  return {
    isAnalyzing: state.isAnalyzing,
    result: state.result,
    error: state.error,
    analyzePlantFast,
    clearResult
  };
};