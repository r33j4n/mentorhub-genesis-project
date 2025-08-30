-- Update session_type check constraint to allow 'one_on_one'
-- First, drop the existing check constraint
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_session_type_check;

-- Add the new check constraint that includes 'one_on_one'
ALTER TABLE public.sessions ADD CONSTRAINT sessions_session_type_check 
CHECK (session_type IN ('regular', 'subscription_call', 'one_on_one'));

-- Update any existing 'one_on_one' values to 'regular' if they exist
UPDATE public.sessions 
SET session_type = 'regular' 
WHERE session_type = 'one_on_one' AND session_type IS NOT NULL; 