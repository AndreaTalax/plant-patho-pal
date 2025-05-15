
import { supabase } from '@/integrations/supabase/client';

// Funzione di registrazione utente
export const signUp = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      }
    });

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
      
      console.error('Errore registrazione:', error.message);
      throw error;
    } else {
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
export const signIn = async (email: string, password: string) => {
  try {
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
export const resendConfirmationEmail = async (email: string) => {
  try {
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
      console.error('Errore invio email di conferma:', error.message);
      throw error;
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
