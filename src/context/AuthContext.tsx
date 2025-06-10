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

/**
 * Provides authentication context for user management including login, registration, and profile updates.
 * @example
 * AuthContext({ children: <YourComponent /> })
 * Returns a context provider for authentication
 * @param {Object} { children } - React child components to be wrapped by AuthContext provider.
 * @returns {JSX.Element} AuthContext.Provider wrapping the children components.
 * @description
 *   - Manages user authentication state using Supabase.
 *   - Handles session management and side effects related to authentication state changes.
 *   - Includes helper methods for authentication tasks like login, logout, registration.
 *   - Automatically fetches and normalizes user profile data on authentication changes.
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Computed properties
  const isAuthenticated = !!user;
  const isProfileComplete = !!(userProfile?.firstName && userProfile?.lastName && userProfile?.birthDate && userProfile?.birthPlace);
  const isMasterAccount = userProfile?.email === 'agrotecnicomarconigro@gmail.com' || userProfile?.email === 'premium@gmail.com';

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
            if (mounted) {
              setLoading(false);
            }
          }, 0);
        } else {
          setUserProfile(null);
          if (mounted) {
            setLoading(false);
          }
        }
      }
    );

    // Check for existing session
    /**
    * Initializes user authentication session and retrieves user profile data
    * @example
    * sync()
    * Undefined
    * @param {boolean} mounted - Determines if the component using this function is still mounted.
    * @returns {void} Does not return a value.
    * @description
    *   - Fetches the session data from Supabase auth and checks the initial session status.
    *   - Updates the session and user state, and retrieves user profile if a session exists.
    *   - Handles errors during the session initialization process.
    *   - Ensures setLoading is called in the end to update UI loading state.
    */
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        console.log('Initial session check:', session?.user?.email);
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
    try {
      return await authenticateUser(email, password);
    } catch (error) {
      console.error('Login error in context:', error);
      return { success: false };
    }
  };

  /**
   * Updates the user profile with provided updates.
   * @example
   * sync({name: 'John'}) // Updates the user's name to 'John'
   * sync('age', 30) // Sets the user's age to 30
   * @param {Partial<UserProfile> | string} updates - Partial profile updates or a single field name.
   * @param {any} [value] - Value for the field when updates is a string.
   * @returns {void} Updates the user profile and refreshes it.
   * @description
   *   - Throws an error if the user is not authenticated.
   *   - Converts updates into a format suitable for the database.
   *   - Fetches and normalizes the user profile after updating to ensure it's up-to-date.
   */
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

export default AuthProvider;
