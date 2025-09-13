-- Fix RLS policy issues for storage bucket
-- Ensure the storage bucket has proper policies

-- Allow service role to upload PDFs (for the edge function)
CREATE POLICY "Service role can upload PDFs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'pdfs' AND auth.role() = 'service_role');

-- Allow service role to update PDFs
CREATE POLICY "Service role can update PDFs" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'pdfs' AND auth.role() = 'service_role');