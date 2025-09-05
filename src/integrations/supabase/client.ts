
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://otdmqmpxukifoxjlgzmq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZG1xbXB4dWtpZm94amxnem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDQ5ODksImV4cCI6MjA2MjIyMDk4OX0.re4vu-banv0K-hBFNRYZGy5VucPkk141Pa--x-QiGr4";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// Export constants for use in other files
export const EXPERT_ID = '07c7fe19-33c3-4782-b9a0-4e87c8aa7044'; // Marco Nigro (fitopatologo)
