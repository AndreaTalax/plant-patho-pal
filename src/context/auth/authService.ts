
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/components/diagnose/types';

export const authService = {
  async login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  async register(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async updateProfile(userId: string, field: string, value: any) {
    // Map field names to database column names
    const fieldMapping: Record<string, string> = {
      firstName: 'first_name',
      lastName: 'last_name',
      birthDate: 'birth_date',
      birthPlace: 'birth_place',
      hasCompletedProfile: 'has_completed_profile',
      phone: 'phone',
      address: 'address',
      username: 'username' // Ensure username is properly mapped
    };
    
    const dbField = fieldMapping[field] || field;
    
    // Update in database
    const { error } = await supabase
      .from('profiles')
      .update({ [dbField]: value })
      .eq('id', userId);
      
    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  async updateUsername(userId: string, username: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', userId);
      
    if (error) {
      console.error('Error updating username:', error);
      throw error;
    }
  },
  
  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({
      password
    });
    
    if (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  },

  async getProfileData(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        return {
          id: userId,
          email: '', // This will be set from the auth user
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          birthDate: data.birth_date || '',
          birthPlace: data.birth_place || '',
          hasCompletedProfile: !!(data.first_name && data.last_name && data.birth_date && data.birth_place),
          subscriptionPlan: data.subscription_plan || 'free',
          phone: data.phone || '',
          address: data.address || ''
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting profile data:', error);
      return null;
    }
  }
};
