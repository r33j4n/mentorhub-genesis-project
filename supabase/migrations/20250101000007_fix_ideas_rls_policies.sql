-- Fix RLS policies for ideas table to be less restrictive
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view active ideas" ON public.ideas;
DROP POLICY IF EXISTS "Mentees can view their own ideas" ON public.ideas;
DROP POLICY IF EXISTS "Mentees can insert their own ideas" ON public.ideas;
DROP POLICY IF EXISTS "Mentees can update their own ideas" ON public.ideas;
DROP POLICY IF EXISTS "Mentees can delete their own ideas" ON public.ideas;
DROP POLICY IF EXISTS "Admins can do everything on ideas" ON public.ideas;

-- Create simplified policies
-- Anyone can view active ideas (this is the main fix)
CREATE POLICY "Anyone can view active ideas" ON public.ideas
    FOR SELECT USING (is_active = true);

-- Users can insert ideas if they are authenticated
CREATE POLICY "Authenticated users can insert ideas" ON public.ideas
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own ideas
CREATE POLICY "Users can update their own ideas" ON public.ideas
    FOR UPDATE USING (mentee_id = auth.uid());

-- Users can delete their own ideas
CREATE POLICY "Users can delete their own ideas" ON public.ideas
    FOR DELETE USING (mentee_id = auth.uid());

-- Fix RLS policies for idea_contacts table
DROP POLICY IF EXISTS "Mentors can view their own contact records" ON public.idea_contacts;
DROP POLICY IF EXISTS "Mentees can view contact records for their ideas" ON public.idea_contacts;
DROP POLICY IF EXISTS "Mentors can insert contact records" ON public.idea_contacts;
DROP POLICY IF EXISTS "Mentors can update their own contact records" ON public.idea_contacts;
DROP POLICY IF EXISTS "Admins can do everything on idea_contacts" ON public.idea_contacts;

-- Create simplified policies for idea_contacts
-- Users can view their own contact records
CREATE POLICY "Users can view their own contact records" ON public.idea_contacts
    FOR SELECT USING (mentor_id = auth.uid());

-- Users can view contact records for their ideas
CREATE POLICY "Users can view contacts for their ideas" ON public.idea_contacts
    FOR SELECT USING (
        idea_id IN (
            SELECT id FROM public.ideas WHERE mentee_id = auth.uid()
        )
    );

-- Authenticated users can insert contact records
CREATE POLICY "Authenticated users can insert contact records" ON public.idea_contacts
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own contact records
CREATE POLICY "Users can update their own contact records" ON public.idea_contacts
    FOR UPDATE USING (mentor_id = auth.uid()); 