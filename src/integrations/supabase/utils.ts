
import { Database, Json } from './types';
import type { 
  TablesInsert, TablesUpdate 
} from './types';

// Helper functions for working with Supabase types
export const isNotNullOrUndefined = <T,>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

export const asUUID = (id: string) => {
  return id as unknown as `${string}-${string}-${string}-${string}-${string}`;
};

export const asFilterValue = <T,>(value: T) => {
  return value as unknown as Json;
};

export const asDbInsert = <T extends object>(obj: T) => {
  return obj as unknown as TablesInsert<'conversations'>;
};

export const asDbUpdate = <T extends object>(obj: T) => {
  return obj as unknown as TablesUpdate<'conversations'>;
};
