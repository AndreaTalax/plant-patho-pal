
-- Crea la tabella per memorizzare le sottoscrizioni push
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Abilita RLS per la tabella push_subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy per permettere agli utenti di vedere solo le proprie sottoscrizioni
CREATE POLICY "Users can view their own push subscriptions" 
  ON public.push_subscriptions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy per permettere agli utenti di inserire le proprie sottoscrizioni
CREATE POLICY "Users can create their own push subscriptions" 
  ON public.push_subscriptions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy per permettere agli utenti di aggiornare le proprie sottoscrizioni
CREATE POLICY "Users can update their own push subscriptions" 
  ON public.push_subscriptions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy per permettere agli utenti di eliminare le proprie sottoscrizioni
CREATE POLICY "Users can delete their own push subscriptions" 
  ON public.push_subscriptions 
  FOR DELETE 
  USING (auth.uid() = user_id);
