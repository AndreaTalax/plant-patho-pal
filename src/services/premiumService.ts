
import { useAuth } from '@/context/AuthContext';

export const PREMIUM_TEST_EMAILS = [
  'test@gmail.com',
  'agrotecnicomarconigro@gmail.com',
  // Aggiungi altri email di test qui
];

export class PremiumService {
  /**
   * Verifica se l'utente ha accesso alle funzionalità premium
   */
  static hasAIPremiumAccess(userEmail: string | undefined): boolean {
    if (!userEmail) return false;
    
    // Per ora, accesso gratuito per email di test
    return PREMIUM_TEST_EMAILS.includes(userEmail.toLowerCase());
  }

  /**
   * Verifica se l'utente può usare la diagnosi AI
   */
  static canUseAIDiagnosis(userEmail: string | undefined): boolean {
    return this.hasAIPremiumAccess(userEmail);
  }

  /**
   * Ottiene il messaggio da mostrare per l'upgrade premium
   */
  static getPremiumUpgradeMessage(): string {
    return "La diagnosi AI è disponibile nella versione Premium. Aggiorna il tuo piano per accedere a questa funzionalità.";
  }
}

/**
 * Hook per verificare lo status premium dell'utente corrente
 */
export const usePremiumStatus = () => {
  const { userProfile } = useAuth();
  
  const hasAIAccess = PremiumService.canUseAIDiagnosis(userProfile?.email);
  
  return {
    hasAIAccess,
    isPremium: hasAIAccess,
    upgradeMessage: PremiumService.getPremiumUpgradeMessage()
  };
};
