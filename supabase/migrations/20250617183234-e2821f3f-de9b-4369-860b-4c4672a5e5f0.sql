
-- Aggiungi colonne per tracciare lo stato online degli utenti
ALTER TABLE public.profiles 
ADD COLUMN last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN is_online BOOLEAN DEFAULT false;

-- Crea una tabella per tracciare le sessioni attive degli utenti
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, session_id)
);

-- Abilita RLS per la tabella user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy per permettere agli utenti di vedere solo le proprie sessioni
CREATE POLICY "Users can view their own sessions" 
  ON public.user_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy per permettere agli utenti di inserire le proprie sessioni
CREATE POLICY "Users can create their own sessions" 
  ON public.user_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy per permettere agli utenti di aggiornare le proprie sessioni
CREATE POLICY "Users can update their own sessions" 
  ON public.user_sessions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy per permettere agli utenti di eliminare le proprie sessioni
CREATE POLICY "Users can delete their own sessions" 
  ON public.user_sessions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Funzione per aggiornare lo stato online dell'utente
CREATE OR REPLACE FUNCTION public.update_user_online_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Aggiorna il profilo dell'utente come online quando viene inserita una nuova sessione
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles 
    SET is_online = true, last_seen_at = now()
    WHERE id = NEW.user_id;
    RETURN NEW;
  END IF;
  
  -- Quando una sessione viene disattivata, controlla se ci sono altre sessioni attive
  IF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
    -- Se non ci sono altre sessioni attive, imposta l'utente come offline
    IF NOT EXISTS (
      SELECT 1 FROM public.user_sessions 
      WHERE user_id = NEW.user_id AND is_active = true AND id != NEW.id
    ) THEN
      UPDATE public.profiles 
      SET is_online = false, last_seen_at = now()
      WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
  END IF;
  
  -- Aggiorna last_activity_at quando viene aggiornata una sessione
  IF TG_OP = 'UPDATE' THEN
    UPDATE public.profiles 
    SET last_seen_at = now()
    WHERE id = NEW.user_id;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare lo stato online
CREATE TRIGGER update_user_online_status_trigger
  AFTER INSERT OR UPDATE ON public.user_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_user_online_status();

-- Funzione per pulire le sessioni scadute (da chiamare periodicamente)
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  -- Disattiva le sessioni inattive da più di 5 minuti
  UPDATE public.user_sessions 
  SET is_active = false
  WHERE is_active = true 
    AND last_activity_at < (now() - interval '5 minutes');
  
  -- Elimina le sessioni inattive da più di 24 ore
  DELETE FROM public.user_sessions 
  WHERE is_active = false 
    AND last_activity_at < (now() - interval '24 hours');
END;
$$ LANGUAGE plpgsql;
