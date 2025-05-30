import { supabase } from '@/integrations/supabase/client';

export const MARCO_NIGRO_ID = '07c7fe19-33c3-4782-b9a0-4e87c8aa7044';

export const getMarcoNigroId = async (): Promise<string> => {
  return MARCO_NIGRO_ID;
};

export const getPhytopathologistProfile = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', MARCO_NIGRO_ID)
    .single();
  
  if (error || !data) {
    throw new Error('Profilo di Marco Nigro non trovato');
  }
  
  return data;
};
