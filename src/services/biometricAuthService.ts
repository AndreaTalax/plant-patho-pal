// Biometric authentication service
// Note: This service works only on native mobile apps with Capacitor
// To use biometric authentication, install: npm install @capacitor/biometric-auth

const BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

// Type definitions for dynamic imports
type BiometricModule = any;

export class BiometricAuthService {
  /**
   * Verifica se l'autenticazione biometrica è disponibile sul dispositivo
   */
  static async isAvailable(): Promise<boolean> {
    try {
      // Check if running in Capacitor environment
      if (typeof window !== 'undefined' && (window as any).Capacitor) {
        try {
          const module = await import('@capacitor/biometric-auth' as any) as BiometricModule;
          const result = await module.BiometricAuth.checkBiometry();
          return result.isAvailable;
        } catch {
          console.log('Biometric Auth plugin not installed');
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error('Biometric check error:', error);
      return false;
    }
  }

  /**
   * Ottiene il tipo di biometria supportata
   */
  static async getBiometryType(): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && (window as any).Capacitor) {
        try {
          const module = await import('@capacitor/biometric-auth' as any) as BiometricModule;
          const result = await module.BiometricAuth.checkBiometry();
          return result.biometryType || null;
        } catch {
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting biometry type:', error);
      return null;
    }
  }

  /**
   * Verifica se l'autenticazione biometrica è abilitata dall'utente
   */
  static async isEnabled(): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && (window as any).Capacitor) {
        const { Preferences } = await import('@capacitor/preferences');
        const { value } = await Preferences.get({ key: BIOMETRIC_ENABLED_KEY });
        return value === 'true';
      }
      // Fallback to localStorage for web
      return localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true';
    } catch (error) {
      console.error('Error checking if biometric is enabled:', error);
      return false;
    }
  }

  /**
   * Abilita l'autenticazione biometrica e salva le credenziali
   */
  static async enableBiometric(email: string, password: string): Promise<void> {
    try {
      // Verifica che la biometria sia disponibile
      const available = await this.isAvailable();
      if (!available) {
        throw new Error('Biometric authentication not available');
      }

      const credentials = JSON.stringify({ email, password });

      if (typeof window !== 'undefined' && (window as any).Capacitor) {
        const { Preferences } = await import('@capacitor/preferences');
        // Salva le credenziali
        await Preferences.set({
          key: BIOMETRIC_CREDENTIALS_KEY,
          value: credentials,
        });

        // Abilita la biometria
        await Preferences.set({
          key: BIOMETRIC_ENABLED_KEY,
          value: 'true',
        });
      } else {
        // Fallback to localStorage (less secure, for development only)
        localStorage.setItem(BIOMETRIC_CREDENTIALS_KEY, credentials);
        localStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      }

      console.log('✅ Biometric authentication enabled');
    } catch (error) {
      console.error('Error enabling biometric:', error);
      throw error;
    }
  }

  /**
   * Disabilita l'autenticazione biometrica e rimuove le credenziali
   */
  static async disableBiometric(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && (window as any).Capacitor) {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.remove({ key: BIOMETRIC_CREDENTIALS_KEY });
        await Preferences.remove({ key: BIOMETRIC_ENABLED_KEY });
      } else {
        localStorage.removeItem(BIOMETRIC_CREDENTIALS_KEY);
        localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
      }
      console.log('✅ Biometric authentication disabled');
    } catch (error) {
      console.error('Error disabling biometric:', error);
      throw error;
    }
  }

  /**
   * Autentica l'utente con biometria e restituisce le credenziali salvate
   */
  static async authenticate(): Promise<{ email: string; password: string } | null> {
    try {
      const enabled = await this.isEnabled();
      if (!enabled) {
        console.log('Biometric authentication not enabled');
        return null;
      }

      if (typeof window !== 'undefined' && (window as any).Capacitor) {
        try {
          const biometricModule = await import('@capacitor/biometric-auth' as any) as BiometricModule;
          const { Preferences } = await import('@capacitor/preferences');

          await biometricModule.BiometricAuth.authenticate({
            reason: 'Accedi con impronta digitale',
            title: 'Autenticazione',
            subtitle: 'Usa la tua impronta per accedere',
            description: 'Scansiona la tua impronta per continuare',
          });

          // Se l'autenticazione ha successo, recupera le credenziali
          const { value } = await Preferences.get({ key: BIOMETRIC_CREDENTIALS_KEY });
          
          if (!value) {
            console.log('No stored credentials found');
            return null;
          }

          const credentials = JSON.parse(value);
          return credentials;
        } catch (importError) {
          console.error('Biometric Auth plugin not available:', importError);
          return null;
        }
      } else {
        // For web/development - just return stored credentials
        const value = localStorage.getItem(BIOMETRIC_CREDENTIALS_KEY);
        if (!value) return null;
        return JSON.parse(value);
      }
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      
      // Gestisci l'errore in base al tipo
      if (error.code === 'USER_CANCELLED') {
        console.log('User cancelled biometric authentication');
      }
      
      return null;
    }
  }

  /**
   * Ottiene una descrizione user-friendly del tipo di biometria
   */
  static async getBiometryDescription(): Promise<string> {
    const type = await this.getBiometryType();
    
    switch (type) {
      case 'face-id':
        return 'Face ID';
      case 'touch-id':
        return 'Touch ID';
      case 'fingerprint':
        return 'Impronta digitale';
      case 'face-authentication':
        return 'Riconoscimento facciale';
      case 'iris-authentication':
        return 'Riconoscimento dell\'iride';
      default:
        return 'Autenticazione biometrica';
    }
  }
}

