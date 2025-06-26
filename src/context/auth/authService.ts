
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserProfile } from './types';
import { getWhitelistedEmails } from './utils';
import { ConnectionService } from '@/services/chat/connectionService';

/**
 * Attempts to authenticate a user with given email and password and manages fallback authentication for whitelisted emails.
 */
export const authenticateUser = async (email: string, password: string): Promise<{ success: boolean }> => {
  try {
    console.log('Attempting login with:', email);
    
    // Lista delle email whitelisted con le loro password
    const whitelistedCredentials = {
      'agrotecnicomarconigro@gmail.com': 'marconigro93',
      'test@gmail.com': 'test123',
      'premium@gmail.com': 'premium123'
    };
    
    const emailLower = email.toLowerCase();
    
    // Controlla se è un email nella whitelist
    if (whitelistedCredentials[emailLower as keyof typeof whitelistedCredentials]) {
      const expectedPassword = whitelistedCredentials[emailLower as keyof typeof whitelistedCredentials];
      
      console.log('Email nella whitelist rilevata:', email);
      
      // Verifica la password per gli account whitelisted
      if (password === expectedPassword) {
        console.log('Password corretta per account whitelisted:', email);
        
        try {
          // Prima prova con la password originale fornita dall'utente
          let loginResult = await supabase.auth.signInWithPassword({
            email,
            password: password,
          });

          // Se fallisce, prova con temp123
          if (loginResult.error) {
            console.log('Tentativo con password originale fallito, provo con temp123');
            loginResult = await supabase.auth.signInWithPassword({
              email,
              password: 'temp123',
            });
          }

          if (loginResult.data.user && loginResult.data.session && !loginResult.error) {
            console.log('Login Supabase riuscito per:', email);
            
            // Assicuriamoci che il profilo esista
            await ensureProfileExists(loginResult.data.user.id, email);
            
            return { success: true };
          } else {
            console.log('Login fallito, provo a creare account per:', email);
            
            // Se il login fallisce, prova a creare l'account con temp123
            const { data: signupData, error: signupError } = await supabase.auth.signUp({
              email,
              password: 'temp123',
              options: {
                data: {
                  first_name: email === 'agrotecnicomarconigro@gmail.com' ? 'Marco' : 
                             email === 'test@gmail.com' ? 'Test' : 'User',
                  last_name: email === 'agrotecnicomarconigro@gmail.com' ? 'Nigro' : 
                            email === 'test@gmail.com' ? 'User' : 'Name'
                }
              }
            });
            
            // Se la creazione fallisce perché l'utente esiste già, non è un errore
            if (signupError && !signupError.message.includes('already registered')) {
              throw signupError;
            }
            
            if (signupData.user || signupError?.message.includes('already registered')) {
              console.log('Account exists or created, attempting login with temp123 for:', email);
              
              // Ora prova il login con temp123
              const { data: finalLoginData, error: finalLoginError } = await supabase.auth.signInWithPassword({
                email,
                password: 'temp123',
              });

              if (finalLoginData.user && finalLoginData.session && !finalLoginError) {
                console.log('Login finale riuscito per:', email);
                
                // Assicuriamoci che il profilo esista
                await ensureProfileExists(finalLoginData.user.id, email);
                
                return { success: true };
              } else {
                console.error('Login finale fallito:', finalLoginError);
                throw new Error('Unable to login to whitelisted account after creation');
              }
            }
            
            throw new Error('Unable to create whitelisted account');
          }
        } catch (authError) {
          console.error('Errore durante autenticazione whitelisted:', authError);
          throw new Error('Errore durante l\'autenticazione dell\'account amministratore');
        }
      } else {
        console.log('Password errata per account whitelisted:', email);
        throw new Error('Credenziali non valide per questo account amministratore');
      }
    }
    
    // Login normale per email non whitelisted
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
    
  } catch (error: any) {
    console.error('Login error:', error?.message || error);
    const errorMessage = error?.message || 'Errore durante il login';
    throw new Error(errorMessage);
  }
};

/**
 * Ensures that a profile exists for the given user, creating it if necessary
 */
const ensureProfileExists = async (userId: string, email: string) => {
  try {
    // Controlla se il profilo esiste già
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (!existingProfile) {
      console.log('Creating profile for user:', userId);
      
      // Determina il ruolo
      let role = 'user';
      if (email === 'agrotecnicomarconigro@gmail.com') {
        role = 'admin';
      } else if (email === 'test@gmail.com') {
        role = 'admin';
      } else if (email.includes('marco') || email.includes('fitopatologo')) {
        role = 'expert';
      }
      
      await createOrUpdateProfile(userId, {
        email: email,
        username: email.split('@')[0],
        first_name: email === 'agrotecnicomarconigro@gmail.com' ? 'Marco' : 
                   email === 'test@gmail.com' ? 'Test' : 'User',
        last_name: email === 'agrotecnicomarconigro@gmail.com' ? 'Nigro' : 
                  email === 'test@gmail.com' ? 'User' : 'Name',
        birth_date: '1990-01-01',
        birth_place: 'Roma',
        role: role,
        subscription_plan: 'premium'
      });
    } else {
      console.log('Profile already exists for user:', userId);
    }
  } catch (error) {
    console.error('Error ensuring profile exists:', error);
  }
};

