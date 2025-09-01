
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error?: string;
}

export interface AuthError {
  message: string;
  status?: number;
}

/**
 * Sign in with email and password
 */
export const signInWithPassword = async (
  email: string, 
  password: string
): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      console.error('Supabase sign in error:', error);
      return {
        user: null,
        session: null,
        error: error.message
      };
    }

    return {
      user: data.user,
      session: data.session,
    };
  } catch (error) {
    console.error('Unexpected sign in error:', error);
    return {
      user: null,
      session: null,
      error: 'An unexpected error occurred during sign in'
    };
  }
};

/**
 * Sign up with email and password
 */
export const signUpWithPassword = async (
  email: string, 
  password: string,
  metadata?: Record<string, any>
): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: metadata
      }
    });

    if (error) {
      console.error('Supabase sign up error:', error);
      return {
        user: null,
        session: null,
        error: error.message
      };
    }

    return {
      user: data.user,
      session: data.session,
    };
  } catch (error) {
    console.error('Unexpected sign up error:', error);
    return {
      user: null,
      session: null,
      error: 'An unexpected error occurred during sign up'
    };
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<{ error?: string }> => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase sign out error:', error);
      return { error: error.message };
    }

    return {};
  } catch (error) {
    console.error('Unexpected sign out error:', error);
    return { error: 'An unexpected error occurred during sign out' };
  }
};

/**
 * Get the current session
 */
export const getCurrentSession = async (): Promise<{ session: Session | null; error?: string }> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Get session error:', error);
      return { session: null, error: error.message };
    }

    return { session };
  } catch (error) {
    console.error('Unexpected get session error:', error);
    return { session: null, error: 'An unexpected error occurred while getting session' };
  }
};

/**
 * Get the current user
 */
export const getCurrentUser = async (): Promise<{ user: User | null; error?: string }> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Get user error:', error);
      return { user: null, error: error.message };
    }

    return { user };
  } catch (error) {
    console.error('Unexpected get user error:', error);
    return { user: null, error: 'An unexpected error occurred while getting user' };
  }
};

/**
 * Reset password
 */
export const resetPassword = async (email: string): Promise<{ error?: string }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      console.error('Reset password error:', error);
      return { error: error.message };
    }

    return {};
  } catch (error) {
    console.error('Unexpected reset password error:', error);
    return { error: 'An unexpected error occurred during password reset' };
  }
};

/**
 * Update password
 */
export const updatePassword = async (password: string): Promise<{ error?: string }> => {
  try {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error('Update password error:', error);
      return { error: error.message };
    }

    return {};
  } catch (error) {
    console.error('Unexpected update password error:', error);
    return { error: 'An unexpected error occurred during password update' };
  }
};
