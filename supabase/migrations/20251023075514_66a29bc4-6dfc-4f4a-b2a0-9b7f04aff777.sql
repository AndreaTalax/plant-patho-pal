-- Aggiungi il campo conversation_type alla tabella conversations se non esiste
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' AND column_name = 'conversation_type'
  ) THEN
    ALTER TABLE public.conversations 
    ADD COLUMN conversation_type text DEFAULT 'standard';
    
    COMMENT ON COLUMN public.conversations.conversation_type IS 'Tipo di conversazione: standard (utente privato), professional_quote (richiesta preventivo professionisti)';
  END IF;
END $$;

-- Crea la tabella per le richieste di preventivo professionali
CREATE TABLE IF NOT EXISTS public.professional_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  contact_person text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  business_type text NOT NULL,
  plant_types text[] NOT NULL,
  current_challenges text,
  expected_volume text,
  preferred_features text[],
  budget text,
  timeline text,
  additional_info text,
  pdf_url text,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Abilita RLS sulla tabella professional_quotes
ALTER TABLE public.professional_quotes ENABLE ROW LEVEL SECURITY;

-- Policy: gli utenti possono vedere solo le proprie richieste
CREATE POLICY "Users can view their own professional quotes"
ON public.professional_quotes
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: gli utenti possono creare le proprie richieste
CREATE POLICY "Users can create their own professional quotes"
ON public.professional_quotes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: gli admin e gli esperti possono vedere tutte le richieste
CREATE POLICY "Admins and experts can view all professional quotes"
ON public.professional_quotes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin'::app_role, 'expert'::app_role)
  )
);

-- Indice per query più veloci
CREATE INDEX IF NOT EXISTS idx_professional_quotes_user_id ON public.professional_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_quotes_conversation_id ON public.professional_quotes(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON public.conversations(conversation_type);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_professional_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_professional_quotes_updated_at
BEFORE UPDATE ON public.professional_quotes
FOR EACH ROW
EXECUTE FUNCTION update_professional_quotes_updated_at();