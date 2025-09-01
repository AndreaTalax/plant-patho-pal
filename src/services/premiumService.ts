import { useAuth } from '@/context/AuthContext';

export const PREMIUM_TEST_EMAILS = [
  'test@gmail.com', // Account premium per test
  'agrotecnicomarconigro@gmail.com',
  'premium@gmail.com'
  // talaiaandrea@gmail.com rimosso - ora è utente normale
];

export const ADMIN_TEST_EMAILS = [
  'test@gmail.com',
  'agrotecnicomarconigro@gmail.com',
];

export class PremiumService {
  /**
   * Verifica se l'utente ha accesso alle funzionalità premium
   */
  static hasExpertChatAccess(userEmail: string | undefined): boolean {
    if (!userEmail) return false;
    
    // Solo account premium hanno accesso
    return PREMIUM_TEST_EMAILS.includes(userEmail.toLowerCase());
  }

  /**
   * Verifica se l'utente può usare la chat con l'esperto (ora premium)
   */
  static canUseExpertChat(userEmail: string | undefined): boolean {
    return this.hasExpertChatAccess(userEmail);
  }

  /**
   * Verifica se l'utente può usare la diagnosi AI (ora gratuita per tutti)
   */
  static canUseAIDiagnosis(userEmail: string | undefined): boolean {
    // AI è sempre disponibile per tutti
    return true;
  }

  /**
   * Verifica se l'utente ha accesso illimitato alle diagnosi
   */
  static hasUnlimitedDiagnosis(userEmail: string | undefined): boolean {
    if (!userEmail) return false;
    
    // Solo account premium hanno accesso illimitato
    return PREMIUM_TEST_EMAILS.includes(userEmail.toLowerCase());
  }

  /**
   * Verifica se l'utente è un admin di test
   */
  static isTestAdmin(userEmail: string | undefined): boolean {
    if (!userEmail) return false;
    
    return ADMIN_TEST_EMAILS.includes(userEmail.toLowerCase());
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
  const hasUnlimitedDiagnosis = PremiumService.hasUnlimitedDiagnosis(userProfile?.email);
  const isTestAdmin = PremiumService.isTestAdmin(userProfile?.email);
  
  return {
    hasAIAccess,
    hasExpertChatAccess,
    hasUnlimitedDiagnosis,
    isTestAdmin,
    isPremium: hasExpertChatAccess,
    upgradeMessage: PremiumService.getPremiumUpgradeMessage()
  };
};
