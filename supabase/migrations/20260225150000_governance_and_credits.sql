
-- 1. Update profiles table with new governance fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'blocked')),
ADD COLUMN IF NOT EXISTS credits BIGINT DEFAULT 20000,
ADD COLUMN IF NOT EXISTS last_reset TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 2. Update handle_new_user function for automatic role assignment and pending status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role, status, credits)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name',
    CASE 
      WHEN NEW.email = 'catatau@unicfilm.com.br' THEN 'admin_master'
      ELSE 'user'
    END,
    CASE 
      WHEN NEW.email = 'catatau@unicfilm.com.br' THEN 'active'
      ELSE 'active' -- Changed from 'pending' for temporary open team testing
    END,
    CASE 
      WHEN NEW.email = 'catatau@unicfilm.com.br' THEN 999999999 -- "Unlimited" for admin
      ELSE 20000
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Update existing catatau user to admin if exists
UPDATE public.profiles
SET role = 'admin_master', status = 'active', credits = 999999999
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'catatau@unicfilm.com.br');

-- 4. RLS update: Users can only see/edit their own profiles
-- (Previously defined, but let's ensure Admins can see all)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile or admin can view all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin_master');

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile or admin can update all"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin_master');
