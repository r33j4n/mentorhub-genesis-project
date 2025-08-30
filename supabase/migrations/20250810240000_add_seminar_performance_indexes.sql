-- Add performance indexes for seminar queries

-- Index for seminar participants by mentee_id (for fast lookups)
CREATE INDEX IF NOT EXISTS idx_seminar_participants_mentee_id 
ON public.seminar_participants(mentee_id);

-- Index for seminar participants by seminar_id (for fast lookups)
CREATE INDEX IF NOT EXISTS idx_seminar_participants_seminar_id 
ON public.seminar_participants(seminar_id);

-- Index for public seminars by seminar_date (for sorting)
CREATE INDEX IF NOT EXISTS idx_public_seminars_seminar_date 
ON public.public_seminars(seminar_date DESC);

-- Index for public seminars by mentor_id (for filtering)
CREATE INDEX IF NOT EXISTS idx_public_seminars_mentor_id 
ON public.public_seminars(mentor_id);

-- Index for public seminars by status (for filtering)
CREATE INDEX IF NOT EXISTS idx_public_seminars_status 
ON public.public_seminars(status);

-- Composite index for mentor following (for fast lookups)
CREATE INDEX IF NOT EXISTS idx_mentor_follows_mentee_mentor 
ON public.mentor_follows(mentee_id, mentor_id);

-- Index for user roles by user_id and role (for admin checks)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role 
ON public.user_roles(user_id, role); 