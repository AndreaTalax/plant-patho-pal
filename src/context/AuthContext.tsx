
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRoleService } from '@/services/userRoleService';
import type { AuthContextType, UserProfile } from '@/context/auth/types';
import type { SubscriptionStatus } from '@/services/subscriptionService';

/**
 * Unified AuthContext that exposes the richer API expected across the app.
 * - Keeps user and session in state
 * - Loads user profile from "profiles" table
 * - Derives roles via UserRoleService and exposes isMasterAccount
 * - Implements login, logout, register, updateProfile, updateUsername, updatePassword
 * - Provides subscription helpers: checkSubscription and hasActiveSubscription
 */

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Derived flags
  const isAuthenticated = !!user;
  const isProfileComplete = useMemo(() => {
    if (!userProfile) return false;
    // Consider basic completeness (customize as needed)
    return Boolean(
      userProfile.firstName || userProfile.first_name ||
      (userProfile.lastName || userProfile.last_name) ||
      userProfile.username
    );
  }, [userProfile]);

  // Roles
  const [isMasterAccount, setIsMasterAccount] = useState(false);
  const [isPremiumRole, setIsPremiumRole] = useState(false);

  // Subscription status (type is imported, but we don't rely on specific enum values here)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('unknown' as unknown as SubscriptionStatus);

  // --- Helpers ---
  const loadProfile = async (uid: string) => {
    console.log('[AuthContext] Loading profile for', uid);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (error) {
      console.error('[AuthContext] loadProfile error:', error);
      setUserProfile(null);
      return;
    }
    setUserProfile(data as unknown as UserProfile);
  };

  const refreshUserRoles = async (uid?: string) => {
    const userId = uid || user?.id;
    if (!userId) {
      setIsMasterAccount(false);
      setIsPremiumRole(false);
      return;
    }
    try {
      const roles = await UserRoleService.getUserRoles(userId);
      const hasExpert = roles.includes('expert');
      const hasAdmin = roles.includes('admin');
      const hasPremium = roles.includes('premium');
      setIsMasterAccount(hasExpert || hasAdmin);
      setIsPremiumRole(hasPremium);
      console.log('[AuthContext] Roles:', { hasExpert, hasAdmin, hasPremium });
    } catch (err) {
      console.error('[AuthContext] refreshUserRoles error:', err);
      setIsMasterAccount(false);
      setIsPremiumRole(false);
    }
  };

  const checkSubscription = async () => {
    if (!user) {
      setSubscriptionStatus('unknown' as unknown as SubscriptionStatus);
      return;
    }
    // Try calling the edge function if available; fall back to role-based status
    const { data, error } = await supabase.functions.invoke('check-subscription', {
      body: { userId: user.id },
    });
    if (error) {
      console.warn('[AuthContext] check-subscription failed, falling back to role-based status:', error.message);
      setSubscriptionStatus((isPremiumRole ? 'active' : 'inactive') as unknown as SubscriptionStatus);
      return;
    }
    const status = (data?.status || 'inactive') as SubscriptionStatus;
    setSubscriptionStatus(status);
  };

  const hasActiveSubscription = () => {
    // Consider active if status is "active" or the user has the 'premium' role
    const statusString = String(subscriptionStatus || '').toLowerCase();
    return statusString === 'active' || isPremiumRole;
  };

  // --- Auth operations ---
  const login: AuthContextType['login'] = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('[AuthContext] login error:', error);
      return { success: false };
    }
    // session and user are set by the auth state listener
    console.log('[AuthContext] login success', data.user?.id);
    return { success: true };
  };

  const logout: AuthContextType['logout'] = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const register: AuthContextType['register'] = async (email, password) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    if (error) throw error;
  };

  const updateProfile: AuthContextType['updateProfile'] = async (updatesOrKey, value) => {
    if (!user) throw new Error('Not authenticated');
    let updates: Partial<UserProfile> = {};

    if (typeof updatesOrKey === 'string') {
      updates = { [updatesOrKey]: value } as Partial<UserProfile>;
    } else {
      updates = updatesOrKey;
    }

    // Prevent client-side role/plan changes
    // @ts-expect-error - we intentionally remove these fields from updates
    delete updates.role;
    // @ts-expect-error
    delete updates.subscription_plan;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      console.error('[AuthContext] updateProfile error:', error);
      throw error;
    }
    await loadProfile(user.id);
  };

  const updateUsername: AuthContextType['updateUsername'] = async (username) => {
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', user.id);
    if (error) throw error;
    await loadProfile(user.id);
  };

  const updatePassword: AuthContextType['updatePassword'] = async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };

  // --- Init auth state ---
  useEffect(() => {
    // Listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('[AuthContext] onAuthStateChange:', event);
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        const uid = newSession.user.id;
        // Defer async side effects
        setTimeout(() => {
          loadProfile(uid);
          refreshUserRoles(uid);
          checkSubscription();
        }, 0);
      } else {
        setUserProfile(null);
        setIsMasterAccount(false);
        setIsPremiumRole(false);
        setSubscriptionStatus('unknown' as unknown as SubscriptionStatus);
      }
      setLoading(false);
    });

    // Then get existing session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        const uid = initialSession.user.id;
        loadProfile(uid);
        refreshUserRoles(uid);
        checkSubscription();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextType = {
    user,
    session,
    userProfile,
    subscriptionStatus,
    isAuthenticated,
    isProfileComplete,
    isMasterAccount,
    loading,
    login,
    logout,
    register,
    updateProfile,
    updateUsername,
    updatePassword,
    checkSubscription,
    hasActiveSubscription,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
