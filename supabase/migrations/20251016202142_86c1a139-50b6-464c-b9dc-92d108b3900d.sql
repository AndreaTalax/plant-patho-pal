-- Carica il logo Hortives/Dr.Plant nel bucket pubblico plant-images
-- Questo sarà usato nei PDF generati dall'edge function

-- Il file dovrà essere caricato manualmente via dashboard oppure via edge function
-- Per ora assicuriamoci che il bucket plant-images sia configurato correttamente

-- Verifica che il bucket plant-images sia pubblico
UPDATE storage.buckets
SET public = true
WHERE id = 'plant-images';

-- Nota: Il logo deve essere caricato manualmente nella cartella radice del bucket
-- con nome: hortives-logo.jpg o dr-plant-logo-main.jpg