
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

// Define type for user profile
type UserProfile = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  role: "user" | "master"; // Added role field
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
    role: "user"
  },
  {
    email: "talaiaandrea@gmail.com",
    password: "ciao5",
    role: "user"
  },
  {
    email: "agrotecnicomarconigro@gmail.com", // Added master account
    password: "marconigro93",
    role: "master"
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
      role: "user" // Default role
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
      
      // Set user profile with role
      setUserProfile(prev => ({
        ...prev,
        username: usernameFromEmail,
        email: email,
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        role: user.role // Set the role from the mock user
      }));
      
      // Store email for future use
      localStorage.setItem("email", email);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      // Add the new user to mock users (in a real app would be saved to database)
      console.log("Registering new user:", email);
      
      // In a real app, we would verify the email is not already in use
      const userExists = MOCK_USERS.some(user => user.email === email);
      
      if (userExists) {
        throw new Error("Email already in use");
      }
      
      // Registration successful
      return Promise.resolve();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
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
    localStorage.removeItem("auth-status");
    localStorage.removeItem("username");
    localStorage.removeItem("user-profile");
    localStorage.removeItem("email");
    localStorage.removeItem("profile-complete");
  };
  
  const updateUsername = (newUsername: string) => {
    setUsername(newUsername);
    setUserProfile(prev => ({
      ...prev,
      username: newUsername
    }));
  };
  
  const updatePassword = (newPassword: string) => {
    console.log("Password updated to:", newPassword);
    // In a real app this would update the password in the database
  };
  
  const updateProfile = (field: keyof UserProfile, value: string) => {
    setUserProfile(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field === 'firstName' || field === 'lastName') {
      setIsProfileComplete(!!userProfile.firstName && !!userProfile.lastName);
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
