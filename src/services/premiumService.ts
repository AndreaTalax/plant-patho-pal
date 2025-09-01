
import { useAuth } from '@/context/AuthContext';

export const PREMIUM_TEST_EMAILS = [
  'test@gmail.com',
  'agrotecnicomarconigro@gmail.com',
  'premium@gmail.com',
  'talaiaandrea@gmail.com',
  // Aggiungi altri email di test qui
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
    
    // Account di test hanno sempre accesso
    return PREMIUM_TEST_EMAILS.includes(userEmail.toLowerCase());
  }

  /**
   * Verifica se l'utente può usare la chat con l'esperto (sempre premium)
   */
  static canUseExpertChat(userEmail: string | undefined): boolean {
    return this.hasExpertChatAccess(userEmail);
  }

  /**
   * Verifica se l'utente può usare la diagnosi AI (3 gratuite + illimitato per premium)
   */
  static canUseAIDiagnosis(userEmail: string | undefined, hasUsedFreeDiagnoses: boolean = false): boolean {
    // Account premium hanno sempre accesso
    if (userEmail && this.hasExpertChatAccess(userEmail)) {
      return true;
    }
    
    // Utenti normali: solo se non hanno esaurito le diagnosi gratuite
    return !hasUsedFreeDiagnoses;
  }

  /**
   * Verifica se l'utente ha accesso illimitato alle diagnosi
   */
  static hasUnlimitedDiagnosis(userEmail: string | undefined): boolean {
    if (!userEmail) return false;
    
    // Account premium hanno sempre accesso illimitato
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
    return "Aggiorna a Premium per accedere alla chat con l'esperto fitopatologo e a diagnosi AI illimitate.";
  }

  /**
   * Ottiene il messaggio per il limite delle diagnosi AI gratuite
   */
  static getFreeDiagnosisLimitMessage(): string {
    return "Hai esaurito le 3 diagnosi AI gratuite. Aggiorna a Premium per diagnosi illimitate e chat con l'esperto.";
  }
}

/**
 * Hook per verificare lo status premium dell'utente corrente
 */
export const usePremiumStatus = () => {
  const { userProfile } = useAuth();
  
  const hasExpertChatAccess = PremiumService.canUseExpertChat(userProfile?.email);
  const hasUnlimitedDiagnosis = PremiumService.hasUnlimitedDiagnosis(userProfile?.email);
  const isTestAdmin = PremiumService.isTestAdmin(userProfile?.email);
  
  // hasAIAccess per compatibilità - indica se l'utente ha accesso base all'AI (anche gratuito)
  const hasAIAccess = true; // Tutti hanno accesso base all'AI (con limite per utenti normali)
  
  return {
    hasAIAccess,
    hasExpertChatAccess,
    hasUnlimitedDiagnosis,
    isTestAdmin,
    isPremium: hasExpertChatAccess,
    upgradeMessage: PremiumService.getPremiumUpgradeMessage(),
    freeLimitMessage: PremiumService.getFreeDiagnosisLimitMessage(),
    canUseAIDiagnosis: (hasUsedFreeDiagnoses: boolean) => 
      PremiumService.canUseAIDiagnosis(userProfile?.email, hasUsedFreeDiagnoses)
  };
};
