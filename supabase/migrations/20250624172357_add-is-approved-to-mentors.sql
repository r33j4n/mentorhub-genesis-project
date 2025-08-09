-- Add is_approved column to mentors table
ALTER TABLE mentors ADD COLUMN is_approved boolean NOT NULL DEFAULT true;
