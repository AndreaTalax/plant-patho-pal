-- Crea una funzione trigger che notifica automaticamente quando arriva un messaggio
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url text := 'https://otdmqmpxukifoxjlgzmq.supabase.co';
  service_role_key text := current_setting('supabase.service_role_key', true);
BEGIN
  -- Chiama la edge function per inviare email e notifica push in background
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-message-notification',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_role_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'messageId', NEW.id::text
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'errore ma non bloccare l'inserimento del messaggio
    RAISE WARNING 'Error calling send-message-notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Crea il trigger sulla tabella messages
DROP TRIGGER IF EXISTS on_message_created ON messages;

CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();