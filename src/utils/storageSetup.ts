
import { supabase } from '@/integrations/supabase/client';

// Non crea più i bucket: solo logga che devono già esistere
export const ensureStorageBuckets = async () => {
  console.log('Assicurati che i bucket "plant-images" e "avatars" esistano su Supabase Storage.');
  // Opzionale: puoi ancora fare check di presenza, ma non tentare la creazione.
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('Errore recupero lista bucket:', error);
    return;
  }
  const bucketsNeeded = ['plant-images', 'avatars'];
  const missing = bucketsNeeded.filter(
    name => !buckets?.find(bucket => bucket.name === name)
  );
  if (missing.length > 0) {
    console.warn(`Mancano questi bucket su Supabase: ${missing.join(', ')}. Crea manualmente dalla dashboard.`);
  } else {
    console.log('Tutti i bucket necessari sono già presenti.');
  }
};
