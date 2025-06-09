
import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { Database } from './types';

// Type aliases for easier use
type DbConversation = Database['public']['Tables']['conversations']['Row'];
type DbMessage = Database['public']['Tables']['messages']['Row'];
type DbProfile = Database['public']['Tables']['profiles']['Row'];
type DbDiagnosiPiante = Database['public']['Tables']['diagnosi_piante']['Row'];

// Helper functions for type safety when dealing with Supabase responses
export function isError<T>(result: T | PostgrestError): result is PostgrestError {
  return (result as any)?.code !== undefined;
}

// Type guard to check if a value is not null or undefined
export function isNotNullOrUndefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// Simplified type-casting helpers that avoid excessive recursion
export function asUUID(id: string): string {
  return id;
}

export function asDbConversation(data: any): DbConversation {
  return data as DbConversation;
}

export function asDbMessage(data: any): DbMessage {
  return data as DbMessage;
}

export function asDbProfile(data: any): DbProfile {
  return data as DbProfile;
}

export function asDbDiagnosiPiante(data: any): DbDiagnosiPiante {
  return data as DbDiagnosiPiante;
}

// Suppress TypeScript errors for object access in certain contexts
export function safeAccess<T>(obj: any, fallback: T): T {
  return obj as T || fallback;
}

// Simplified type cast helpers for database operations that avoid deep recursion
export function asFilterValue(value: any): string {
  return value as string;
}

export function asDbInsert<T extends Record<string, any>>(data: T): any {
  return data;
}

export function asDbUpdate<T extends Record<string, any>>(data: T): any {
  return data;
}

// Helper for profile data access
export function asProfileKey(key: string): string {
  return key;
}
