-- Add missing columns to mentors table
ALTER TABLE public.mentors
ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_sessions_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS response_rate DECIMAL(5,2) DEFAULT 0;

-- Update existing mentors with default values
UPDATE public.mentors
SET 
  experience_years = COALESCE(experience_years, 0),
  reviews_count = COALESCE(reviews_count, 0),
  total_sessions_completed = COALESCE(total_sessions_completed, 0),
  total_earnings = COALESCE(total_earnings, 0),
  response_rate = COALESCE(response_rate, 0)
WHERE experience_years IS NULL OR reviews_count IS NULL OR total_sessions_completed IS NULL OR total_earnings IS NULL OR response_rate IS NULL; 