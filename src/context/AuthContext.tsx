
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
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile;
  isLoading: boolean;
  isAuthenticated: boolean;
  register: (email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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
    role: 'user'
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
          role: profile.role === 'master' ? 'master' : 'user'
        });
      }
    } catch (error) {
      console.error('Error in refreshProfile:', error);
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
            role: 'user'
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

  const login = async (email: string, password: string) => {
    console.log('AuthContext: Starting login for:', email);
    try {
      const result = await signIn(email, password);
      console.log('AuthContext: Login successful for:', email);
      return result;
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

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userProfile,
      isLoading,
      isAuthenticated,
      register,
      login,
      logout,
      refreshProfile
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
