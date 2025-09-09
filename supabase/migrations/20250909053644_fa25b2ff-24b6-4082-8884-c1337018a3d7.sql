-- Extend premium subscription for test@gmail.com to ensure no limitations
UPDATE subscribers 
SET 
  subscribed = true,
  subscription_tier = 'premium',
  subscription_end = '2030-12-31 23:59:59+00',
  updated_at = now()
WHERE email = 'test@gmail.com';

-- Ensure the profile is also set correctly
UPDATE profiles 
SET 
  role = 'premium',
  subscription_plan = 'premium',
  updated_at = now()
WHERE email = 'test@gmail.com';