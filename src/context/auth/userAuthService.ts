import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isWhitelistedEmail, getExpectedPassword } from './credentialsService';
import { ensureProfileExists } from './profileService';

/**
 * Service for handling user authentication operations
 */

export const authenticateWhitelistedUser = async (email: string, password: string): Promise<{ success: boolean }> => {
  const expectedPassword = getExpectedPassword(email);
  
  console.log('🔐 Login per email whitelisted:', email);
  console.log('🔑 Password attesa:', expectedPassword);

  // Verifica prima la password corretta
  if (password !== expectedPassword) {
    console.log('❌ Password non corrisponde a quella attesa');
    throw new Error('Invalid login credentials');
  }

  console.log('✅ Password corretta, procedo con login Supabase per:', email);

  try {
    // Tenta il login diretto con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (data.user && data.session && !error) {
      console.log('✅ Login Supabase riuscito per:', email);
      await ensureProfileExists(data.user.id, email);
      return { success: true };
    }

    console.log('❌ Login Supabase fallito, errore:', error?.message);
    
    // Se il login fallisce, prova a creare/recuperare l'account
    console.log('🔄 Tentativo di creazione/recupero account per:', email);
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: email === 'test@gmail.com' ? 'Test' : 'User',
          last_name: email === 'test@gmail.com' ? 'User' : 'Name'
        }
      }
    });
    
    if (signupData.user || (signupError && signupError.message.includes('already registered'))) {
      console.log('✅ Account creato/esistente, riprovo login per:', email);
      
      // Attendi un momento prima di riprovare
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (retryData.user && retryData.session && !retryError) {
        console.log('✅ Login riuscito al secondo tentativo per:', email);
        await ensureProfileExists(retryData.user.id, email);
        return { success: true };
      }
    }

    throw new Error('Impossibile completare il login per l\'account amministratore');
  } catch (authError) {
    console.error('❌ Errore durante autenticazione whitelisted:', authError);
    throw new Error('Errore durante l\'autenticazione dell\'account amministratore');
  }
};

export const authenticateRegularUser = async (email: string, password: string): Promise<{ success: boolean }> => {
  console.log('🔐 Tentativo login normale per:', email);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (data.user && data.session && !error) {
    console.log('✅ Login normale riuscito per:', email);
    return { success: true };
  }
  
  throw new Error(error?.message || 'Invalid login credentials');
};

export const registerUser = async (email: string, password: string) => {
  try {
    console.log('🔄 Starting registration for:', email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: {
          email: email
        }
      }
    });
    
    if (error) {
      console.error('❌ Registration error:', error);
      throw error;
    }
    
    if (data.user) {
      console.log('✅ Registration successful for:', email);
      console.log('User data:', data.user);
      
      // Manually trigger confirmation email if needed
      if (data.user && !data.user.email_confirmed_at) {
        console.log('📧 Triggering confirmation email manually...');
        
        try {
          const { data: functionResult, error: functionError } = await supabase.functions.invoke(
            'send-registration-confirmation',
            {
              body: {
                user: data.user,
                email: email,
                confirmationUrl: data.user.confirmation_sent_at ? 
                  `${window.location.origin}/auth?token_hash=${data.user.id}&type=signup` : undefined
              }
            }
          );
          
          if (functionError) {
            console.error('❌ Error invoking confirmation function:', functionError);
          } else {
            console.log('✅ Confirmation email function triggered:', functionResult);
          }
        } catch (functionError) {
          console.error('❌ Error calling confirmation function:', functionError);
        }
      }
      
      toast.success('Registrazione completata!', {
        description: 'Ti abbiamo inviato un\'email di conferma. Controlla la tua casella di posta.',
        duration: 8000
      });
    }
    
    return data;
  } catch (error: any) {
    console.error('❌ Registration error:', error?.message || error);
    
    let errorMessage = 'Errore durante la registrazione';
    if (error?.message?.includes('already registered')) {
      errorMessage = 'Questo indirizzo email è già registrato. Prova ad accedere.';
    } else if (error?.message?.includes('weak_password')) {
      errorMessage = 'La password è troppo debole. Deve contenere almeno 6 caratteri.';
    }
    
    toast.error(errorMessage);
    throw error;
  }
};

export const updateUserPassword = async (password: string) => {
  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    toast.success('Password aggiornata con successo!');
  } catch (error: any) {
    console.error('Error updating password:', error?.message || error);
    toast.error('Errore durante l\'aggiornamento della password');
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    console.log('🔓 Effettuando logout...');
    
    // Effettua il logout da Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Errore durante il logout:', error);
      throw error;
    }
    
    console.log('✅ Logout completato con successo');
    toast.success('Logout effettuato con successo!');
    
    // Pulisci eventuali dati locali residui
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
    }
    
  } catch (error: any) {
    console.error('❌ Errore durante il logout:', error?.message || error);
    toast.error('Errore durante il logout');
    throw error;
  }
};
