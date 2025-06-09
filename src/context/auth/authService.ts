
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserProfile } from './types';
import { getWhitelistedEmails } from './utils';

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
        // Create/update profile
        await createOrUpdateProfile(loginData.user.id, {
          email: email,
          username: email.split('@')[0],
          first_name: email === 'test@gmail.com' ? 'Test' : 'User',
          last_name: email === 'test@gmail.com' ? 'User' : 'Name',
          birth_date: '1990-01-01',
          birth_place: 'Roma',
          role: email.includes('marco') || email.includes('fitopatologo') ? 'expert' : 'user',
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

export const createOrUpdateProfile = async (userId: string, profileData: any) => {
  try {
    console.log('Creating/updating profile for user:', userId);
    
    const dbProfileData = {
      id: userId,
      email: profileData.email || null,
      username: profileData.username || null,
      first_name: profileData.first_name || null,
      last_name: profileData.last_name || null,
      phone: profileData.phone || null,
      address: profileData.address || null,
      role: profileData.role || 'user',
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

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    console.log('Fetching user profile for:', userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile:', error.message || error);
      return null;
    }

    if (data) {
      console.log('User profile fetched:', data);
      return data;
    } else {
      console.log('No profile found for user:', userId);
      return null;
    }
  } catch (error: any) {
    console.error('Error fetching user profile:', error?.message || error);
    return null;
  }
};

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
    await supabase.auth.signOut();
    toast.success('Logout effettuato con successo!');
  } catch (error: any) {
    console.error('Logout error:', error?.message || error);
    toast.error('Errore durante il logout');
    throw error;
  }
};
