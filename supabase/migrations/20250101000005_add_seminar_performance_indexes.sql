-- Add performance indexes for seminar queries
-- This will significantly improve loading times for public seminars

-- Index for public_seminars table
CREATE INDEX IF NOT EXISTS idx_public_seminars_date_status 
ON public_seminars (seminar_date, status);

-- Index for seminar_participants table
CREATE INDEX IF NOT EXISTS idx_seminar_participants_mentee 
ON seminar_participants (mentee_id, seminar_id);

-- Index for mentor_follows table
CREATE INDEX IF NOT EXISTS idx_mentor_follows_mentee 
ON mentor_follows (mentee_id, mentor_id);

-- Composite index for better seminar queries
CREATE INDEX IF NOT EXISTS idx_public_seminars_mentor_date 
ON public_seminars (mentor_id, seminar_date, status);

-- Index for current_participants for seat availability checks
CREATE INDEX IF NOT EXISTS idx_public_seminars_participants 
ON public_seminars (current_participants, max_participants);

-- Add comments for documentation
COMMENT ON INDEX idx_public_seminars_date_status IS 'Optimizes queries for upcoming seminars by date and status';
COMMENT ON INDEX idx_seminar_participants_mentee IS 'Optimizes participation status checks for users';
COMMENT ON INDEX idx_mentor_follows_mentee IS 'Optimizes mentor following queries';
COMMENT ON INDEX idx_public_seminars_mentor_date IS 'Optimizes mentor-specific seminar queries';
COMMENT ON INDEX idx_public_seminars_participants IS 'Optimizes seat availability checks'; 