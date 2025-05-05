
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type AuthContextType = {
  isAuthenticated: boolean;
  username: string;
  login: () => void;
  logout: () => void;
  updateUsername: (newUsername: string) => void;
  updatePassword: (newPassword: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("auth-status") === "authenticated";
  });
  
  const [username, setUsername] = useState(() => {
    return localStorage.getItem("username") || "test";
  });
  
  useEffect(() => {
    localStorage.setItem("auth-status", isAuthenticated ? "authenticated" : "unauthenticated");
  }, [isAuthenticated]);
  
  useEffect(() => {
    localStorage.setItem("username", username);
  }, [username]);

  const login = () => {
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };
  
  const updateUsername = (newUsername: string) => {
    setUsername(newUsername);
  };
  
  const updatePassword = (newPassword: string) => {
    // In a real application, we would make an API call to update the password in the database
    localStorage.setItem("password", newPassword);
    console.log("Password updated to:", newPassword);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        username, 
        login, 
        logout, 
        updateUsername, 
        updatePassword 
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
