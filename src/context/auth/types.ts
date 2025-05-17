
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/components/diagnose/types';

export interface AuthState {
  user: User | null;
  userProfile: UserProfile;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  isMasterAccount: boolean;
  loading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  updateProfile: (field: string, value: any) => void;
  updateUsername: (username: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}
