-- Enable realtime for key tables
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.diagnoses REPLICA IDENTITY FULL;
ALTER TABLE public.consultations REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.diagnoses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Create events table for CDC tracking
CREATE TABLE IF NOT EXISTS public.cdc_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed BOOLEAN DEFAULT false,
  metadata JSONB
);

-- Enable RLS on CDC events
ALTER TABLE public.cdc_events ENABLE ROW LEVEL SECURITY;

-- Create policy for service role to access CDC events
CREATE POLICY "Service role can manage CDC events" 
ON public.cdc_events 
FOR ALL 
USING (true);

-- Create function to log CDC events
CREATE OR REPLACE FUNCTION public.log_cdc_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.cdc_events (
    table_name,
    operation,
    old_data,
    new_data,
    user_id,
    metadata
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END,
    CASE 
      WHEN TG_OP != 'DELETE' AND NEW.user_id IS NOT NULL THEN NEW.user_id
      WHEN TG_OP = 'DELETE' AND OLD.user_id IS NOT NULL THEN OLD.user_id
      ELSE NULL
    END,
    jsonb_build_object(
      'timestamp', now(),
      'source', 'database_trigger'
    )
  );
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for CDC on key tables
DROP TRIGGER IF EXISTS messages_cdc_trigger ON public.messages;
CREATE TRIGGER messages_cdc_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.log_cdc_event();

DROP TRIGGER IF EXISTS conversations_cdc_trigger ON public.conversations;
CREATE TRIGGER conversations_cdc_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.log_cdc_event();

DROP TRIGGER IF EXISTS diagnoses_cdc_trigger ON public.diagnoses;
CREATE TRIGGER diagnoses_cdc_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.diagnoses
  FOR EACH ROW EXECUTE FUNCTION public.log_cdc_event();

DROP TRIGGER IF EXISTS consultations_cdc_trigger ON public.consultations;
CREATE TRIGGER consultations_cdc_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION public.log_cdc_event();

DROP TRIGGER IF EXISTS profiles_cdc_trigger ON public.profiles;
CREATE TRIGGER profiles_cdc_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_cdc_event();