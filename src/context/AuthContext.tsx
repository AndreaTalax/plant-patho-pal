
import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userProfile: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    birthDate: string;
    birthPlace: string;
    subscriptionPlan: string;
    phone?: string;
    address?: string;
    avatar_url?: string;
  };
  // Add missing props that are being used in the app
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  isMasterAccount: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  updateProfile: (field: string, value: string) => Promise<void>;
  fetchUserProfile: (userId: User['id']) => Promise<void>;
  // Alias functions for compatibility
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  session: null,
  loading: true,
  userProfile: {
    id: '',
    email: '',
    firstName: '',
    lastName: '',
    role: 'user',
    birthDate: '',
    birthPlace: '',
    subscriptionPlan: 'free'
  },
  isAuthenticated: false,
  isProfileComplete: false,
  isMasterAccount: false,
  signIn: async () => {},
  signOut: async () => {},
  signUp: async () => {},
  updateProfile: async () => {},
  fetchUserProfile: async () => {},
  login: async () => {},
  logout: async () => {},
  register: async () => {}
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({
    id: '',
    email: '',
    firstName: '',
    lastName: '',
    role: 'user',
    birthDate: '',
    birthPlace: '',
    subscriptionPlan: 'free',
    phone: '',
    address: ''
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const { data } = await supabase.auth.getSession();
        const initialUser = data.session?.user || null;
        const initialSession = data.session || null;

        setUser(initialUser);
        setSession(initialSession);

        if (initialUser) {
          await fetchUserProfile(initialUser.id);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Listen for auth state changes
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        setSession(session || null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUserProfile({
            id: '',
            email: '',
            firstName: '',
            lastName: '',
            role: 'user',
            birthDate: '',
            birthPlace: '',
            subscriptionPlan: 'free',
            phone: '',
            address: ''
          });
        }
      }
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        throw error;
      }
      setUser(data.user);
      setSession(data.session);
      
      if (data.user) {
        await fetchUserProfile(data.user.id);
      }
      
      toast.success('Accesso effettuato con successo!');
    } catch (error: any) {
      console.error('Error signing in:', error.message);
      toast.error(`Errore durante l'accesso: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setUser(null);
      setSession(null);
      setUserProfile({
        id: '',
        email: '',
        firstName: '',
        lastName: '',
        role: 'user',
        birthDate: '',
        birthPlace: '',
        subscriptionPlan: 'free',
        phone: '',
        address: ''
      });
      toast.success('Disconnesso con successo!');
      navigate('/auth');
    } catch (error: any) {
      console.error('Error signing out:', error.message);
      toast.error(`Errore durante la disconnessione: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        throw error;
      }
      
      if (user) {
        await fetchUserProfile(user.id);
      }
      
      toast.success('Registrazione effettuata con successo! Controlla la tua email per la verifica.');
    } catch (error: any) {
      console.error('Error signing up:', error.message);
      toast.error(`Errore durante la registrazione: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const updateProfile = async (field: string, value: string) => {
    try {
      setLoading(true);
      if (!user) {
        throw new Error("User not logged in");
      }
  
      // Convert snake_case field names to camelCase for the database
      const dbFieldName = field === 'firstName' ? 'first_name' : 
                          field === 'lastName' ? 'last_name' : 
                          field === 'birthDate' ? 'birth_date' :
                          field === 'birthPlace' ? 'birth_place' :
                          field === 'avatar_url' ? 'avatar_url' : field;
  
      const { data, error } = await supabase
        .from('profiles')
        .update({ [dbFieldName]: value })
        .eq('id', user.id);
  
      if (error) {
        throw error;
      }
  
      // After updating, fetch the updated profile
      await fetchUserProfile(user.id);
      
      toast.success('Profilo aggiornato con successo!');
    } catch (error: any) {
      console.error('Error updating profile:', error.message);
      toast.error(`Errore durante l'aggiornamento del profilo: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: User['id']) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return;
      }
      
      if (data) {
        setUserProfile({
          id: data.id,
          email: data.email,
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          role: data.role || 'user',
          birthDate: data.birth_date || '',
          birthPlace: data.birth_place || '',
          subscriptionPlan: data.subscription_plan || 'free',
          phone: data.phone || '',
          address: data.address || '',
          avatar_url: data.avatar_url || ''
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };
  
  // Computed properties
  const isAuthenticated = !!user && !!session;
  const isProfileComplete = !!(userProfile.firstName && userProfile.lastName && userProfile.birthDate && userProfile.birthPlace);
  const isMasterAccount = isAuthenticated && userProfile.role === 'expert';
  
  // Alias functions for compatibility
  const login = signIn;
  const logout = signOut;
  const register = signUp;
  
  const value = {
    user,
    session,
    loading,
    userProfile,
    isAuthenticated,
    isProfileComplete,
    isMasterAccount,
    signIn,
    signOut,
    signUp,
    updateProfile,
    fetchUserProfile,
    login,
    logout,
    register
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
