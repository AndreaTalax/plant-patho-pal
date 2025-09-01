
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isWhitelistedEmail, getExpectedPassword } from './credentialsService';
import { ensureProfileExists } from './profileService';

/**
 * Service for handling user authentication operations
 */

export const authenticateWhitelistedUser = async (email: string, password: string): Promise<{ success: boolean }> => {
  const expectedPassword = getExpectedPassword(email);
  
  console.log('Email nella whitelist rilevata:', email);
  
  // Supporta password aggiornate: niente controllo su password hardcoded
  console.log('Account whitelisted: provo login con la password fornita per', email);
  

  try {
    // Prova login diretto con Supabase usando la password fornita
    let { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password: password,
    });

    if (loginData.user && loginData.session && !loginError) {
      console.log('Login Supabase riuscito con password originale per:', email);
      await ensureProfileExists(loginData.user.id, email);
      return { success: true };
    }

    // Se fallisce con la password inserita, prova con la password whitelisted (se definita), poi con temp123
    if (expectedPassword && password !== expectedPassword) {
      console.log('Login con password fornita fallito, provo con password whitelisted per:', email);
      const { data: wlLoginData, error: wlLoginError } = await supabase.auth.signInWithPassword({
        email,
        password: expectedPassword,
      });

      if (wlLoginData.user && wlLoginData.session && !wlLoginError) {
        console.log('Login riuscito con password whitelisted per:', email);
        await ensureProfileExists(wlLoginData.user.id, email);
        return { success: true };
      }
    }

    console.log('Login con password fornita/whitelisted fallito, provo con temp123 per:', email);
    
    const { data: tempLoginData, error: tempLoginError } = await supabase.auth.signInWithPassword({
      email,
      password: 'temp123',
    });

    if (tempLoginData.user && tempLoginData.session && !tempLoginError) {
      console.log('Login Supabase riuscito con temp123 per:', email);
      await ensureProfileExists(tempLoginData.user.id, email);
      return { success: true };
    }

    // Se entrambi i login falliscono, l'account non esiste - crealo
    console.log('Nessun login riuscito, creo account per:', email);
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password: 'temp123',
      options: {
        data: {
          first_name: email === 'agrotecnicomarconigro@gmail.com' ? 'Marco' : 
                     email === 'test@gmail.com' ? 'Test' : 
                     email === 'talaiaandrea@gmail.com' ? 'Andrea' : 'User',
          last_name: email === 'agrotecnicomarconigro@gmail.com' ? 'Nigro' : 
                    email === 'test@gmail.com' ? 'User' : 
                    email === 'talaiaandrea@gmail.com' ? 'Talaia' : 'Name'
        }
      }
    });
    
    // Gestisce sia account creati che esistenti
    if (signupData.user || (signupError && signupError.message.includes('already registered'))) {
      console.log('Account creato/esistente, provo login finale con temp123 per:', email);
      
      // Aspetta un momento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Login finale
      const { data: finalLoginData, error: finalLoginError } = await supabase.auth.signInWithPassword({
        email,
        password: 'temp123',
      });

      if (finalLoginData.user && finalLoginData.session && !finalLoginError) {
        console.log('Login finale riuscito per:', email);
        await ensureProfileExists(finalLoginData.user.id, email);
        return { success: true };
      } else {
        console.error('Login finale fallito:', finalLoginError);
        throw new Error('Impossibile completare il login per l\'account amministratore');
      }
    } else {
      console.error('Errore durante la creazione dell\'account:', signupError);
      throw new Error('Impossibile creare l\'account amministratore');
    }
  } catch (authError) {
    console.error('Errore durante autenticazione whitelisted:', authError);
    throw new Error('Errore durante l\'autenticazione dell\'account amministratore');
  }
};

export const authenticateRegularUser = async (email: string, password: string): Promise<{ success: boolean }> => {
  console.log('Tentativo login normale per:', email);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (data.user && data.session && !error) {
    console.log('Login normale riuscito per:', email);
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
