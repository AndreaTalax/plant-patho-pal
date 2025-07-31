-- Activate CDC triggers for all main tables
-- These triggers will log all changes to the cdc_events table

-- Trigger for messages table (already has log_messages_cdc_event function, just need trigger)
DROP TRIGGER IF EXISTS messages_cdc_trigger ON public.messages;
CREATE TRIGGER messages_cdc_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.log_messages_cdc_event();

-- Trigger for conversations table
DROP TRIGGER IF EXISTS conversations_cdc_trigger ON public.conversations;
CREATE TRIGGER conversations_cdc_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.log_cdc_event();

-- Trigger for diagnoses table
DROP TRIGGER IF EXISTS diagnoses_cdc_trigger ON public.diagnoses;
CREATE TRIGGER diagnoses_cdc_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.diagnoses
    FOR EACH ROW EXECUTE FUNCTION public.log_cdc_event();

-- Trigger for consultations table
DROP TRIGGER IF EXISTS consultations_cdc_trigger ON public.consultations;
CREATE TRIGGER consultations_cdc_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.consultations
    FOR EACH ROW EXECUTE FUNCTION public.log_cdc_event();

-- Trigger for profiles table
DROP TRIGGER IF EXISTS profiles_cdc_trigger ON public.profiles;
CREATE TRIGGER profiles_cdc_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.log_cdc_event();

-- Trigger for orders table
DROP TRIGGER IF EXISTS orders_cdc_trigger ON public.orders;
CREATE TRIGGER orders_cdc_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.log_cdc_event();