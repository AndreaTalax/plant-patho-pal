-- Fix security issues: restrict public access to sensitive tables (fixed version)

-- First drop existing problematic policies
DROP POLICY IF EXISTS "Public can view diagnoses" ON public.diagnosi_piante;
DROP POLICY IF EXISTS "Users can view their own diagnoses" ON public.diagnosi_piante;
DROP POLICY IF EXISTS "Users can create their own diagnoses" ON public.diagnosi_piante;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.cdc_events;
DROP POLICY IF EXISTS "Users can view their own CDC events" ON public.cdc_events;

-- Create proper RLS policy for diagnosi_piante - users can only see their own diagnoses
CREATE POLICY "Users can view own diagnoses only" 
ON public.diagnosi_piante 
FOR SELECT 
USING (auth.uid() = user_id OR 
       EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Create policy for users to insert their own diagnoses
CREATE POLICY "Users can create own diagnoses" 
ON public.diagnosi_piante 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create admin-only access policy for cdc_events
CREATE POLICY "Only admins can view cdc_events" 
ON public.cdc_events 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Ensure RLS is enabled on both tables
ALTER TABLE public.diagnosi_piante ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cdc_events ENABLE ROW LEVEL SECURITY;