
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  birthDate?: string;
  birthPlace?: string;
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  birth_place?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  isMasterAccount: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile> | string, value?: any) => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Computed properties
  const isAuthenticated = !!user;
  const isProfileComplete = !!(userProfile?.firstName && userProfile?.lastName && userProfile?.birthDate && userProfile?.birthPlace);
  const isMasterAccount = userProfile?.email === 'premium@gmail.com';

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile when user is authenticated
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      if (data) {
        console.log('User profile fetched:', data);
        // Normalize the profile data to support both naming conventions
        const normalizedProfile: UserProfile = {
          id: data.id,
          email: data.email,
          firstName: data.first_name || data.firstName,
          lastName: data.last_name || data.lastName,
          username: data.username,
          birthDate: data.birth_date || data.birthDate,
          birthPlace: data.birth_place || data.birthPlace,
          first_name: data.first_name,
          last_name: data.last_name,
          birth_date: data.birth_date,
          birth_place: data.birth_place,
        };
        setUserProfile(normalizedProfile);
      } else {
        console.log('No profile found for user:', userId);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login with:', email);
      
      // Lista di email whitelisted per il login simulato
      const whitelistedEmails = [
        'test@gmail.com',
        'premium@gmail.com',
        'marco.nigro@drplant.it',
        'fitopatologo@drplant.it'
      ];
      
      if (whitelistedEmails.includes(email)) {
        console.log('Simulated login for whitelisted email:', email);
        
        // Crea un mock user object
        const mockUser: User = {
          id: email === 'premium@gmail.com' ? 'premium-user-id' : 'test-user-id',
          email: email,
          created_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          confirmation_sent_at: new Date().toISOString(),
          recovery_sent_at: new Date().toISOString(),
          email_change_sent_at: new Date().toISOString(),
          new_email: null,
          new_phone: null,
          invited_at: null,
          action_link: null,
          email_confirmed_at: new Date().toISOString(),
          phone_confirmed_at: null,
          confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          role: 'authenticated',
          updated_at: new Date().toISOString(),
          identities: []
        };

        // Crea un mock session object
        const mockSession: Session = {
          access_token: 'mock-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: 'mock-refresh-token',
          user: mockUser
        };

        setUser(mockUser);
        setSession(mockSession);
        
        // Crea automaticamente un profilo per l'utente se non esiste
        await createOrUpdateProfile(mockUser.id, {
          id: mockUser.id,
          email: email,
          username: email.split('@')[0],
          ...(email === 'premium@gmail.com' && {
            firstName: 'Marco',
            lastName: 'Nigro',
            first_name: 'Marco',
            last_name: 'Nigro',
            birthDate: '1980-01-01',
            birthPlace: 'Milano',
            birth_date: '1980-01-01',
            birth_place: 'Milano'
          })
        });
        
        toast.success('Login effettuato con successo!');
        return;
      }
      
      // Per email non whitelisted, prova il login normale
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        toast.success('Login effettuato con successo!');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Errore durante il login');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
      toast.success('Logout effettuato con successo!');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Errore durante il logout');
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast.success('Registrazione completata! Controlla la tua email per confermare l\'account.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Errore durante la registrazione');
      throw error;
    }
  };

  const createOrUpdateProfile = async (userId: string, profileData: Partial<UserProfile>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          ...profileData
        });

      if (error) throw error;

      // Refresh the profile data
      await fetchUserProfile(userId);
    } catch (error) {
      console.error('Error creating/updating profile:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile> | string, value?: any) => {
    if (!user) throw new Error('User not authenticated');

    try {
      let profileUpdates: Partial<UserProfile>;

      // Handle both old signature (field, value) and new signature (updates object)
      if (typeof updates === 'string') {
        profileUpdates = { [updates]: value };
      } else {
        profileUpdates = updates;
      }

      const { error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      if (error) throw error;

      // Refresh the profile data
      await fetchUserProfile(user.id);
      toast.success('Profilo aggiornato con successo!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Errore durante l\'aggiornamento del profilo');
      throw error;
    }
  };

  const updateUsername = async (username: string) => {
    await updateProfile({ username });
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password aggiornata con successo!');
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error('Errore durante l\'aggiornamento della password');
      throw error;
    }
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
