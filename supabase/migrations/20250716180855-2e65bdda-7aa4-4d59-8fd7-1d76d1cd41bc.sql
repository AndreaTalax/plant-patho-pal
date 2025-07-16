-- Create missing storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('plant-images', 'plant-images', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for plant-images bucket
CREATE POLICY "Plant images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'plant-images');

CREATE POLICY "Users can upload plant images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'plant-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their plant images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'plant-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their plant images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'plant-images' AND auth.uid() IS NOT NULL);

-- Create storage policies for avatars bucket  
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);