-- Data Retention Policies and Security Enhancements

-- Function to cleanup old notifications (>30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.notifications 
  WHERE created_at < (now() - interval '30 days');
END;
$$;

-- Function to cleanup old CDC events (>7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_cdc_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.cdc_events 
  WHERE occurred_at < (now() - interval '7 days');
END;
$$;

-- Function to anonymize deleted user data (GDPR compliance)
CREATE OR REPLACE FUNCTION public.anonymize_user_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Anonymize profile data instead of deleting (for audit purposes)
  UPDATE public.profiles 
  SET 
    email = NULL,
    phone = NULL,
    address = NULL,
    birth_date = NULL,
    birth_place = NULL,
    first_name = 'Deleted',
    last_name = 'User',
    avatar_url = NULL,
    updated_at = now()
  WHERE id = OLD.id;
  
  RETURN OLD;
END;
$$;

-- Trigger to anonymize user data on auth.users deletion
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.anonymize_user_data();

-- Add indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_expert_id ON public.conversations(expert_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_user_id ON public.diagnoses(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_user_id ON public.consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_cdc_events_occurred_at ON public.cdc_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Schedule automatic cleanup (Note: This requires pg_cron extension)
-- Users should enable pg_cron in Supabase dashboard if not already enabled
-- Uncomment these lines after enabling pg_cron:
-- SELECT cron.schedule('cleanup-old-notifications', '0 2 * * *', 'SELECT public.cleanup_old_notifications()');
-- SELECT cron.schedule('cleanup-old-cdc-events', '0 3 * * *', 'SELECT public.cleanup_old_cdc_events()');
-- SELECT cron.schedule('cleanup-expired-sessions', '*/15 * * * *', 'SELECT public.cleanup_expired_sessions()');

-- Add comment on sensitive data columns for documentation
COMMENT ON COLUMN public.profiles.email IS 'PII: Email address - required for authentication';
COMMENT ON COLUMN public.profiles.phone IS 'PII: Phone number - optional contact information';
COMMENT ON COLUMN public.profiles.address IS 'PII: Physical address - optional for professional users';
COMMENT ON COLUMN public.profiles.birth_date IS 'PII: Birth date - optional user information';
COMMENT ON COLUMN public.profiles.birth_place IS 'PII: Birth place - optional user information';

-- Ensure RLS is enabled on all tables with user data
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_diagnosis_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plant_identification_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;