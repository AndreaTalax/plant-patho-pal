
import { supabase } from '@/integrations/supabase/client';

export const MARCO_NIGRO_ID = '07c7fe19-33c3-4782-b9a0-4e87c8aa7044';

export const MARCO_NIGRO_PROFILE = {
  id: MARCO_NIGRO_ID,
  name: 'Marco Nigro',
  email: 'agrotecnicomarconigro@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?q=80&w=150&h=150&auto=format&fit=crop&ixlib=rb-4.0.3',
  isOnline: true,
  specialty: 'Agrotecnico Fitopatologico'
};

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
    // Ritorna i dati di fallback se non trova il profilo nel database
    return MARCO_NIGRO_PROFILE;
  }
  
  return {
    ...MARCO_NIGRO_PROFILE,
    ...data
  };
};
