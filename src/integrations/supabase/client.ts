
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// Get the Supabase URL and anon key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
