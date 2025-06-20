
-- First, drop the existing problematic policies
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;

-- Create a security definer function to check if a user is an admin
-- This function bypasses RLS and prevents recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = $1 
    AND role_type = 'admin'
  );
$$;

-- Create new policies using the security definer function
CREATE POLICY "Admins can view all user roles" 
  ON public.user_roles 
  FOR SELECT 
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update user roles" 
  ON public.user_roles 
  FOR UPDATE 
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Also fix the other admin policies that might have the same issue
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all mentors" ON public.mentors;
DROP POLICY IF EXISTS "Admins can update all mentors" ON public.mentors;
DROP POLICY IF EXISTS "Admins can view all mentees" ON public.mentees;
DROP POLICY IF EXISTS "Admins can update all mentees" ON public.mentees;

-- Recreate the admin policies using the security definer function
CREATE POLICY "Admins can view all users" 
  ON public.users 
  FOR SELECT 
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all users" 
  ON public.users 
  FOR UPDATE 
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all mentors" 
  ON public.mentors 
  FOR SELECT 
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all mentors" 
  ON public.mentors 
  FOR UPDATE 
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all mentees" 
  ON public.mentees 
  FOR SELECT 
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all mentees" 
  ON public.mentees 
  FOR UPDATE 
  TO authenticated
  USING (public.is_admin(auth.uid()));
