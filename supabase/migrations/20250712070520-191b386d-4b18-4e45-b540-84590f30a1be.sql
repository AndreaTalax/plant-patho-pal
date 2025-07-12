-- Reset password for the existing whitelisted user
-- First, let's update the password using the admin API
-- We need to set the password for talaiaandrea@gmail.com to test123

-- Note: This requires admin privileges and should be run by the system
UPDATE auth.users 
SET encrypted_password = crypt('test123', gen_salt('bf'))
WHERE email = 'talaiaandrea@gmail.com';