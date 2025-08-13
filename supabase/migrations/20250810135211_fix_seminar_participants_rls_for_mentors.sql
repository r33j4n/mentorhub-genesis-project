-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own participations" ON seminar_participants;

-- Create a new policy that allows both mentees to view their own participations and mentors to view participants of their seminars
CREATE POLICY "Users can view their own participations and mentors can view their seminar participants" ON seminar_participants
    FOR SELECT USING (
        auth.uid() = mentee_id OR 
        auth.uid() IN (
            SELECT mentor_id 
            FROM public_seminars 
            WHERE public_seminars.id = seminar_participants.seminar_id
        )
    );
