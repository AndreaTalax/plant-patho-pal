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
  };
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  updateProfile: (updates: {
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    birthPlace?: string;
  }) => Promise<void>;
  fetchUserProfile: (userId: User['id']) => Promise<void>;
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
  signIn: async () => {},
  signOut: async () => {},
  signUp: async () => {},
  updateProfile: async () => {},
  fetchUserProfile: async () => {},
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
    subscriptionPlan: 'free'
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const { data: { user: initialUser, session: initialSession } } = await supabase.auth.getSession();

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
            subscriptionPlan: 'free'
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
        subscriptionPlan: 'free'
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
  
  const updateProfile = async (updates: {
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    birthPlace?: string;
  }) => {
    try {
      setLoading(true);
      if (!user) {
        throw new Error("User not logged in");
      }
  
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates })
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
          subscriptionPlan: data.subscription_plan || 'free'
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };
  
  const value = {
    user,
    session,
    loading,
    userProfile,
    signIn,
    signOut,
    signUp,
    updateProfile,
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
