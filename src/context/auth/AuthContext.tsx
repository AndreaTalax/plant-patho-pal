
import React, { createContext, useContext } from 'react';
import { User } from '@supabase/supabase-js';
import { AuthContextType } from './types';
import { useAuthState } from './useAuthState';
import { authService } from './authService';
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: { email: '', firstName: '', lastName: '', birthDate: '', birthPlace: '' },
  isAuthenticated: false,
  isProfileComplete: false,
  isMasterAccount: false,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: () => {},
  updateUsername: async () => {},
  updatePassword: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { 
    user, 
    userProfile, 
    isAuthenticated, 
    isProfileComplete, 
    isMasterAccount, 
    loading,
    setUser,
    setUserProfile,
    setIsAuthenticated,
    setIsProfileComplete,
    setIsMasterAccount
  } = useAuthState();

  // Set up auth state listener
  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setUserProfile({
            email: session.user.email || '',
            firstName: '',
            lastName: '',
            birthDate: '',
            birthPlace: '',
            id: session.user.id
          });
          setIsAuthenticated(true);
          
          // Check if this is the master account
          setIsMasterAccount(session.user.email === 'expert@plantpathopal.com');
          
          // Fetch user profile data after sign in
          const profileData = await authService.getProfileData(session.user.id);
          if (profileData) {
            const updatedProfile = {
              ...profileData,
              email: session.user.email || ''
            };
            setUserProfile(updatedProfile);
            
            setIsProfileComplete(!!(
              profileData.firstName && 
              profileData.lastName && 
              profileData.birthDate && 
              profileData.birthPlace
            ));
          } else {
            // No profile data yet
            setIsProfileComplete(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserProfile({ 
            email: '', 
            firstName: '', 
            lastName: '', 
            birthDate: '',
            birthPlace: '' 
          });
          setIsAuthenticated(false);
          setIsMasterAccount(false);
          setIsProfileComplete(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setUserProfile, setIsAuthenticated, setIsProfileComplete, setIsMasterAccount]);

  const login = async (email: string, password: string) => {
    await authService.login(email, password);
  };

  const register = async (email: string, password: string) => {
    return await authService.register(email, password);
  };

  const logout = async () => {
    await authService.logout();
  };

  const updateProfile = async (field: string, value: any) => {
    if (!user) return;
    
    try {
      // Update local state
      setUserProfile(prev => ({ ...prev, [field]: value }));
      
      // Update in database
      await authService.updateProfile(user.id, field, value);
      
      // Update profile completeness status
      if (field === 'firstName' || field === 'lastName' || field === 'birthDate' || field === 'birthPlace') {
        const isComplete = !!(
          userProfile.firstName || (field === 'firstName' && value),
          userProfile.lastName || (field === 'lastName' && value),
          userProfile.birthDate || (field === 'birthDate' && value),
          userProfile.birthPlace || (field === 'birthPlace' && value)
        );
        
        setIsProfileComplete(isComplete);
      }
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  };

  const updateUsername = async (username: string) => {
    if (!user) return;
    
    try {
      await authService.updateUsername(user.id, username);
      
      // Update local state
      setUserProfile(prev => ({ ...prev, username }));
    } catch (error) {
      console.error('Error in updateUsername:', error);
      throw error;
    }
  };
  
  const updatePassword = async (password: string) => {
    try {
      await authService.updatePassword(password);
    } catch (error) {
      console.error('Error in updatePassword:', error);
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    isAuthenticated,
    isProfileComplete,
    isMasterAccount,
    loading,
    login,
    register,
    logout,
    updateProfile,
    updateUsername,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
