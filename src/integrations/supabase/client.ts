
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// Get the Supabase URL and anon key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://otdmqmpxukifoxjlgzmq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZG1xbXB4dWtpZm94amxnem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDQ5ODksImV4cCI6MjA2MjIyMDk4OX0.re4vu-banv0K-hBFNRYZGy5VucPkk141Pa--x-QiGr4';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Expert ID for the application
export const EXPERT_ID = "premium-user-id";

// Type definitions for database tables
export type DbMessage = Database['public']['Tables']['messages']['Row'];
export type DbMessageInsert = Database['public']['Tables']['messages']['Insert'];

export type DbConversation = Database['public']['Tables']['conversations']['Row'];
export type DbConversationInsert = Database['public']['Tables']['conversations']['Insert'];
export type DbConversationUpdate = Database['public']['Tables']['conversations']['Update'];

export type DbProfile = Database['public']['Tables']['profiles']['Row'];
export type DbDiagnosiPiante = Database['public']['Tables']['diagnosi_piante']['Row'];
