-- Create storage bucket for professional quotes PDF files
INSERT INTO storage.buckets (id, name, public) VALUES ('professional-quotes', 'professional-quotes', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for professional quotes bucket
INSERT INTO storage.objects (bucket_id, name, owner, metadata) VALUES ('professional-quotes', '.keep', NULL, '{}') ON CONFLICT DO NOTHING;

-- Policy to allow authenticated users to read their own PDFs
CREATE POLICY "Users can view professional quote PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'professional-quotes');

-- Policy to allow service role to upload PDFs  
CREATE POLICY "Service role can upload professional quote PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'professional-quotes');