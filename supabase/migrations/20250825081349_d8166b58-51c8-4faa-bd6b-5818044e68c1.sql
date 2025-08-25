
-- ========== PROFILES: Fix PII exposure and prevent client-side role elevation ==========

-- Drop overly permissive read policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Optional: clean up duplicate update policies (names found in schema)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Allow experts to view profiles of users they are in a conversation with
CREATE POLICY "Experts can view profiles of their conversations"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.user_id = profiles.id
        AND c.expert_id = auth.uid()
    )
  );

-- Helper function to prevent changing sensitive columns by non-admins
CREATE OR REPLACE FUNCTION public.profile_change_permitted(_id uuid, _role text, _plan text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  curr_role text;
  curr_plan text;
BEGIN
  SELECT role, subscription_plan INTO curr_role, curr_plan
  FROM public.profiles
  WHERE id = _id;

  -- Only permit update when role and plan are unchanged
  RETURN (curr_role IS NOT DISTINCT FROM _role)
     AND (curr_plan IS NOT DISTINCT FROM _plan);
END;
$$;

-- Allow users to update their profile EXCEPT role/subscription_plan
CREATE POLICY "Users can update own profile (no role/sub change)"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND public.profile_change_permitted(id, role, subscription_plan)
  );

-- ========== PRODUCTS: Restrict management to admins ==========

DROP POLICY IF EXISTS "Admin can manage products" ON public.products;

CREATE POLICY "Admins can manage products"
  ON public.products
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Keep existing public read policy for active products

-- ========== ORDERS: Prevent arbitrary writes by users ==========

DROP POLICY IF EXISTS "Insert orders" ON public.orders;
DROP POLICY IF EXISTS "Update orders" ON public.orders;

-- Only allow users to insert their own orders
CREATE POLICY "Users can create their own orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Keep existing "Users can view their own orders" policy
-- Do NOT create a general update policy; updates should be performed by edge functions via service role

-- ========== SUBSCRIBERS: Prevent arbitrary writes by users ==========

DROP POLICY IF EXISTS "Insert subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Update subscription" ON public.subscribers;

-- Keep existing "Users can view their own subscription" policy
-- Inserts/updates should be handled by edge functions with service role

-- ========== CDC EVENTS: Remove broad access ==========

DROP POLICY IF EXISTS "Service role can manage CDC events" ON public.cdc_events;

-- No general policies needed; service role bypasses RLS by design
