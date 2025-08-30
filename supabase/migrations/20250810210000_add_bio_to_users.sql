-- Add bio column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add is_active column to users table if it doesn't exist
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing users to have default values
UPDATE public.users
SET 
  bio = COALESCE(bio, ''),
  is_active = COALESCE(is_active, true)
WHERE bio IS NULL OR is_active IS NULL; 