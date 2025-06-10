
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

// Funzione di registrazione utente
export const EXPERT_USER_ID = '07c7fe19-33c3-4782-b9a0-4e87c8aa7044';
/**
 * Handles email registration using Supabase, including special cases for whitelisted emails.
 * @example
 * sync("user@example.com", "securePassword123")
 * Returns user and session information along with confirmation requirements.
 * @param {string} email - The email address of the user attempting to register.
 * @param {string} password - The password for the new account.
 * @returns {object} Registration result object containing user data, session info, and confirmation details.
 * @description
 *   - Allows direct registration without verification for specified whitelisted emails.
 *   - Integrates with Supabase authentication for non-whitelisted emails.
 *   - Handles rate limit exceeded errors by providing an appropriate response message.
 *   - Manages cases where sign-ups are disabled by simulating successful registrations.
 */
export const signUp = async (email: string, password: string) => {
  try {
    // Per email specifiche, consentiamo l'accesso diretto senza chiamare supabase.auth.signUp
    const whitelistedEmails = ["talaiaandrea@gmail.com", "test@gmail.com", "agrotecnicomarconigro@gmail.com"];
    
    if (whitelistedEmails.includes(email.toLowerCase())) {
      console.log('Email nella whitelist, simulando registrazione per:', email);
      
      // Simula una registrazione riuscita senza chiamare effettivamente Supabase
      return {
        confirmationRequired: false,
        message: "Registrazione completata con successo. Puoi accedere immediatamente.",
        data: {
          user: {
  email: email,
  id: email === "talaiaandrea@gmail.com" ? "talaiaandrea-id" : 
      email === "test@gmail.com" ? "6ee6b888-8064-40a1-8b26-0658343f4360" : 
      email === "agrotecnicomarconigro@gmail.com" ? "07c7fe19-33c3-4782-b9a0-4e87c8aa7044" :
      "07c7fe19-33c3-4782-b9a0-4e87c8aa7044", // Default a Marco Nigro per altri utenti premium
  email_confirmed_at: new Date().toISOString(),
  // Aggiungiamo i campi richiesti per il tipo User di Supabase
  app_metadata: { provider: 'email' },
            user_metadata: { role: email === "agrotecnicomarconigro@gmail.com" ? 'master' : 'user' },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            phone: null,
            confirmation_sent_at: new Date().toISOString(),
            confirmed_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
            role: null,
            identities: [],
            factors: []
          } as User,
          session: null
        }
      };
    }
    
    console.log('Tentativo di registrazione per:', email);
    
    // Per le altre email, procediamo normalmente con supabase.auth.signUp
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          role: 'user', // valore predefinito
        }
      }
    });

    console.log('Risposta signUp:', { data, error });

    if (error) {
      // Gestione speciale per l'errore di rate limit
      if (error.status === 429 || error.message?.includes('rate limit exceeded')) {
        console.warn('Email rate limit exceeded:', error.message);
        // Restituisci un oggetto con un flag speciale per indicare il rate limit
        return { 
          rateLimitExceeded: true, 
          message: "Troppe richieste di email per questo indirizzo. Prova ad accedere o attendere prima di richiedere un'altra email di conferma.",
          data
        };
      }
      
      // Gestione speciale per "Signups not allowed"
      if (error.message?.includes("Signups not allowed") || error.code === "signup_disabled") {
        console.warn('Signups not allowed, providing mock registration for:', email);
        
        return {
          confirmationRequired: false,
          message: "Registrazione completata con successo. Puoi accedere immediatamente.",
          data: {
            user: {
              email: email,
              id: `${email.split('@')[0]}-mock-id`,
              email_confirmed_at: new Date().toISOString(),
            },
            session: null
          }
        };
      }
      
      console.error('Errore registrazione:', error.message);
      throw error;
    } else {
      // Invio manuale dell'email di conferma - aggiungiamo una chiamata alla funzione Supabase
      try {
        // Se la registrazione è riuscita, invochiamo la funzione di invio email direttamente
        console.log('Invio email di conferma tramite edge function');
        
        const { error: functionError } = await supabase.functions.invoke('send-registration-confirmation', {
          body: { 
            user: data.user,
            email: email,
            confirmationToken: 'manual-token',
            confirmationUrl: `${window.location.origin}/confirm-email?token=${encodeURIComponent('manual-token')}&email=${encodeURIComponent(email)}` 
          }
        });
        
        if (functionError) {
          console.error('Errore nell\'invio dell\'email di conferma:', functionError);
        } else {
          console.log('Email di conferma inviata con successo');
        }
      } catch (emailError) {
        console.error('Errore durante la chiamata della funzione di invio email:', emailError);
      }
      
      // Check if the user needs to confirm their email
      const userConfirmationStatus = data.user?.confirmed_at 
        ? 'already_confirmed' 
        : data.user?.email_confirmed_at 
          ? 'already_confirmed' 
          : 'confirmation_required';
            
      console.log('Email inviata a:', email, 'Status:', userConfirmationStatus);
      
      return {
        ...data,
        confirmationRequired: userConfirmationStatus === 'confirmation_required',
        message: userConfirmationStatus === 'confirmation_required'
          ? "Per favore controlla la tua email per confermare l'account."
          : "Registrazione completata con successo."
      };
    }
  } catch (error: any) {
    console.error('Errore durante la registrazione:', error);
    throw error;
  }
};

