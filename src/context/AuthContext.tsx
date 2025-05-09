
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';

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

// Supabase client setup
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_PUBLIC_KEY = import.meta.env.VITE_SUPABASE_PUBLIC_KEY || '';

// Mock user data for development when Supabase is not configured
const MOCK_USERS = [
  {
    email: "test@test.com",
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
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("auth-status") === "authenticated";
  });
  
  const [username, setUsername] = useState(() => {
    return localStorage.getItem("username") || "";
  });
  
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const savedProfile = localStorage.getItem("user-profile");
    return savedProfile ? JSON.parse(savedProfile) : {
      username: "",
      firstName: "",
      lastName: "",
      email: localStorage.getItem("email") || "",
      phone: "",
      address: "",
      role: "user" as const
    };
  });
  
  const [isProfileComplete, setIsProfileComplete] = useState(() => {
    return localStorage.getItem("profile-complete") === "true";
  });
  
  const [isMasterAccount, setIsMasterAccount] = useState(() => {
    return userProfile.role === "master";
  });
  
  // Initialize Supabase client (if environment is set up)
  const supabase = SUPABASE_URL && SUPABASE_PUBLIC_KEY 
    ? createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY)
    : null;

  useEffect(() => {
    localStorage.setItem("auth-status", isAuthenticated ? "authenticated" : "unauthenticated");
  }, [isAuthenticated]);
  
  useEffect(() => {
    localStorage.setItem("username", username);
  }, [username]);
  
  useEffect(() => {
    localStorage.setItem("user-profile", JSON.stringify(userProfile));
  }, [userProfile]);
  
  useEffect(() => {
    localStorage.setItem("profile-complete", isProfileComplete ? "true" : "false");
  }, [isProfileComplete]);
  
  useEffect(() => {
    setIsProfileComplete(!!userProfile.firstName && !!userProfile.lastName);
    setIsMasterAccount(userProfile.role === "master");
  }, [userProfile.firstName, userProfile.lastName, userProfile.role]);

  // Check for active session on load
  useEffect(() => {
    const checkSession = async () => {
      if (supabase) {
        // If Supabase is available, check session
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setIsAuthenticated(true);
          
          // Get user profile from Supabase
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single();
            
          if (profileData) {
            setUsername(profileData.username || data.session.user.email?.split('@')[0] || '');
            setUserProfile({
              username: profileData.username || data.session.user.email?.split('@')[0] || '',
              firstName: profileData.first_name || '',
              lastName: profileData.last_name || '',
              email: data.session.user.email || '',
              phone: profileData.phone || '',
              address: profileData.address || '',
              role: profileData.role || 'user'
            });
            setIsMasterAccount(profileData.role === "master");
          }
        }
      } else {
        // Fallback to localStorage for demo mode
        const isAuthenticated = localStorage.getItem("auth-status") === "authenticated";
        if (isAuthenticated) {
          setIsAuthenticated(true);
          const savedProfile = localStorage.getItem("user-profile");
          if (savedProfile) {
            const profile = JSON.parse(savedProfile);
            setUsername(profile.username || profile.email.split('@')[0] || '');
            setUserProfile(profile);
            setIsMasterAccount(profile.role === "master");
          }
        }
      }
    };
    
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login with:", email, password);
      
      if (supabase) {
        // Use Supabase authentication
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          throw error;
        }
        
        setIsAuthenticated(true);
        
        // Get user profile from Supabase
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (profileData) {
          setUsername(profileData.username || email.split('@')[0]);
          setUserProfile({
            username: profileData.username || email.split('@')[0],
            firstName: profileData.first_name || '',
            lastName: profileData.last_name || '',
            email: email,
            phone: profileData.phone || '',
            address: profileData.address || '',
            role: profileData.role || 'user'
          });
          setIsMasterAccount(profileData.role === "master");
        }
      } else {
        // Use mock data for demo mode
        const user = MOCK_USERS.find(user => user.email === email && user.password === password);
        
        if (!user) {
          throw new Error("Invalid credentials");
        }
        
        // Set authenticated state
        setIsAuthenticated(true);
        
        // Create a basic profile
        const usernameFromEmail = email.split('@')[0];
        setUsername(usernameFromEmail);
        
        // Set user profile with role
        setUserProfile({
          username: usernameFromEmail,
          email: email,
          firstName: '',
          lastName: '',
          phone: '',
          address: '',
          role: user.role
        });
      }
      
      // Store email for future use
      localStorage.setItem("email", email);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    
    setIsAuthenticated(false);
    setUsername("");
    localStorage.removeItem("auth-status");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
  };
  
  const register = async (email: string, password: string) => {
    try {
      if (supabase) {
        // Use Supabase authentication for registration
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
          }
        });
        
        if (error) {
          throw error;
        }
        
        // At this point, we don't set isAuthenticated to true as the user needs to verify email
        return Promise.resolve();
      } else {
        // Mock registration for demo mode
        setIsAuthenticated(true);
        
        // Create a basic profile
        const usernameFromEmail = email.split('@')[0];
        setUsername(usernameFromEmail);
        
        // Initialize user profile with default data
        setUserProfile({
          username: usernameFromEmail,
          email: email,
          firstName: '',
          lastName: '',
          phone: '',
          address: '',
          role: "user" as const
        });
        
        // Store email for future use
        localStorage.setItem("email", email);
        
        return Promise.resolve();
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };
  
  const updateUsername = (newUsername: string) => {
    if (newUsername) {
      setUsername(newUsername);
      setUserProfile(prev => ({ ...prev, username: newUsername }));
    }
  };
  
  const updatePassword = async (newPassword: string) => {
    if (supabase) {
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
    } else {
      console.log("Password updated:", newPassword);
      // Since we're using mock data, we just log this
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
    
    // If Supabase is available, update the profile in the database
    if (supabase) {
      try {
        const user = await supabase.auth.getUser();
        if (user.data.user) {
          const updates = {};
          
          // Map UserProfile fields to database fields
          if (field === 'firstName') updates['first_name'] = value;
          else if (field === 'lastName') updates['last_name'] = value;
          else if (field === 'username') updates['username'] = value;
          else updates[field] = value;
          
          const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.data.user.id);
            
          if (error) {
            throw error;
          }
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        // We don't throw here to prevent UI disruption
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
