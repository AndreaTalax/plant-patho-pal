
import { supabase } from '@/integrations/supabase/client';

interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username?: string;
}

export const userAuthService = {
  async signUp(data: SignUpData) {
    console.log('Starting sign up process for:', data.email);
    
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          username: data.username,
        }
      }
    });

    if (signUpError) {
      console.error('Sign up error:', signUpError);
      throw signUpError;
    }

    if (!authData.user) {
      throw new Error('No user data returned from sign up');
    }

    console.log('User signed up successfully:', authData.user.id);
    
    // Note: Profile creation is handled by the database trigger
    // No automatic role assignment - roles must be assigned by admins
    
    return authData;
  },

  async signIn(email: string, password: string) {
    console.log('Signing in user:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }

    console.log('User signed in successfully:', data.user?.id);
    return data;
  },

  async signOut() {
    console.log('Signing out user');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
    console.log('User signed out successfully');
  },

  async resetPassword(email: string) {
    console.log('Requesting password reset for:', email);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error('Password reset error:', error);
      throw error;
    }

    console.log('Password reset email sent successfully');
  },

  async updatePassword(newPassword: string) {
    console.log('Updating user password');
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error('Password update error:', error);
      throw error;
    }

    console.log('Password updated successfully');
  }
};
