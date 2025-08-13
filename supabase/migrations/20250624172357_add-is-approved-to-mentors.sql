-- Add is_approved column to mentors table (if it doesn't exist)
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT true;
