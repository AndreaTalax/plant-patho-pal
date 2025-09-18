-- Crea funzione per ottenere l'uso delle identificazioni utente
CREATE OR REPLACE FUNCTION public.get_user_identification_usage(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_identifications_used INTEGER := 0;
  v_has_premium_plan BOOLEAN := false;
  v_subscription_plan TEXT;
BEGIN
  -- Ottieni il piano di abbonamento
  SELECT subscription_plan INTO v_subscription_plan
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Verifica se ha un piano premium
  v_has_premium_plan := v_subscription_plan IN ('premium', 'business', 'professional');
  
  -- Ottieni il numero di identificazioni usate
  SELECT identifications_used INTO v_identifications_used
  FROM public.user_plant_identification_usage
  WHERE user_id = p_user_id;
  
  -- Se non c'è un record, l'utente non ha ancora usato identificazioni
  IF v_identifications_used IS NULL THEN
    v_identifications_used := 0;
  END IF;
  
  -- Ritorna il risultato come JSON
  RETURN json_build_object(
    'identifications_used', v_identifications_used,
    'has_premium_plan', v_has_premium_plan
  );
END;
$$;

-- Crea funzione per incrementare l'uso delle identificazioni
CREATE OR REPLACE FUNCTION public.increment_identification_usage(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserisce o aggiorna il record dell'uso
  INSERT INTO public.user_plant_identification_usage (user_id, identifications_used)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    identifications_used = user_plant_identification_usage.identifications_used + 1,
    updated_at = now();
  
  RETURN true;
END;
$$;