-- Fix RLS policies for mentees and seminar participants

-- Allow authenticated users to insert their own mentee record
CREATE POLICY "Users can insert their own mentee record" ON public.mentees
  FOR INSERT WITH CHECK (auth.uid() = mentee_id);

-- Allow authenticated users to view their own mentee record
CREATE POLICY "Users can view their own mentee record" ON public.mentees
  FOR SELECT USING (auth.uid() = mentee_id);

-- Allow authenticated users to update their own mentee record
CREATE POLICY "Users can update their own mentee record" ON public.mentees
  FOR UPDATE USING (auth.uid() = mentee_id);

-- Allow authenticated users to insert seminar participants
CREATE POLICY "Users can insert seminar participants" ON public.seminar_participants
  FOR INSERT WITH CHECK (auth.uid() = mentee_id);

-- Allow authenticated users to view their own seminar participants
CREATE POLICY "Users can view their own seminar participants" ON public.seminar_participants
  FOR SELECT USING (auth.uid() = mentee_id);

-- Allow authenticated users to delete their own seminar participants
CREATE POLICY "Users can delete their own seminar participants" ON public.seminar_participants
  FOR DELETE USING (auth.uid() = mentee_id);

-- Allow mentors to view participants of their seminars
CREATE POLICY "Mentors can view participants of their seminars" ON public.seminar_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.public_seminars 
      WHERE public_seminars.id = seminar_participants.seminar_id 
      AND public_seminars.mentor_id = auth.uid()
    )
  );

-- Allow admins to view all seminar participants
CREATE POLICY "Admins can view all seminar participants" ON public.seminar_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  ); 