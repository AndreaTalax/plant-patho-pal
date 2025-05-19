
import { User, Session } from '@supabase/supabase-js';

export interface SignUpResponse {
  confirmationRequired?: boolean;
  message?: string;
  rateLimitExceeded?: boolean;
  data?: {
    user: User | null;
    session: Session | null;
  };
}

export interface ResendConfirmationResponse {
  success?: boolean;
  rateLimitExceeded?: boolean;
  message: string;
}
