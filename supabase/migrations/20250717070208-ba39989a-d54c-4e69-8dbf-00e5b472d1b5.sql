-- Aggiorna il ruolo di test@gmail.com da admin a user
UPDATE public.profiles 
SET role = 'user'
WHERE email = 'test@gmail.com';

-- Opzionale: aggiorna anche la tabella user_roles se esiste il record
UPDATE public.user_roles 
SET role = 'user'
WHERE user_id = '6ee6b888-8064-40a1-8b26-0658343f4360' AND role = 'admin';