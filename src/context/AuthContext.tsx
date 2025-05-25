
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { signUp, signIn, signOut } from '@/integrations/supabase/auth';
import { useAuthEventLogger } from '@/hooks/useAuthEventLogger';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  birthPlace: string;
  email: string;
  role: 'user' | 'master';
  phone?: string;
  address?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile;
  isLoading: boolean;
  isAuthenticated: boolean;
  isMasterAccount: boolean;
  isProfileComplete: boolean;
  register: (email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (field: keyof UserProfile, value: string) => void;
  updateUsername: (username: string) => void;
  updatePassword: (password: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    birthPlace: '',
    email: '',
    role: 'user',
    phone: '',
    address: '',
    avatarUrl: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize the auth event logger
  useAuthEventLogger();

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      if (profile) {
        setUserProfile({
          id: profile.id,
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          birthDate: profile.birth_date || '',
          birthPlace: profile.birth_place || '',
          email: profile.email || user.email || '',
          role: profile.role === 'master' ? 'master' : 'user',
          phone: profile.phone || '',
          address: profile.address || '',
          avatarUrl: profile.avatar_url || ''
        });
      }
    } catch (error) {
      console.error('Error in refreshProfile:', error);
    }
  };

  const updateProfile = (field: keyof UserProfile, value: string) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
    
    // Update in database if user is authenticated
    if (user) {
      const dbField = field === 'firstName' ? 'first_name' :
                     field === 'lastName' ? 'last_name' :
                     field === 'birthDate' ? 'birth_date' :
                     field === 'birthPlace' ? 'birth_place' :
                     field === 'avatarUrl' ? 'avatar_url' :
                     field;
      
      supabase
        .from('profiles')
        .update({ [dbField]: value })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating profile:', error);
          }
        });
    }
  };

  const updateUsername = (username: string) => {
    // For now, we'll just update the first name as username
    updateProfile('firstName', username);
  };

  const updatePassword = async (password: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        console.error('Error updating password:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updatePassword:', error);
      throw error;
    }
  };

  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener...');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state changed', { event, hasSession: !!session });
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to defer profile fetching and avoid potential deadlocks
          setTimeout(() => {
            refreshProfile();
          }, 0);
        } else {
          // Reset profile when user logs out
          setUserProfile({
            id: '',
            firstName: '',
            lastName: '',
            birthDate: '',
            birthPlace: '',
            email: '',
            role: 'user',
            phone: '',
            address: '',
            avatarUrl: ''
          });
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Initial session check', { hasSession: !!session });
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          refreshProfile();
        }, 0);
      }
      
      setIsLoading(false);
    });

    return () => {
      console.log('AuthContext: Cleaning up auth state listener...');
      subscription.unsubscribe();
    };
  }, []);

  const register = async (email: string, password: string) => {
    console.log('AuthContext: Starting registration for:', email);
    try {
      const result = await signUp(email, password);
      console.log('AuthContext: Registration result:', result);
      return result;
    } catch (error) {
      console.error('AuthContext: Registration error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    console.log('AuthContext: Starting login for:', email);
    try {
      await signIn(email, password);
      console.log('AuthContext: Login successful for:', email);
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    console.log('AuthContext: Starting logout...');
    try {
      await signOut();
      console.log('AuthContext: Logout successful');
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
      throw error;
    }
  };

  const isAuthenticated = !!user;
  const isMasterAccount = userProfile.role === 'master';
  const isProfileComplete = userProfile.firstName && userProfile.lastName && userProfile.birthDate && userProfile.birthPlace;

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userProfile,
      isLoading,
      isAuthenticated,
      isMasterAccount,
      isProfileComplete: !!isProfileComplete,
      register,
      login,
      logout,
      refreshProfile,
      updateProfile,
      updateUsername,
      updatePassword
    }}>
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
