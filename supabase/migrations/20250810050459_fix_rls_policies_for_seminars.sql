-- Drop existing policies for public_seminars
DROP POLICY IF EXISTS "Anyone can view public seminars" ON public_seminars;
DROP POLICY IF EXISTS "Mentors can create their own seminars" ON public_seminars;
DROP POLICY IF EXISTS "Mentors can update their own seminars" ON public_seminars;
DROP POLICY IF EXISTS "Mentors can delete their own seminars" ON public_seminars;

-- Create new policies for public_seminars
CREATE POLICY "Anyone can view public seminars" ON public_seminars
    FOR SELECT USING (true);

CREATE POLICY "Mentors can create their own seminars" ON public_seminars
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM mentors 
            WHERE mentor_id = auth.uid() 
            AND mentor_id = public_seminars.mentor_id
        )
    );

CREATE POLICY "Mentors can update their own seminars" ON public_seminars
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM mentors 
            WHERE mentor_id = auth.uid() 
            AND mentor_id = public_seminars.mentor_id
        )
    );

CREATE POLICY "Mentors can delete their own seminars" ON public_seminars
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM mentors 
            WHERE mentor_id = auth.uid() 
            AND mentor_id = public_seminars.mentor_id
        )
    );

-- Also fix the mentor_follows policies
DROP POLICY IF EXISTS "Users can view their own follows" ON mentor_follows;
DROP POLICY IF EXISTS "Users can create their own follows" ON mentor_follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON mentor_follows;

CREATE POLICY "Users can view their own follows" ON mentor_follows
    FOR SELECT USING (auth.uid() = mentee_id);

CREATE POLICY "Users can create their own follows" ON mentor_follows
    FOR INSERT WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Users can delete their own follows" ON mentor_follows
    FOR DELETE USING (auth.uid() = mentee_id);

-- Fix seminar_participants policies
DROP POLICY IF EXISTS "Users can view their own participations" ON seminar_participants;
DROP POLICY IF EXISTS "Users can join seminars" ON seminar_participants;
DROP POLICY IF EXISTS "Users can leave seminars" ON seminar_participants;

CREATE POLICY "Users can view their own participations" ON seminar_participants
    FOR SELECT USING (auth.uid() = mentee_id);

CREATE POLICY "Users can join seminars" ON seminar_participants
    FOR INSERT WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Users can leave seminars" ON seminar_participants
    FOR DELETE USING (auth.uid() = mentee_id);

-- Fix seminar_notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON seminar_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON seminar_notifications;

CREATE POLICY "Users can view their own notifications" ON seminar_notifications
    FOR SELECT USING (auth.uid() = mentee_id);

CREATE POLICY "Users can update their own notifications" ON seminar_notifications
    FOR UPDATE USING (auth.uid() = mentee_id);
