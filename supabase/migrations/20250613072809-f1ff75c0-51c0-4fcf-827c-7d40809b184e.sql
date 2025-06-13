
-- Correggi la funzione trigger per usare il campo corretto
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations 
  SET 
    last_message_text = NEW.content,
    last_message_at = NEW.sent_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Rimuovi il trigger esistente se presente
DROP TRIGGER IF EXISTS update_conversation_last_message_trigger ON public.messages;

-- Crea il trigger corretto
CREATE TRIGGER update_conversation_last_message_trigger
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_last_message();
