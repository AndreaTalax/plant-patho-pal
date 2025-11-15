import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DiagnosisResult {
  diseases?: Array<{
    name: string;
    confidence: number;
    symptoms?: string[];
    treatments?: string[];
  }>;
  healthAssessment?: string | { generalDiseaseCategory?: { category: string; confidence: number; description: string; } };
  plantIdentification?: string | string[] | unknown;
  primaryDisease?: {
    name: string;
    confidence: number;
  };
  [key: string]: unknown;
}

export interface DiagnosisToSave {
  plant_type?: string;
  plant_variety?: string;
  symptoms: string[];
  image_url?: string;
  diagnosis_result: DiagnosisResult;
  status?: string;
}

export const useSaveDiagnosis = () => {
  const [isSaving, setIsSaving] = useState(false);

  const saveDiagnosis = async (diagnosisData: DiagnosisToSave) => {
    setIsSaving(true);
    try {
      console.log('💾 Saving diagnosis...', diagnosisData);
      
      const { data, error } = await supabase.functions.invoke('save-diagnosis', {
        body: {
          ...diagnosisData,
          symptoms: JSON.stringify(diagnosisData.symptoms), // Convert array to string for database
          status: diagnosisData.status || 'completed'
        }
      });

      if (error) {
        console.error('❌ Error saving diagnosis:', error);
        throw error;
      }

      console.log('✅ Diagnosis saved successfully:', data);
      toast.success('Diagnosi salvata con successo!');
      
      return data;
    } catch (error: any) {
      console.error('❌ Error in saveDiagnosis:', error);
      toast.error('Errore nel salvare la diagnosi: ' + (error.message || 'Errore sconosciuto'));
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    saveDiagnosis,
    isSaving
  };
};