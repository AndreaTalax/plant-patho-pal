
import { useAuth } from '@/context/AuthContext';

export const PREMIUM_TEST_EMAILS = [
  'test@gmail.com',
  'agrotecnicomarconigro@gmail.com',
  'premium@gmail.com',
  // test@gmail.com ha TUTTE le funzionalità attive senza limiti
];

export class PremiumService {
  /**
   * Verifica se l'utente ha accesso alle funzionalità premium
   */
  static hasExpertChatAccess(userEmail: string | undefined): boolean {
    console.log('🔍 [PREMIUM] hasExpertChatAccess called with:', userEmail);
    
    if (!userEmail) {
      console.log('❌ [PREMIUM] No email provided');
      return false;
    }
    
    const lowerEmail = userEmail.toLowerCase();
    
    // test@gmail.com ha accesso completo senza limiti
    if (lowerEmail === 'test@gmail.com') {
      console.log('✅ [PREMIUM] test@gmail.com detected - granting full access');
      return true;
    }
    
    // Altri email di test con accesso premium
    const hasAccess = PREMIUM_TEST_EMAILS.includes(lowerEmail);
    console.log(`📧 [PREMIUM] ${lowerEmail} access result:`, hasAccess);
    
    return hasAccess;
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
    // test@gmail.com ha accesso illimitato
    if (userEmail?.toLowerCase() === 'test@gmail.com') return true;
    
    // AI è sempre disponibile per tutti
    return true;
  }

  /**
   * Verifica se l'utente ha limiti (test@gmail.com non ha limiti)
   */
  static hasLimits(userEmail: string | undefined): boolean {
    // test@gmail.com non ha limiti
    if (userEmail?.toLowerCase() === 'test@gmail.com') return false;
    
    // Altri utenti possono avere limiti
    return !PREMIUM_TEST_EMAILS.includes(userEmail?.toLowerCase() || '');
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
  const { userProfile, user } = useAuth();
  
  // Prova prima userProfile.email, poi user.email come fallback
  const userEmail = userProfile?.email || user?.email;
  
  console.log('🔍 [PREMIUM] Checking access for:', {
    userProfileEmail: userProfile?.email,
    userEmail: user?.email,
    finalEmail: userEmail,
    isTestUser: userEmail?.toLowerCase() === 'test@gmail.com'
  });
  
  const hasExpertChatAccess = PremiumService.canUseExpertChat(userEmail);
  const hasAIAccess = PremiumService.canUseAIDiagnosis(userEmail);
  
  console.log('✅ [PREMIUM] Access results:', {
    email: userEmail,
    hasExpertChatAccess,
    hasAIAccess,
    isPremium: hasExpertChatAccess
  });
  
  return {
    hasAIAccess,
    hasExpertChatAccess,
    isPremium: hasExpertChatAccess,
    upgradeMessage: PremiumService.getPremiumUpgradeMessage()
  };
};
