-- Fix security issues: restrict public access to sensitive tables

-- Remove public read access from diagnosi_piante table
DROP POLICY IF EXISTS "Public can view diagnoses" ON public.diagnosi_piante;

-- Create proper RLS policy for diagnosi_piante - users can only see their own diagnoses
CREATE POLICY "Users can view their own diagnoses" 
ON public.diagnosi_piante 
FOR SELECT 
USING (auth.uid() = user_id OR 
       EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Create policy for users to insert their own diagnoses
CREATE POLICY "Users can create their own diagnoses" 
ON public.diagnosi_piante 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Restrict cdc_events table access - only admins and system
DROP POLICY IF EXISTS "Enable read access for all users" ON public.cdc_events;

-- Create admin-only access policy for cdc_events
CREATE POLICY "Only admins can view cdc_events" 
ON public.cdc_events 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Ensure RLS is enabled on both tables
ALTER TABLE public.diagnosi_piante ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cdc_events ENABLE ROW LEVEL SECURITY;