
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { AuthState } from './types';
import { UserProfile } from '@/components/diagnose/types';

const MASTER_EMAIL = 'expert@plantpathopal.com';

export const useAuthState = (): AuthState & { 
  setUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile) => void;
  setIsAuthenticated: (value: boolean) => void;
  setIsProfileComplete: (value: boolean) => void;
  setIsMasterAccount: (value: boolean) => void;
} => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({ 
    email: '', 
    firstName: '', 
    lastName: '', 
    birthDate: '',
    birthPlace: ''
  });
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
            firstName: '',
            lastName: '',
            birthDate: '',
            birthPlace: '',
            id: user.id
          });
          setIsAuthenticated(true);
          
          // Check if this is the master account
          setIsMasterAccount(user.email === MASTER_EMAIL);
          
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
              firstName: data.first_name || '',
              lastName: data.last_name || '',
              birthDate: data.birth_date || '',
              birthPlace: data.birth_place || '',
              hasCompletedProfile: !!(data.first_name && data.last_name && data.birth_date && data.birth_place),
              subscriptionPlan: data.subscription_plan || 'free',
              phone: data.phone || '',
              address: data.address || ''
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
  }, []);

  return {
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
  };
};
