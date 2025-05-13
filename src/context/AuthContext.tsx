import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase, EXPERT_ID } from '@/integrations/supabase/client';
import { Session, User } from "@supabase/supabase-js";

// Define type for user profile
type UserProfile = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  role: "user" | "master"; // Limited to these specific values
};

type AuthContextType = {
  isAuthenticated: boolean;
  username: string;
  userProfile: UserProfile;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string) => Promise<void>;
  updateUsername: (newUsername: string) => void;
  updatePassword: (newPassword: string) => void;
  updateProfile: (field: keyof UserProfile, value: string) => void;
  isProfileComplete: boolean;
  isMasterAccount: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for development when Supabase is not configured
const MOCK_USERS = [
  {
    email: "test@test.com",
    password: "test123",
    role: "user" as const
  },
  {
    email: "test@gmail.com", // Added test user
    password: "test123",
    role: "user" as const
  },
  {
    email: "talaiaandrea@gmail.com",
    password: "ciao5",
    role: "user" as const
  },
  {
    email: "agrotecnicomarconigro@gmail.com",
    password: "marconigro93",
    role: "master" as const
  }
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    role: "user" as const
  });
  
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isMasterAccount, setIsMasterAccount] = useState(false);
  
  // Check for active session on load
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session);
        
        if (session?.user) {
          // Initialize user profile with data from session
          const email = session.user.email || '';
          const usernameFromEmail = email.split('@')[0];
          
          setUsername(usernameFromEmail);
          setUserProfile(prev => ({ 
            ...prev,
            username: usernameFromEmail,
            email: email
          }));
          
          // Fetch user profile from database
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        }
      }
    );
    
    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      
      if (session?.user) {
        // Initialize user profile with data from session
        const email = session.user.email || '';
        const usernameFromEmail = email.split('@')[0];
        
        setUsername(usernameFromEmail);
        setUserProfile(prev => ({ 
          ...prev,
          username: usernameFromEmail,
          email: email
        }));
        
        // Fetch user profile from database
        fetchUserProfile(session.user.id);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Simplified profile fetching to avoid type recursion
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        // Use explicit type casting to avoid deep recursion
        const username = (data as any).username || (data as any).email?.split('@')[0] || '';
        
        setUsername(username);
        setUserProfile({
          username: username,
          firstName: (data as any).first_name || '',
          lastName: (data as any).last_name || '',
          email: (data as any).email || user?.email || '',
          phone: (data as any).phone || '',
          address: (data as any).address || '',
          role: ((data as any).role as "user" | "master") || 'user'
        });
        
        setIsProfileComplete(!!(data as any).first_name && !!(data as any).last_name);
        setIsMasterAccount((data as any).role === "master");
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    setIsProfileComplete(!!userProfile.firstName && !!userProfile.lastName);
    setIsMasterAccount(userProfile.role === "master");
  }, [userProfile.firstName, userProfile.lastName, userProfile.role]);

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login with:", email, password);
      
      // Special case for the test user
      if (email === "test@gmail.com" && password === "test123") {
        console.log("Using test account mock login");
        
        // Set authenticated state for the test user
        setIsAuthenticated(true);
        
        // Create a mock user object
        const mockUser = {
          id: "test-user-id",
          email: "test@gmail.com",
        };
        
        // @ts-ignore - We're creating a mock user object
        setUser(mockUser);
        
        // Set up user profile for test user
        setUsername("testuser");
        setUserProfile({
          username: "testuser",
          firstName: "Test",
          lastName: "User",
          email: "test@gmail.com",
          phone: "",
          address: "",
          role: "user"
        });
        
        setIsProfileComplete(true);
        return Promise.resolve();
      }
      
      // Special case for premium user (Plant Pathologist)
      if (email === "agrotecnicomarconigro@gmail.com" && password === "marconigro93") {
        console.log("Using premium account mock login");
        
        // Set authenticated state for the premium user
        setIsAuthenticated(true);
        
        // Create a mock user object
        const mockUser = {
          id: "premium-user-id",
          email: "agrotecnicomarconigro@gmail.com",
        };
        
        // @ts-ignore - We're creating a mock user object
        setUser(mockUser);
        
        // Set up user profile for premium user
        setUsername("marconigro");
        setUserProfile({
          username: "marconigro",
          firstName: "Marco",
          lastName: "Nigro",
          email: "agrotecnicomarconigro@gmail.com",
          phone: "+39 123 456 7890",
          address: "Via Roma 123, Milan, Italy",
          role: "master"
        });
        
        setIsProfileComplete(true);
        setIsMasterAccount(true);
        return Promise.resolve();
      }
      
      // Regular Supabase login for other users
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      setIsAuthenticated(true);
      setUser(data.user);
      setSession(data.session);
      
      // Basic profile info from auth
      const usernameFromEmail = email.split('@')[0];
      setUsername(usernameFromEmail);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUsername("");
    setUser(null);
    setSession(null);
    setUserProfile({
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      role: "user" as const
    });
  };
  
  const register = async (email: string, password: string) => {
    try {
      // First check if password meets Supabase minimum requirement
      if (password.length < 6) {
        throw new Error("weak_password: Password should be at least 6 characters.");
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        }
      });
      
      // Se c'è un errore diverso dal limite di email, lo lanciamo
      if (error && error.status !== 429) {
        throw error;
      }
      
      // Se è un errore di limite email, stampiamo il messaggio ma consideriamolo un successo
      if (error && error.status === 429) {
        console.log("Email rate limit error, but continuing registration process:", error);
        // Possiamo continuare come se la registrazione fosse riuscita, l'utente dovrà solo aspettare
        return Promise.resolve();
      }
      
      console.log("Registration response:", data);
      
      // Even if there was an error sending the email, registration might have succeeded
      if (data?.user) {
        return Promise.resolve();
      } else if (error?.message?.includes("already registered")) {
        // L'utente è già registrato, consideriamolo un successo
        return Promise.resolve();
      } else if (!data?.user) {
        throw new Error("Registration failed");
      }
      
      return Promise.resolve();
      
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  };
  
  const updateUsername = (newUsername: string) => {
    if (newUsername && user) {
      setUsername(newUsername);
      setUserProfile(prev => ({ ...prev, username: newUsername }));
      
      supabase
        .from('profiles')
        .update({ username: newUsername })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating username:', error);
          }
        });
    }
  };
  
  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        throw error;
      }
      
      console.log("Password updated successfully");
    } catch (error) {
      console.error("Error updating password:", error);
      throw error;
    }
  };
  
  const updateProfile = async (field: keyof UserProfile, value: string) => {
    if (field === 'role' && value !== 'user' && value !== 'master') {
      console.error('Invalid role value. Must be "user" or "master"');
      return;
    }
    
    setUserProfile(prev => ({ 
      ...prev, 
      [field]: field === 'role' ? (value as "user" | "master") : value 
    }));
    
    // If user is authenticated, update the profile in the database
    if (user) {
      try {
        const updates: Record<string, any> = {};
        
        // Map UserProfile fields to database fields
        if (field === 'firstName') updates['first_name'] = value;
        else if (field === 'lastName') updates['last_name'] = value;
        else if (field === 'username') updates['username'] = value;
        else if (field === 'email') updates['email'] = value;
        else if (field === 'phone') updates['phone'] = value;
        else if (field === 'address') updates['address'] = value;
        else if (field === 'role') updates['role'] = value;
        
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);
          
        if (error) {
          throw error;
        }
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        username, 
        userProfile,
        login, 
        logout, 
        register,
        updateUsername, 
        updatePassword,
        updateProfile,
        isProfileComplete,
        isMasterAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
