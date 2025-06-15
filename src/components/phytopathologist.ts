
import { supabase } from '@/integrations/supabase/client';

export const MARCO_NIGRO_ID = '07c7fe19-33c3-4782-b9a0-4e87c8aa7044';

export const MARCO_NIGRO_PROFILE = {
  id: MARCO_NIGRO_ID,
  name: 'Marco Nigro',
  email: 'agrotecnicomarconigro@gmail.com',
  avatar: '/lovable-uploads/b86029fe-3c06-4c0e-a5f5-713e820047bf.png',
  isOnline: true,
  specialty: 'Agrotecnico Fitopatologico'
};

export const getMarcoNigroId = async (): Promise<string> => {
  return MARCO_NIGRO_ID;
};

/**
 * Syncs profile data for a specific user; returns merged data if found, fallback data otherwise.
 * @example
 * sync()
 * { id: MARCO_NIGRO_ID, name: 'Marco Nigro', ... }
 * @param {Object} supabase - An instance of the Supabase client to perform database operations.
 * @param {string} MARCO_NIGRO_ID - Identifier used to query the 'profiles' database.
 * @param {Object} MARCO_NIGRO_PROFILE - Fallback profile data used when data is not retrieved from the database.
 * @returns {Object} A complete user profile object merged with fallback data if the database query fails.
 * @description
 *   - Utilizes the Supabase client instance to perform database operations.
 *   - Merges database data with predefined fallback profile data in case of errors or absent data.
 *   - Uses a single user ID to query a specific profile from the 'profiles' table.
 */
export const getPhytopathologistProfile = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', MARCO_NIGRO_ID)
    .single();
  
  if (error || !data) {
    // Ritorna i dati di fallback se non trova il profilo nel database
    return MARCO_NIGRO_PROFILE;
  }
  
  return {
    ...MARCO_NIGRO_PROFILE,
    ...data
  };
};
