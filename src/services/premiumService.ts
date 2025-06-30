
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
  static hasExpertChatAccess(userEmail: string | undefined): boolean {
    if (!userEmail) return false;
    
    // Per ora, accesso gratuito per email di test
    return PREMIUM_TEST_EMAILS.includes(userEmail.toLowerCase());
  }

  /**
   * Verifica se l'utente può usare la chat con l'esperto (ora premium)
   */
  static canUseExpertChat(userEmail: string | undefined): boolean {
    return this.hasExpertChatAccess(userEmail);
  }

  /**
   * Verifica se l'utente può usare la diagnosi AI (ora gratuita)
   */
  static canUseAIDiagnosis(userEmail: string | undefined): boolean {
    // AI è ora sempre disponibile
    return true;
  }

  /**
   * Ottiene il messaggio da mostrare per l'upgrade premium
   */
  static getPremiumUpgradeMessage(): string {
    return "La chat con l'esperto fitopatologo è disponibile nella versione Premium. Aggiorna il tuo piano per accedere alla consulenza personalizzata.";
  }
}

/**
 * Hook per verificare lo status premium dell'utente corrente
 */
export const usePremiumStatus = () => {
  const { userProfile } = useAuth();
  
  const hasExpertChatAccess = PremiumService.canUseExpertChat(userProfile?.email);
  const hasAIAccess = PremiumService.canUseAIDiagnosis(userProfile?.email);
  
  return {
    hasAIAccess,
    hasExpertChatAccess,
    isPremium: hasExpertChatAccess,
    upgradeMessage: PremiumService.getPremiumUpgradeMessage()
  };
};
