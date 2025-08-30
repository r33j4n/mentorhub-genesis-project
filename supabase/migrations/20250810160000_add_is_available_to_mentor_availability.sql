-- Add is_available column to mentor_availability table
ALTER TABLE public.mentor_availability 
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Update existing records to have is_available = true
UPDATE public.mentor_availability 
SET is_available = true 
WHERE is_available IS NULL; 