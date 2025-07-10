import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'expert' | 'premium' | 'user';

export interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  granted_at: string;
  granted_by?: string;
}

/**
 * Service per gestire i ruoli utente
 */
export class UserRoleService {
  /**
   * Ottiene tutti i ruoli di un utente
   */
  static async getUserRoles(userId: string): Promise<UserRole[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_roles', {
        _user_id: userId
      });

      if (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }

      return data?.map((item: any) => item.role) || [];
    } catch (error) {
      console.error('Error in getUserRoles:', error);
      return [];
    }
  }

  /**
   * Verifica se un utente ha un ruolo specifico
   */
  static async hasRole(userId: string, role: UserRole): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: role
      });

      if (error) {
        console.error('Error checking user role:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error in hasRole:', error);
      return false;
    }
  }

  /**
   * Verifica se l'utente corrente ha un ruolo specifico
   */
  static async currentUserHasRole(role: UserRole): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      return this.hasRole(user.id, role);
    } catch (error) {
      console.error('Error in currentUserHasRole:', error);
      return false;
    }
  }

  /**
   * Verifica se l'utente corrente è admin
   */
  static async isCurrentUserAdmin(): Promise<boolean> {
    return this.currentUserHasRole('admin');
  }

  /**
   * Verifica se l'utente corrente è expert
   */
  static async isCurrentUserExpert(): Promise<boolean> {
    return this.currentUserHasRole('expert');
  }

  /**
   * Verifica se l'utente corrente ha abbonamento premium
   */
  static async isCurrentUserPremium(): Promise<boolean> {
    return this.currentUserHasRole('premium');
  }

  /**
   * Aggiunge un ruolo a un utente (solo admin)
   */
  static async addRole(userId: string, role: UserRole): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) {
        console.error('Error adding role:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in addRole:', error);
      return false;
    }
  }

  /**
   * Rimuove un ruolo da un utente (solo admin)
   */
  static async removeRole(userId: string, role: UserRole): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) {
        console.error('Error removing role:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in removeRole:', error);
      return false;
    }
  }

  /**
   * Ottiene tutti gli utenti con un ruolo specifico
   */
  static async getUsersByRole(role: UserRole): Promise<UserRoleData[]> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('role', role);

      if (error) {
        console.error('Error fetching users by role:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUsersByRole:', error);
      return [];
    }
  }

  /**
   * Sincronizza i ruoli con il profilo utente
   */
  static async syncUserProfile(userId: string): Promise<void> {
    try {
      const roles = await this.getUserRoles(userId);
      
      // Determina il ruolo principale (priority: admin > expert > premium > user)
      let primaryRole: UserRole = 'user';
      let subscriptionPlan = 'free';

      if (roles.includes('admin')) {
        primaryRole = 'admin';
        subscriptionPlan = 'premium';
      } else if (roles.includes('expert')) {
        primaryRole = 'expert';
        subscriptionPlan = 'premium';
      } else if (roles.includes('premium')) {
        primaryRole = 'user'; // Mantiene user come ruolo base
        subscriptionPlan = 'premium';
      }

      // Aggiorna il profilo
      await supabase
        .from('profiles')
        .update({ 
          role: primaryRole,
          subscription_plan: subscriptionPlan,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      // Aggiorna la sottoscrizione se premium
      if (subscriptionPlan === 'premium') {
        // Prima ottieni l'email dell'utente
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single();

        if (profile?.email) {
          await supabase
            .from('subscribers')
            .upsert({
              user_id: userId,
              email: profile.email,
              subscribed: true,
              subscription_tier: 'premium',
              subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 anno
            });
        }
      }

    } catch (error) {
      console.error('Error syncing user profile:', error);
    }
  }
}

/**
 * Hook React per gestire i ruoli utente
 */
import { useState, useEffect } from 'react';

export function useUserRoles(userId?: string) {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isExpert, setIsExpert] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        setLoading(true);
        
        let userRoles: UserRole[] = [];
        
        if (userId) {
          userRoles = await UserRoleService.getUserRoles(userId);
        } else {
          // Ottieni ruoli dell'utente corrente
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            userRoles = await UserRoleService.getUserRoles(user.id);
          }
        }

        setRoles(userRoles);
        setIsAdmin(userRoles.includes('admin'));
        setIsExpert(userRoles.includes('expert'));
        setIsPremium(userRoles.includes('premium'));

      } catch (error) {
        console.error('Error loading user roles:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRoles();
  }, [userId]);

  return {
    roles,
    loading,
    isAdmin,
    isExpert,
    isPremium,
    hasRole: (role: UserRole) => roles.includes(role),
    refresh: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userRoles = await UserRoleService.getUserRoles(userId || user.id);
        setRoles(userRoles);
        setIsAdmin(userRoles.includes('admin'));
        setIsExpert(userRoles.includes('expert'));
        setIsPremium(userRoles.includes('premium'));
      }
    }
  };
}