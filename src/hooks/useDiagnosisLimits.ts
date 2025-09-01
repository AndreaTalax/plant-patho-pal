
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PremiumService } from '@/services/premiumService';

const FREE_DIAGNOSES_LIMIT = 3;

export const useDiagnosisLimits = () => {
  const { user, userProfile } = useAuth();
  const [diagnosesUsed, setDiagnosesUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Verifica se l'utente ha accesso Premium
  const hasUnlimitedAccess = PremiumService.hasUnlimitedDiagnosis(userProfile?.email);

  // Carica il numero di diagnosi utilizzate
  const loadDiagnosisUsage = async () => {
    if (!user?.id) return;

    // Se ha accesso illimitato, non serve controllare l'usage  
    if (hasUnlimitedAccess) {
      setDiagnosesUsed(0);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_diagnosis_usage')
        .select('diagnoses_used')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Errore nel caricamento usage diagnosi:', error);
        return;
      }

      setDiagnosesUsed(data?.diagnoses_used || 0);
    } catch (error) {
      console.error('Errore nel caricamento usage diagnosi:', error);
    }
  };

  // Incrementa il contatore di diagnosi utilizzate
  const incrementDiagnosisUsage = async () => {
    if (!user?.id) return false;

    // Se ha accesso illimitato, non incrementare il contatore
    if (hasUnlimitedAccess) {
      return true;
    }

    setIsLoading(true);
    try {
      // Prima verifica il limite attuale
      const { data: currentData, error: fetchError } = await supabase
        .from('user_diagnosis_usage')
        .select('diagnoses_used')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Errore nel fetch usage diagnosi:', fetchError);
        return false;
      }

      const currentUsage = currentData?.diagnoses_used || 0;
      const newUsage = currentUsage + 1;

      // Upsert del nuovo valore
      const { error: upsertError } = await supabase
        .from('user_diagnosis_usage')
        .upsert({
          user_id: user.id,
          diagnoses_used: newUsage,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) {
        console.error('Errore nell\'aggiornamento usage diagnosi:', upsertError);
        return false;
      }

      setDiagnosesUsed(newUsage);
      return true;
    } catch (error) {
      console.error('Errore nell\'incremento usage diagnosi:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Verifica se l'utente può usare la diagnosi AI gratuita
  const canUseFreeDiagnosis = () => {
    // Utenti Premium hanno sempre accesso
    if (hasUnlimitedAccess) {
      return true;
    }
    
    // Utenti normali solo se non hanno esaurito le diagnosi gratuite
    return diagnosesUsed < FREE_DIAGNOSES_LIMIT;
  };

  // Ottiene il numero di diagnosi gratuite rimanenti
  const getRemainingFreeDiagnoses = () => {
    if (hasUnlimitedAccess) {
      return Infinity; // Illimitate per Premium
    }
    
    return Math.max(0, FREE_DIAGNOSES_LIMIT - diagnosesUsed);
  };

  // Carica i dati all'inizio
  useEffect(() => {
    loadDiagnosisUsage();
  }, [user?.id, hasUnlimitedAccess]);

  return {
    diagnosesUsed,
    canUseFreeDiagnosis,
    getRemainingFreeDiagnoses,
    incrementDiagnosisUsage,
    isLoading,
    FREE_DIAGNOSES_LIMIT,
    refreshUsage: loadDiagnosisUsage,
    hasUnlimitedAccess
  };
};
