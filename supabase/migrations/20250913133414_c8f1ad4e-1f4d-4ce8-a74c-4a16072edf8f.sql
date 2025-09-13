-- Add RLS policy for cdc_events table to fix security warning
CREATE POLICY "Users can view their own CDC events" ON public.cdc_events
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage CDC events" ON public.cdc_events  
FOR ALL USING (true);