-- Crea il bucket per i messaggi audio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('audio-messages', 'audio-messages', true, 52428800, ARRAY['audio/webm', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']);

-- Crea politiche per permettere upload e accesso agli audio
CREATE POLICY "Utenti possono caricare i propri audio" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'audio-messages' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Utenti possono vedere tutti gli audio" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'audio-messages');

CREATE POLICY "Utenti possono aggiornare i propri audio" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'audio-messages' AND auth.uid()::text = (storage.foldername(name))[1]);