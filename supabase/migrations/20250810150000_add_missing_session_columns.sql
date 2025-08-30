-- Add missing columns to sessions table
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS final_price DECIMAL(10,2);

-- Add default values for existing records
UPDATE public.sessions 
SET 
  title = COALESCE(title, 'Mentoring Session'),
  description = COALESCE(description, 'A mentoring session'),
  duration_minutes = COALESCE(duration_minutes, 60),
  final_price = COALESCE(final_price, 0.00)
WHERE title IS NULL OR description IS NULL OR duration_minutes IS NULL OR final_price IS NULL; 