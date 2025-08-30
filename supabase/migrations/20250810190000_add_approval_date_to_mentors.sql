-- Add approval_date and approved_by columns to mentors table
ALTER TABLE public.mentors
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(user_id);

-- Update existing approved mentors to have an approval date
UPDATE public.mentors
SET approval_date = created_at
WHERE is_approved = true AND approval_date IS NULL; 