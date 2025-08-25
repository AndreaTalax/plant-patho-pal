
import { supabase } from '@/integrations/supabase/client';
import { UserRoleService } from '@/services/userRoleService';

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) throw error;
  return data;
};

export const updateUserProfile = async (userId: string, updates: any) => {
  // Remove role and subscription_plan from updates to prevent client-side changes
  const { role, subscription_plan, ...safeUpdates } = updates;
  
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...safeUpdates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const checkUserPermissions = async (userId: string) => {
  const roles = await UserRoleService.getUserRoles(userId);
  
  return {
    isAdmin: roles.includes('admin'),
    isExpert: roles.includes('expert'),
    isPremium: roles.includes('premium'),
    roles
  };
};
