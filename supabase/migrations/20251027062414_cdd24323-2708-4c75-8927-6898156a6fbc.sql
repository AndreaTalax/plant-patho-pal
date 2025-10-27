-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public access to pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Public access to plant-images" ON storage.objects;
DROP POLICY IF EXISTS "Public access to professional-quotes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload plant-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload professional-quotes" ON storage.objects;

-- Create SELECT policies for public access
CREATE POLICY "Public access to pdfs"
ON storage.objects FOR SELECT
USING (bucket_id = 'pdfs');

CREATE POLICY "Public access to plant-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'plant-images');

CREATE POLICY "Public access to professional-quotes"
ON storage.objects FOR SELECT
USING (bucket_id = 'professional-quotes');

-- Create INSERT policies for authenticated users
CREATE POLICY "Authenticated users can upload pdfs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pdfs');

CREATE POLICY "Authenticated users can upload plant-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'plant-images');

CREATE POLICY "Authenticated users can upload professional-quotes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'professional-quotes');