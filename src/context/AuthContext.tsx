import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any;
  userProfile: any; // Alias for profile to match component expectations
  loading: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<{ success: boolean; message: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updatesOrField: any | string, value?: any) => Promise<{ success: boolean; message: string }>;
  isMasterAccount: boolean;
  // Additional methods expected by components
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, userData?: any) => Promise<any>;
  updateUsername: (username: string) => void;
  updatePassword: (password: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const WHITELISTED_EMAILS = ['test@gmail.com', 'master@drplant.com'];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMasterAccount, setIsMasterAccount] = useState(false);

  // Computed properties
  const isAuthenticated = !!user;
  const isProfileComplete = !!(profile?.first_name && profile?.last_name && profile?.birth_date && profile?.birth_place);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setProfile(null);
        setIsMasterAccount(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        toast.error('Errore nel caricamento del profilo');
        return;
      }

      if (profile) {
        console.log('User profile loaded:', profile);
        setProfile(profile);
        setIsMasterAccount(profile.email === 'master@drplant.com' || profile.role === 'expert');
      } else {
        console.log('No profile found for user:', userId);
        // Profile doesn't exist yet, this is normal for new users
        setProfile(null);
        setIsMasterAccount(false);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Errore nel caricamento del profilo');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setLoading(true);

      if (WHITELISTED_EMAILS.includes(email)) {
        console.log('Simulated signup for whitelisted email:', email);
        
        // Create a mock user object for whitelisted emails
        const mockUser = {
          id: 'premium-user-id',
          email: email,
          user_metadata: userData,
          created_at: new Date().toISOString(),
        } as User;

        setUser(mockUser);
        setSession({
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: mockUser
        } as Session);

        // Create or update profile for whitelisted users
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: 'premium-user-id',
            email: email,
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone: userData.phone,
            role: email === 'master@drplant.com' ? 'expert' : 'user',
            subscription_plan: 'premium'
          }, {
            onConflict: 'id'
          });

        if (upsertError) {
          console.error('Error creating profile:', upsertError);
        }

        await fetchUserProfile('premium-user-id');
        
        return {
          success: true,
          message: 'Registrazione completata con successo!'
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) {
        return {
          success: false,
          message: error.message
        };
      }

      return {
        success: true,
        message: 'Registrazione completata! Controlla la tua email per la conferma.'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Errore durante la registrazione'
      };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Attempting login with:', email);

      if (WHITELISTED_EMAILS.includes(email)) {
        console.log('Simulated login for whitelisted email:', email);
        
        // Create a mock user object for whitelisted emails
        const mockUser = {
          id: 'premium-user-id',
          email: email,
          created_at: new Date().toISOString(),
        } as User;

        setUser(mockUser);
        setSession({
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: mockUser
        } as Session);

        // Ensure profile exists for whitelisted users
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', 'premium-user-id')
          .maybeSingle();

        if (!existingProfile) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: 'premium-user-id',
              email: email,
              role: email === 'master@drplant.com' ? 'expert' : 'user',
              subscription_plan: 'premium'
            });

          if (insertError) {
            console.error('Error creating profile:', insertError);
          }
        }

        await fetchUserProfile('premium-user-id');
        
        return {
          success: true,
          message: 'Login effettuato con successo!'
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return {
          success: false,
          message: error.message
        };
      }

      return {
        success: true,
        message: 'Login effettuato con successo!'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Errore durante il login'
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsMasterAccount(false);
    setLoading(false);
  };

  const updateProfile = async (updatesOrField: any | string, value?: any) => {
    if (!user) {
      return {
        success: false,
        message: 'Utente non autenticato'
      };
    }

    try {
      let updates: any;
      
      // Handle both calling patterns
      if (typeof updatesOrField === 'string' && value !== undefined) {
        // Two-argument pattern: updateProfile("fieldName", value)
        updates = { [updatesOrField]: value };
      } else {
        // Single-argument pattern: updateProfile({ field: value })
        updates = updatesOrField;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updates
        }, {
          onConflict: 'id'
        });

      if (error) {
        return {
          success: false,
          message: error.message
        };
      }

      await fetchUserProfile(user.id);
      
      return {
        success: true,
        message: 'Profilo aggiornato con successo!'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Errore durante l\'aggiornamento del profilo'
      };
    }
  };

  // Alias methods for component compatibility
  const login = async (email: string, password: string) => {
    const result = await signIn(email, password);
    if (!result.success) {
      throw new Error(result.message);
    }
  };

  const logout = async () => {
    await signOut();
  };

  const register = async (email: string, password: string, userData?: any) => {
    const result = await signUp(email, password, userData || {});
    if (result.success) {
      return { confirmationRequired: true, message: result.message };
    } else {
      throw new Error(result.message);
    }
  };

  // Simple update functions for username and password
  const updateUsername = (username: string) => {
    updateProfile({ username });
  };

  const updatePassword = (password: string) => {
    // Note: Password updates would typically go through Supabase auth
    console.log('Password update requested - implement through Supabase auth');
  };

  const value = {
    user,
    session,
    profile,
    userProfile: profile, // Alias for component compatibility
    loading,
    isAuthenticated,
    isProfileComplete,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isMasterAccount,
    login,
    logout,
    register,
    updateUsername,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
