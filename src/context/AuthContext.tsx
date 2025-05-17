
// Update the AuthContext with additional user profile fields
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface UserProfile {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  birthPlace?: string;
  hasCompletedProfile?: boolean;
  subscriptionPlan?: 'free' | 'premium';
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  isMasterAccount: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  updateProfile: (field: string, value: any) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: { email: '' },
  isAuthenticated: false,
  isProfileComplete: false,
  isMasterAccount: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({ email: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isMasterAccount, setIsMasterAccount] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if the user is already logged in
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          setUserProfile({
            email: user.email || '',
            id: user.id
          });
          setIsAuthenticated(true);
          
          // Check if this is the master account
          setIsMasterAccount(user.email === 'expert@plantpathopal.com');
          
          // Fetch user profile data
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (data && !error) {
            setUserProfile({
              id: user.id,
              email: user.email || '',
              firstName: data.first_name,
              lastName: data.last_name,
              birthDate: data.birth_date,
              birthPlace: data.birth_place,
              hasCompletedProfile: !!(data.first_name && data.last_name && data.birth_date && data.birth_place),
              subscriptionPlan: data.subscription_plan || 'free'
            });
            
            setIsProfileComplete(!!(data.first_name && data.last_name && data.birth_date && data.birth_place));
          } else {
            // No profile data yet
            setIsProfileComplete(false);
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setUserProfile({
            email: session.user.email || '',
            id: session.user.id
          });
          setIsAuthenticated(true);
          
          // Check if this is the master account
          setIsMasterAccount(session.user.email === 'expert@plantpathopal.com');
          
          // Fetch user profile data after sign in
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (data && !error) {
            setUserProfile({
              id: session.user.id,
              email: session.user.email || '',
              firstName: data.first_name,
              lastName: data.last_name,
              birthDate: data.birth_date,
              birthPlace: data.birth_place,
              hasCompletedProfile: !!(data.first_name && data.last_name && data.birth_date && data.birth_place),
              subscriptionPlan: data.subscription_plan || 'free'
            });
            
            setIsProfileComplete(!!(data.first_name && data.last_name && data.birth_date && data.birth_place));
          } else {
            // No profile data yet
            setIsProfileComplete(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserProfile({ email: '' });
          setIsAuthenticated(false);
          setIsMasterAccount(false);
          setIsProfileComplete(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const register = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateProfile = async (field: string, value: any) => {
    if (!user) return;
    
    try {
      // Update local state
      setUserProfile(prev => ({ ...prev, [field]: value }));
      
      // Map field names to database column names
      const fieldMapping: Record<string, string> = {
        firstName: 'first_name',
        lastName: 'last_name',
        birthDate: 'birth_date',
        birthPlace: 'birth_place',
        hasCompletedProfile: 'has_completed_profile'
      };
      
      const dbField = fieldMapping[field] || field;
      
      // Update in database
      const { error } = await supabase
        .from('profiles')
        .update({ [dbField]: value })
        .eq('id', user.id);
        
      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
      
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

  const value = {
    user,
    userProfile,
    isAuthenticated,
    isProfileComplete,
    isMasterAccount,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
