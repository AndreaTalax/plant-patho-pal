-- Update test@gmail.com profile with admin role and premium subscription
UPDATE public.profiles 
SET 
  role = 'admin',
  subscription_plan = 'premium',
  updated_at = now()
WHERE id = '6ee6b888-8064-40a1-8b26-0658343f4360';

-- Update test@gmail.com subscription
UPDATE public.subscribers 
SET 
  subscribed = true,
  subscription_tier = 'premium',
  subscription_end = (now() + interval '1 year'),
  updated_at = now()
WHERE user_id = '6ee6b888-8064-40a1-8b26-0658343f4360';

-- Ensure talaiaandrea@gmail.com has standard user settings
UPDATE public.profiles 
SET 
  role = 'user',
  subscription_plan = 'free',
  updated_at = now()
WHERE id = '03221cfd-8d2b-4392-9734-1f5e86cb4cfd';

-- Update talaiaandrea@gmail.com subscription
UPDATE public.subscribers 
SET 
  subscribed = false,
  subscription_tier = 'free',
  subscription_end = null,
  updated_at = now()
WHERE user_id = '03221cfd-8d2b-4392-9734-1f5e86cb4cfd';