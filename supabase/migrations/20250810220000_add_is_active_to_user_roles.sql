-- Add is_active column to user_roles table
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing user roles to have default values
UPDATE public.user_roles
SET is_active = COALESCE(is_active, true)
WHERE is_active IS NULL; 