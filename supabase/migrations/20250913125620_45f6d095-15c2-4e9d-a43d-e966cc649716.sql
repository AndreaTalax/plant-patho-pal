-- Create storage bucket for PDFs if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdfs', 'pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public read access to PDFs
CREATE POLICY "Public can view PDFs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'pdfs');

-- Create policy for authenticated users to upload PDFs
CREATE POLICY "Authenticated users can upload PDFs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'pdfs' AND auth.role() = 'authenticated');