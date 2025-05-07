
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

type UserProfile = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    };
  });
  
  const [isProfileComplete, setIsProfileComplete] = useState(() => {
    return localStorage.getItem("profile-complete") === "true";
  });
  
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
  }, [userProfile.firstName, userProfile.lastName]);

  // Check for active session on load
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsAuthenticated(true);
        // Get user profile
        const { data: userData } = await supabase.from('profiles').select('*').eq('id', data.session.user.id).single();
        if (userData) {
          setUsername(userData.username || data.session.user.email?.split('@')[0] || '');
          setUserProfile(prev => ({
            ...prev,
            username: userData.username || data.session.user.email?.split('@')[0] || '',
            email: data.session.user.email || '',
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            phone: userData.phone || '',
            address: userData.address || ''
          }));
          setIsProfileComplete(!!userData.first_name && !!userData.last_name);
        }
      }
    };
    
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      setIsAuthenticated(true);
      
      // Get user profile from Supabase
      if (data.user) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        
        setUsername(profileData?.username || email.split('@')[0]);
        setUserProfile(prev => ({
          ...prev,
          username: profileData?.username || email.split('@')[0],
          email: email,
          firstName: profileData?.first_name || '',
          lastName: profileData?.last_name || '',
          phone: profileData?.phone || '',
          address: profileData?.address || ''
        }));
        
        setIsProfileComplete(!!profileData?.first_name && !!profileData?.last_name);
      }
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login` // Redirect to login page after email verification
        }
      });
      
      if (error) throw error;
      
      // Registration successful, confirmation email sent
      return Promise.resolve();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setUsername('');
      setUserProfile({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: ''
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  const updateUsername = async (newUsername: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');
      
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        username: newUsername,
        updated_at: new Date()
      });
      
      if (error) throw error;
      
      setUsername(newUsername);
      setUserProfile(prev => ({
        ...prev,
        username: newUsername
      }));
    } catch (error) {
      console.error('Update username error:', error);
      throw error;
    }
  };
  
  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  };
  
  const updateProfile = async (field: keyof UserProfile, value: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');
      
      // Map UserProfile fields to database fields
      const dbFieldMapping: Record<string, string> = {
        firstName: 'first_name',
        lastName: 'last_name',
        phone: 'phone',
        address: 'address',
        email: 'email',
        username: 'username'
      };
      
      const dbField = dbFieldMapping[field];
      if (!dbField) return;
      
      const updates: Record<string, any> = {
        id: user.id,
        [dbField]: value,
        updated_at: new Date()
      };
      
      const { error } = await supabase.from('profiles').upsert(updates);
      
      if (error) throw error;
      
      setUserProfile(prev => ({
        ...prev,
        [field]: value
      }));
      
      if (field === 'firstName' || field === 'lastName') {
        setIsProfileComplete(!!userProfile.firstName && !!userProfile.lastName);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
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
        isProfileComplete
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