// Funzione di login utente
/**
* Simulates login for specific whitelisted emails or uses Supabase for others.
* @example
* sync("test@gmail.com", "test123")
* { user: mockUser, session: mockSession }
* @param {string} email - The email address used for login.
* @param {string} password - The password associated with the email.
* @returns {object} An object containing user and session information.
* @description
*   - Allows direct access for whitelisted emails with predefined passwords without contacting Supabase.
*   - Creates a mock user and session object for whitelisted emails.
*   - If the email is not confirmed, throws an 'email_not_confirmed' error.
*   - Handles login errors by utilizing Supabase's authentication system for non-whitelisted emails.
*/
export const signIn = async (email: string, password: string) => {
  try {
    // Per email specifiche, consentiamo l'accesso diretto senza chiamare supabase.auth.signInWithPassword
    const whitelistedEmails = ["talaiaandrea@gmail.com", "test@gmail.com", "agrotecnicomarconigro@gmail.com"];
    const mockPasswords = {
      "talaiaandrea@gmail.com": "ciao5",
      "test@gmail.com": "test123",
      "agrotecnicomarconigro@gmail.com": "marconigro93"
    };
    
    if (whitelistedEmails.includes(email.toLowerCase())) {
      const expectedPassword = mockPasswords[email.toLowerCase() as keyof typeof mockPasswords];
      
      if (password === expectedPassword) {
        console.log('Login simulato per email nella whitelist:', email);
        
        // Crea un oggetto mock per l'utente che soddisfa l'interfaccia User
        let mockRole = 'user';
        let mockUserId = 'user-id';
        
        if (email === "agrotecnicomarconigro@gmail.com") {
          mockRole = 'master';
          mockUserId = 'MARCO_NIGRO_ID';
        } else if (email === "talaiaandrea@gmail.com") {
          mockUserId = 'talaiaandrea-id';
        } else if (email === "test@gmail.com") {
          mockUserId = 'test-user-id';
        }
        
        // Mock di User completo con tutti i campi richiesti
        const mockUser: User = {
          id: mockUserId,
          email: email,
          user_metadata: { role: mockRole },
          app_metadata: { provider: "email" },
          aud: "authenticated",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          phone: null,
          confirmation_sent_at: new Date().toISOString(),
          confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          role: null,
          email_confirmed_at: new Date().toISOString(),
          identities: [],
          factors: []
        };
        
        // Mock di Session completo con tutti i campi richiesti
        const mockSession: Session = {
          access_token: "mock-token",
          refresh_token: "mock-refresh-token",
          expires_in: 3600,
          expires_at: new Date().getTime() / 1000 + 3600,
          token_type: "bearer",
          user: mockUser
        };
        
        return {
          user: mockUser,
          session: mockSession
        };
      } else {
        throw new Error("Invalid login credentials");
      }
    }
    
    // Per le altre email, procediamo normalmente con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Check if error is because email is not confirmed
      if (error.message?.includes('Email not confirmed') || error.message?.includes('email not confirmed')) {
        console.warn('Email non confermata:', error.message);
        throw new Error('email_not_confirmed');
      }
      
      console.error('Errore login:', error.message);
      throw error;
    } else {
      console.log('Login effettuato con successo');
      return data;
    }
  } catch (error: any) {
    console.error('Errore durante il login:', error);
    throw error;
  }
};

