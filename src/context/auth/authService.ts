import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserProfile } from './types';
import { getWhitelistedEmails } from './utils';
import { ConnectionService } from '@/services/ConnectionService';

/**
 * Attempts to authenticate a user with given email and password and manages fallback authentication for whitelisted emails.
 * @example
 * sync('example@gmail.com', 'password123')
 * { success: true }
 * @param {string} email - The user's email address used for authentication.
 * @param {string} password - The user's password used for authentication.
 * @returns {Promise<{ success: boolean }>} Resolves with a success boolean indicating the result of the authentication attempt.
 * @description
 *   - Uses Supabase's password-based authentication and includes fallback authentication for whitelisted emails.
 *   - Whitelisted emails can trigger automatic profile creation or updates if authentication is successful.
 *   - Suppresses errors during sign-up attempts for whitelisted emails when the user already exists.
 *   - Logs the process of the authentication attempt for debugging purposes.
 */
export const authenticateUser = async (email: string, password: string): Promise<{ success: boolean }> => {
  try {
    console.log('Attempting login with:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (data.user && data.session && !error) {
      console.log('Successful login:', email);
      return { success: true };
    }
    
    // Handle whitelisted emails with fallback authentication
    const whitelistedEmails = getWhitelistedEmails();
    
    if (whitelistedEmails.includes(email)) {
      console.log('Attempting fallback authentication for whitelisted email:', email);
      
      try {
        // Try sign up first (in case user doesn't exist)
        await supabase.auth.signUp({
          email,
          password: 'temp123',
          options: {
            data: {
              first_name: email === 'test@gmail.com' ? 'Test' : 'User',
              last_name: email === 'test@gmail.com' ? 'User' : 'Name'
            }
          }
        });
      } catch {
        // Ignore sign up errors, user might already exist
      }

      // Now try login with temp password
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: 'temp123',
      });

      if (loginData.user && loginData.session && !loginError) {
        // --- Ruolo admin per test@gmail.com
        let role = 'user';
        if (email === 'test@gmail.com') {
          role = 'admin';
        } else if (email.includes('marco') || email.includes('fitopatologo')) {
          role = 'expert';
        }
        // Create/update profile
        await createOrUpdateProfile(loginData.user.id, {
          email: email,
          username: email.split('@')[0],
          first_name: email === 'test@gmail.com' ? 'Test' : 'User',
          last_name: email === 'test@gmail.com' ? 'User' : 'Name',
          birth_date: '1990-01-01',
          birth_place: 'Roma',
          role: role,
          subscription_plan: email === 'premium@gmail.com' ? 'premium' : 'free'
        });
        
        return { success: true };
      }
    }
    
    throw new Error(error?.message || 'Invalid login credentials');
    
  } catch (error: any) {
    console.error('Login error:', error?.message || error);
    const errorMessage = error?.message || 'Errore durante il login';
    throw new Error(errorMessage);
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    if (data.user) {
      toast.success('Registrazione completata! Controlla la tua email per confermare l\'account.');
    }
  } catch (error: any) {
    console.error('Registration error:', error?.message || error);
    toast.error(error?.message || 'Errore durante la registrazione');
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
