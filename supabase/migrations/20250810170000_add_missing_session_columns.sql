-- Add missing columns to sessions table for pricing and session details
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,4),
ADD COLUMN IF NOT EXISTS final_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'one_on_one',
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;

-- Update existing records with default values
UPDATE public.sessions 
SET 
  base_price = COALESCE(base_price, 0.00),
  platform_fee = COALESCE(platform_fee, 0.00),
  commission_rate = COALESCE(commission_rate, 0.15),
  final_price = COALESCE(final_price, 0.00),
  session_type = COALESCE(session_type, 'one_on_one'),
  title = COALESCE(title, 'Mentoring Session'),
  description = COALESCE(description, 'A mentoring session'),
  duration_minutes = COALESCE(duration_minutes, 60)
WHERE base_price IS NULL OR platform_fee IS NULL OR commission_rate IS NULL OR final_price IS NULL OR session_type IS NULL OR title IS NULL OR description IS NULL OR duration_minutes IS NULL; 