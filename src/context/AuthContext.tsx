
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { 
  UserProfile, 
  AuthContextType 
} from './auth/types';
import { 
  normalizeProfile, 
  convertProfileUpdates 
} from './auth/utils';
import {
  authenticateUser,
  fetchUserProfile,
  registerUser,
  updateUserProfile,
  updateUserPassword,
  signOutUser
} from './auth/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Computed properties
  const isAuthenticated = !!user;
  const isProfileComplete = !!(userProfile?.firstName && userProfile?.lastName && userProfile?.birthDate && userProfile?.birthPlace);
  const isMasterAccount = userProfile?.email === 'premium@gmail.com' || userProfile?.email === 'test@gmail.com';

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid blocking the auth state change
          setTimeout(async () => {
            if (!mounted) return;
            const profile = await fetchUserProfile(session.user.id);
            if (mounted && profile) {
              setUserProfile(normalizeProfile(profile));
            }
            setLoading(false);
          }, 0);
        } else {
          setUserProfile(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          if (mounted && profile) {
            setUserProfile(normalizeProfile(profile));
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean }> => {
    return authenticateUser(email, password);
  };

  const updateProfile = async (updates: Partial<UserProfile> | string, value?: any) => {
    if (!user) throw new Error('User not authenticated');
    
    let profileUpdates: any;
    if (typeof updates === 'string') {
      profileUpdates = { [updates]: value };
    } else {
      profileUpdates = updates;
    }

    const dbUpdates = convertProfileUpdates(profileUpdates);
    await updateUserProfile(user.id, dbUpdates);
    
    // Refresh profile
    const profile = await fetchUserProfile(user.id);
    if (profile) {
      setUserProfile(normalizeProfile(profile));
    }
  };

  const updateUsername = async (username: string) => {
    await updateProfile({ username });
  };

  const updatePassword = async (password: string) => {
    await updateUserPassword(password);
  };

  const logout = async () => {
    await signOutUser();
    setUser(null);
    setSession(null);
    setUserProfile(null);
  };

  const register = async (email: string, password: string) => {
    await registerUser(email, password);
  };

  const value: AuthContextType = {
    user,
    session,
    userProfile,
    isAuthenticated,
    isProfileComplete,
    isMasterAccount,
    loading,
    login,
    logout,
    register,
    updateProfile,
    updateUsername,
    updatePassword,
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
