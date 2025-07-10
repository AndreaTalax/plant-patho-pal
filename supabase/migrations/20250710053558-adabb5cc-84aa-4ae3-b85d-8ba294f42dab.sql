-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'expert', 'premium', 'user');

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    granted_by UUID REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS TABLE (role app_role)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT ur.role
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Insert roles for the specified users
INSERT INTO public.user_roles (user_id, role) VALUES 
-- test@gmail.com gets admin and premium roles
('6ee6b888-8064-40a1-8b26-0658343f4360', 'admin'),
('6ee6b888-8064-40a1-8b26-0658343f4360', 'premium'),
('6ee6b888-8064-40a1-8b26-0658343f4360', 'expert'),
-- talaiaandrea@gmail.com gets user role
('03221cfd-8d2b-4392-9734-1f5e86cb4cfd', 'user')
ON CONFLICT (user_id, role) DO NOTHING;