
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

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

  const login = async (email: string, password: string) => {
    // In una app reale, qui ci sarebbe una chiamata API per autenticare l'utente
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (email === "test@test.com" && password === "test123" || 
            (localStorage.getItem("registered-email") === email && 
             localStorage.getItem("registered-password") === password)) {
          
          setIsAuthenticated(true);
          setUsername(email.split("@")[0]);
          setUserProfile(prev => ({
            ...prev,
            username: email.split("@")[0],
            email: email
          }));
          localStorage.setItem("email", email);
          resolve();
        } else {
          reject(new Error("Credenziali non valide"));
        }
      }, 1000);
    });
  };

  const register = async (email: string, password: string) => {
    // In una app reale, qui ci sarebbe una chiamata API per registrare l'utente
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        // Simuliamo la memorizzazione dell'utente
        localStorage.setItem("registered-email", email);
        localStorage.setItem("registered-password", password);
        resolve();
      }, 1500);
    });
  };

  const logout = () => {
    setIsAuthenticated(false);
  };
  
  const updateUsername = (newUsername: string) => {
    setUsername(newUsername);
    setUserProfile(prev => ({
      ...prev,
      username: newUsername
    }));
  };
  
  const updatePassword = (newPassword: string) => {
    localStorage.setItem("registered-password", newPassword);
    console.log("Password updated to:", newPassword);
  };
  
  const updateProfile = (field: keyof UserProfile, value: string) => {
    setUserProfile(prev => ({
      ...prev,
      [field]: value
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
