
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PlantInfo } from '@/components/diagnose/types';

/**
 * Service for plant disease diagnosis using multiple AI services
 */
export class PlantDiagnosisService {
  /**
   * Submit an image for plant disease diagnosis
   * @param imageUrl URL of the uploaded image
   * @param plantInfo Additional information about the plant
   * @param userId Optional user ID for authenticated requests
   * @returns The diagnosis result
   */
  static async diagnosePlant(imageUrl: string, plantInfo?: PlantInfo, userId?: string) {
    try {
      console.log('🔍 Starting plant diagnosis:', { imageUrl, userId });
      toast.info('Analisi della pianta in corso...', { id: 'diagnosis-loading' });
      
      // Call our edge function for diagnosis
      const response = await fetch(`${window.location.origin}/.netlify/functions/invoke-supabase-function`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          functionName: 'plant-diagnosis',
          payload: {
            imageUrl,
            plantInfo,
            userId
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Errore del server: ${response.status}`);
      }
      
      const result = await response.json();
      
      toast.dismiss('diagnosis-loading');
      return result;
    } catch (error) {
      console.error('❌ Error in plant diagnosis:', error);
      toast.dismiss('diagnosis-loading');
      toast.error('Errore durante la diagnosi della pianta');
      throw error;
    }
  }
  
  /**
   * Get all diagnoses for a user
   * @param userId The user ID
   * @returns List of diagnoses
   */
  static async getUserDiagnoses(userId: string) {
    try {
      const { data, error } = await supabase
        .from('diagnoses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching user diagnoses:', error);
      throw error;
    }
  }
  
  /**
   * Get a single diagnosis by ID
   * @param diagnosisId The diagnosis ID
   * @returns The diagnosis details
   */
  static async getDiagnosis(diagnosisId: string) {
    try {
      const { data, error } = await supabase
        .from('diagnoses')
        .select('*')
        .eq('id', diagnosisId)
        .single();
        
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching diagnosis details:', error);
      throw error;
    }
  }
  
  /**
   * Save diagnosis result to database
   * @param diagnosisData Diagnosis data to save
   * @returns The created diagnosis
   */
  static async saveDiagnosis(diagnosisData: any) {
    try {
      const { data, error } = await supabase
        .from('diagnoses')
        .insert(diagnosisData)
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error saving diagnosis:', error);
      throw error;
    }
  }
}

export default PlantDiagnosisService;
