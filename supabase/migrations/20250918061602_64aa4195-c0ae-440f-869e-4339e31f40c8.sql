-- Crea tabella per tracciare l'uso delle identificazioni Plant.ID
CREATE TABLE public.user_plant_identification_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  identifications_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Abilita Row Level Security
ALTER TABLE public.user_plant_identification_usage ENABLE ROW LEVEL SECURITY;

-- Crea policy per consentire agli utenti di vedere solo i propri dati
CREATE POLICY "Users can view their own identification usage"
ON public.user_plant_identification_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Crea policy per consentire agli utenti di inserire i propri dati
CREATE POLICY "Users can insert their own identification usage"
ON public.user_plant_identification_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Crea policy per consentire agli utenti di aggiornare i propri dati
CREATE POLICY "Users can update their own identification usage"
ON public.user_plant_identification_usage
FOR UPDATE
USING (auth.uid() = user_id);

-- Crea trigger per aggiornare automaticamente updated_at
CREATE TRIGGER update_user_plant_identification_usage_updated_at
BEFORE UPDATE ON public.user_plant_identification_usage
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Crea indice per performance
CREATE INDEX idx_user_plant_identification_usage_user_id 
ON public.user_plant_identification_usage(user_id);