/**
 * Creates or updates a user profile in the database based on the provided userId and profileData.
 * @example
 * sync("user123", { email: "user@example.com", username: "newUser" })
 * // Profile created/updated successfully
 * @param {string} userId - The unique identifier of the user whose profile is being updated.
 * @param {any} profileData - An object containing the user's profile details including email, username, first_name, last_name, phone, address, role, birth_date, birth_place, subscription_plan, avatar_url.
 * @returns {Promise<void>} Throws an error if the operation fails.
 * @description
 *   - Utilizes the Supabase client to upsert profile data into the 'profiles' table.
 *   - Sets default values for role and subscription_plan if not provided.
 *   - Logs success or error messages for operation tracking.
 */
export const createOrUpdateProfile = async (userId: string, profileData: any) => {
  try {
    console.log('Creating/updating profile for user:', userId);
    
    // Imposta il ruolo a 'admin' se test@gmail.com
    let role = profileData.role || 'user';
    if (profileData.email === 'test@gmail.com') {
      role = 'admin';
    }

    const dbProfileData = {
      id: userId,
      email: profileData.email || null,
      username: profileData.username || null,
      first_name: profileData.first_name || null,
      last_name: profileData.last_name || null,
      phone: profileData.phone || null,
      address: profileData.address || null,
      role: role,
      birth_date: profileData.birth_date || null,
      birth_place: profileData.birth_place || null,
      subscription_plan: profileData.subscription_plan || 'free',
      avatar_url: profileData.avatar_url || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(dbProfileData, {
        onConflict: 'id'
      });

    if (error) {
      console.error('Database error:', error?.message || error);
      throw error;
    }

    console.log('Profile created/updated successfully');
  } catch (error: any) {
    console.error('Error creating/updating profile:', error?.message || error);
    throw error;
  }
};

/**
 * Asynchronously fetches a user profile from the database, or creates a default profile if none exists.
 * @example
 * sync('12345')
 * // Returns a user profile object or a newly created default profile object
 * @param {string} userId - The unique identifier for the user whose profile is being fetched.
 * @returns {Promise<UserProfile | null>} Promise resolving to the fetched user profile or a default profile if none exists, or null if an error occurs.
 * @description
 *   - Attempts to retrieve a user's profile from the 'profiles' table using the provided userId.
 *   - If the profile does not exist, a default profile is created with pre-defined attributes and a 'free' subscription plan.
 *   - Utilizes Supabase client methods for querying the database.
 *   - Handles errors gracefully by logging them and returning null.
 */
export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const operation = async () => {
    console.log('Fetching user profile for:', userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile:', error.message || error);
      throw error;
    }

    if (data) {
      console.log('User profile fetched successfully:', data);
      return data;
    } else {
      console.log('No profile found for user, creating default profile:', userId);
      
      // Create a default profile if none exists
      const defaultProfile = {
        id: userId,
        email: null,
        username: null,
        first_name: null,
        last_name: null,
        birth_date: null,
        birth_place: null,
        role: 'user',
        subscription_plan: 'free'
      };
      
      await createOrUpdateProfile(userId, defaultProfile);
      return defaultProfile;
    }
  };

  try {
    // Use ConnectionService for robust error handling
    const result = await ConnectionService.withRetry(
      operation,
      'Fetch user profile'
    );
    return result;
  } catch (error: any) {
    console.error('Error fetching user profile:', error?.message || error);
    return null;
  }
};

/**
 * Registers a user with the provided email and password.
 * @example
 * sync('user@example.com', 'securePassword123')
 * // May throw an error if registration fails
 * @param {string} email - User's email address for registration.
 * @param {string} password - User's password for registration.
 * @returns {Promise<void>} A promise that resolves if registration is successful or throws an error otherwise.
 * @description
 *   - Utilizes Supabase authentication service for sign-up.
 *   - Displays success or error messages using toast notifications.
 *   - Error handling is performed to provide feedback in case of registration failure.
 */
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

/**
 * Updates a user's profile with the provided updates in the database.
 * @example
 * sync('12345', { username: 'newUsername', age: 30 })
 * // Success toast if updated, otherwise error handling
 * @param {string} userId - The unique identifier of the user whose profile is to be updated.
 * @param {any} updates - An object containing the fields to update in the user's profile.
 * @returns {void} The function does not return anything explicitly; it handles success and errors internally.
 * @description
 *   - Uses Supabase's `update` method to apply changes to the `profiles` table.
 *   - Displays a success toast message upon successful update.
 *   - Catches and logs any errors that arise during the profile update.
 *   - Throws the caught error for further error handling or debugging.
 */
export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
    
    toast.success('Profilo aggiornato con successo!');
  } catch (error: any) {
    console.error('Error updating profile:', error?.message || error);
    toast.error('Errore durante l\'aggiornamento del profilo');
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
