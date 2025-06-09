
import { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  birthDate?: string;
  birthPlace?: string;
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  birth_place?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  avatar_url?: string;
  role?: string;
  subscription_plan?: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  isMasterAccount: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean }>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile> | string, value?: any) => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}
