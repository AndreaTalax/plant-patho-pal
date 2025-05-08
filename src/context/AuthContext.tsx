
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

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
  isMasterAccount: boolean; // Added master account check
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data - this replaces the Supabase authentication
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
      role: "user" as const // Explicitly typed as "user"
    };
  });
  
  const [isProfileComplete, setIsProfileComplete] = useState(() => {
    return localStorage.getItem("profile-complete") === "true";
  });
  
  // Added check for master account
  const [isMasterAccount, setIsMasterAccount] = useState(() => {
    return userProfile.role === "master";
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
    setIsMasterAccount(userProfile.role === "master");
  }, [userProfile.firstName, userProfile.lastName, userProfile.role]);

  // Check for active session on load
  useEffect(() => {
    const checkSession = async () => {
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
    };
    
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login with:", email, password);
      
      // Check if user exists in our mock data
      const user = MOCK_USERS.find(user => user.email === email && user.password === password);
      
      if (!user) {
        throw new Error("Invalid credentials");
      }
      
      // Set authenticated state
      setIsAuthenticated(true);
      
      // Create a basic profile
      const usernameFromEmail = email.split('@')[0];
      setUsername(usernameFromEmail);
      
      // Set user profile with role - fix type issue by explicitly using "user" | "master"
      setUserProfile({
        username: usernameFromEmail,
        email: email,
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        role: user.role  // This is now properly typed
      });
      
      // Store email for future use
      localStorage.setItem("email", email);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUsername("");
    localStorage.removeItem("auth-status");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
  };
  
  const register = async (email: string, password: string) => {
    try {
      // Set authenticated state
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
        role: "user" as const  // Explicitly set as "user"
      });
      
      // Store email for future use
      localStorage.setItem("email", email);
      
      return Promise.resolve();
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
  
  const updatePassword = (newPassword: string) => {
    console.log("Password updated:", newPassword);
    // Since we're using mock data, we just log this
  };
  
  const updateProfile = (field: keyof UserProfile, value: string) => {
    if (field === 'role' && value !== 'user' && value !== 'master') {
      console.error('Invalid role value. Must be "user" or "master"');
      return;
    }
    
    setUserProfile(prev => ({ 
      ...prev, 
      [field]: field === 'role' ? (value as "user" | "master") : value 
    }));
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
