-- Fix CDC trigger bug - add trigger for user_sessions table
-- First, create a specialized CDC function for user_sessions table without user_id field
CREATE OR REPLACE FUNCTION public.log_user_sessions_cdc_event()
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
      WHEN TG_OP != 'DELETE' THEN NEW.user_id
      WHEN TG_OP = 'DELETE' THEN OLD.user_id
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

-- Add trigger for user_sessions table
DROP TRIGGER IF EXISTS user_sessions_cdc_trigger ON public.user_sessions;
CREATE TRIGGER user_sessions_cdc_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.user_sessions
    FOR EACH ROW EXECUTE FUNCTION public.log_user_sessions_cdc_event();

-- Update the generic CDC function to handle tables without user_id field
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
      -- Check if the table has user_id field before accessing it
      WHEN TG_OP != 'DELETE' AND (row_to_json(NEW)::jsonb ? 'user_id') THEN (row_to_json(NEW)::jsonb->>'user_id')::uuid
      WHEN TG_OP = 'DELETE' AND (row_to_json(OLD)::jsonb ? 'user_id') THEN (row_to_json(OLD)::jsonb->>'user_id')::uuid
      ELSE NULL
    END,
    jsonb_build_object(
      'timestamp', now(),
      'source', 'database_trigger'
    )
  );
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;