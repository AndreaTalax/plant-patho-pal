-- Verifica e crea il bucket pdfs se non esiste, rendendolo pubblico
DO $$
BEGIN
  -- Aggiorna il bucket pdfs per renderlo pubblico
  UPDATE storage.buckets 
  SET public = true 
  WHERE id = 'pdfs';
  
  -- Se non esiste, crealo
  IF NOT FOUND THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('pdfs', 'pdfs', true);
  END IF;
END $$;

-- Policy per permettere a tutti di leggere i PDF (necessario per visualizzare i file)
DROP POLICY IF EXISTS "Anyone can view PDFs" ON storage.objects;
CREATE POLICY "Anyone can view PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'pdfs');

-- Policy per permettere agli utenti autenticati di caricare PDF
DROP POLICY IF EXISTS "Authenticated users can upload PDFs" ON storage.objects;
CREATE POLICY "Authenticated users can upload PDFs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pdfs' 
  AND auth.role() = 'authenticated'
);

-- Policy per permettere agli utenti di aggiornare i propri PDF
DROP POLICY IF EXISTS "Users can update their own PDFs" ON storage.objects;
CREATE POLICY "Users can update their own PDFs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'pdfs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'pdfs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy per permettere agli utenti di eliminare i propri PDF
DROP POLICY IF EXISTS "Users can delete their own PDFs" ON storage.objects;
CREATE POLICY "Users can delete their own PDFs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'pdfs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);