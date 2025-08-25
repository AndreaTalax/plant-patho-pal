
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRoleService } from '@/services/userRoleService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isExpert: boolean;
  isPremium: boolean;
  signOut: () => Promise<void>;
  refreshUserRoles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isExpert, setIsExpert] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const refreshUserRoles = async () => {
    if (!user) {
      setIsAdmin(false);
      setIsExpert(false);
      setIsPremium(false);
      return;
    }

    try {
      const roles = await UserRoleService.getUserRoles(user.id);
      setIsAdmin(roles.includes('admin'));
      setIsExpert(roles.includes('expert'));
      setIsPremium(roles.includes('premium'));
    } catch (error) {
      console.error('Error refreshing user roles:', error);
      setIsAdmin(false);
      setIsExpert(false);
      setIsPremium(false);
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Refresh roles when user changes
  useEffect(() => {
    refreshUserRoles();
  }, [user]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    session,
    loading,
    isAdmin,
    isExpert,
    isPremium,
    signOut,
    refreshUserRoles,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