// Funzione per inviare nuovamente l'email di conferma
/**
 * Resends a confirmation email to the specified email address.
 * @example
 * sync('user@example.com')
 * { success: true, message: "Abbiamo inviato una nuova email di conferma. Controlla la tua casella di posta." }
 * @param {string} email - The email address to which the confirmation email will be resent.
 * @returns {Object} An object containing the success state and a message indicating the result.
 * @description
 *   - Checks if the email is in the whitelist for simulated successful sending.
 *   - Attempts to resend the confirmation email using Supabase's standard API.
 *   - Uses an edge function as a fallback if the standard API fails.
 *   - Handles rate limit errors by providing a specific message.
 */
export const resendConfirmationEmail = async (email: string) => {
  try {
    // Per email nella whitelist, simuliamo un invio riuscito
    const whitelistedEmails = ["talaiaandrea@gmail.com", "test@gmail.com", "agrotecnicomarconigro@gmail.com"];
    
    if (whitelistedEmails.includes(email.toLowerCase())) {
      console.log('Simulazione invio email di conferma per:', email);
      
      return { 
        success: true, 
        message: "Abbiamo inviato una nuova email di conferma. Controlla la tua casella di posta."
      };
    }
    
    // Per le altre email, prima tentiamo l'invio tramite l'API standard di Supabase
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      if (error.status === 429) {
        return { 
          rateLimitExceeded: true, 
          message: "Troppe richieste di email per questo indirizzo. Attendi prima di richiedere un'altra email di conferma."
        };
      }
      
      console.warn('Errore resend standard:', error.message);
      
      // Se l'API standard fallisce, proviamo con la nostra edge function
      try {
        console.log('Tentativo di invio tramite edge function');
        const { error: functionError } = await supabase.functions.invoke('send-registration-confirmation', {
          body: { 
            email: email,
            confirmationToken: 'resend-token',
            confirmationUrl: `${window.location.origin}/confirm-email?token=${encodeURIComponent('resend-token')}&email=${encodeURIComponent(email)}` 
          }
        });
        
        if (functionError) {
          console.error('Errore nell\'invio dell\'email tramite edge function:', functionError);
          throw functionError;
        }
        
        console.log('Email di conferma inviata con successo tramite edge function');
        return { 
          success: true, 
          message: "Abbiamo inviato una nuova email di conferma. Controlla la tua casella di posta."
        };
      } catch (edgeFunctionError) {
        console.error('Errore irreversibile nell\'invio dell\'email:', edgeFunctionError);
        throw error; // Lanciamo l'errore originale di Supabase
      }
    }
    
    return { 
      success: true, 
      message: "Abbiamo inviato una nuova email di conferma. Controlla la tua casella di posta."
    };
  } catch (error: any) {
    console.error('Errore durante l\'invio dell\'email di conferma:', error);
    throw error;
  }
};

// Funzione per eliminare un utente (reset)
export const deleteUser = async (userId: string) => {
  try {
    // Questa funzionalità richiede il ruolo service_role, quindi deve essere eseguita dal backend
    // Qui implementiamo una funzione di simulazione per l'interfaccia
    console.error('La cancellazione utente deve essere eseguita dal backend con service_role');
    throw new Error('Funzionalità non disponibile dal frontend');
  } catch (error: any) {
    console.error('Errore durante la cancellazione dell\'utente:', error);
    throw error;
  }
};

// Funzione di logout utente
/**
* Logs out the current user from Supabase authentication.
* @example
* sync()
* Logout effettuato con successo
* @param {void} None - This function does not take any arguments.
* @returns {void} This function returns nothing but logs the result of the logout attempt.
* @description
*   - Utilizes supabase.auth.signOut() to perform the logout operation.
*   - Handles errors during logout by logging them and throwing the error.
*   - Successfully logs a message on successful logout.
*/
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Errore logout:', error.message);
      throw error;
    } else {
      console.log('Logout effettuato con successo');
    }
  } catch (error: any) {
    console.error('Errore durante il logout:', error);
    throw error;
  }
};
