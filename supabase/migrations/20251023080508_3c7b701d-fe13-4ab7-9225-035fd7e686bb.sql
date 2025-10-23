-- Rimuovi il trigger esistente
DROP TRIGGER IF EXISTS update_professional_quotes_updated_at ON public.professional_quotes;

-- Rimuovi la funzione
DROP FUNCTION IF EXISTS update_professional_quotes_updated_at();

-- Ricrea la funzione con search_path corretto
CREATE OR REPLACE FUNCTION update_professional_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Ricrea il trigger
CREATE TRIGGER update_professional_quotes_updated_at
BEFORE UPDATE ON public.professional_quotes
FOR EACH ROW
EXECUTE FUNCTION update_professional_quotes_updated_at();