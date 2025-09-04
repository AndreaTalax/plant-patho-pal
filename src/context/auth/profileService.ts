
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserProfile } from './types';
import { determineUserRole, getUserDisplayName } from './credentialsService';

/**
 * Service for managing user profiles in the database
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
  } catch (error: any) {
    console.error('Error fetching user profile:', error?.message || error);
    return null;
  }
};

export const ensureProfileExists = async (userId: string, email: string) => {
  try {
    // Controlla se il profilo esiste già
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (!existingProfile) {
      console.log('Creating profile for user:', userId);
      
      const role = determineUserRole(email);
      const { firstName, lastName } = getUserDisplayName(email);
      
      await createOrUpdateProfile(userId, {
        email: email,
        username: email.split('@')[0],
        first_name: firstName,
        last_name: lastName,
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

export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
    
    // Controlla se non è un aggiornamento automatico (come creazione profilo)
    const isInitialProfileCreation = updates.first_name && updates.last_name && 
                                   !localStorage.getItem(`profile_toast_shown_${userId}`);
    
    if (isInitialProfileCreation) {
      // Marca che il toast è stato mostrato per questo utente
      localStorage.setItem(`profile_toast_shown_${userId}`, 'true');
      toast.success('Profilo creato con successo!');
    } else if (!updates.is_automatic_update) {
      // Mostra toast solo per aggiornamenti manuali espliciti
      toast.success('Profilo aggiornato con successo!');
    }
  } catch (error: any) {
    console.error('Error updating profile:', error?.message || error);
    toast.error('Errore durante l\'aggiornamento del profilo');
    throw error;
  }
};
