-- Create ideas table for mentees to post their business ideas
CREATE TABLE IF NOT EXISTS public.ideas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentee_id UUID NOT NULL REFERENCES public.mentees(mentee_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    industry TEXT,
    stage TEXT CHECK (stage IN ('idea', 'prototype', 'mvp', 'early_traction', 'scaling')),
    funding_needed DECIMAL(12,2),
    equity_offered DECIMAL(5,2), -- percentage
    contact_email TEXT,
    contact_phone TEXT,
    is_active BOOLEAN DEFAULT true,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create idea_views table to track who viewed the idea
CREATE TABLE IF NOT EXISTS public.idea_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(idea_id, viewer_id)
);

-- Create idea_contacts table to track mentor interest in ideas
CREATE TABLE IF NOT EXISTS public.idea_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES public.mentors(mentor_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    contact_method TEXT CHECK (contact_method IN ('email', 'phone', 'platform')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'contacted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(idea_id, mentor_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ideas_mentee_id ON public.ideas(mentee_id);
CREATE INDEX IF NOT EXISTS idx_ideas_is_active ON public.ideas(is_active);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON public.ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_industry ON public.ideas(industry);
CREATE INDEX IF NOT EXISTS idx_ideas_stage ON public.ideas(stage);
CREATE INDEX IF NOT EXISTS idx_idea_views_idea_id ON public.idea_views(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_contacts_idea_id ON public.idea_contacts(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_contacts_mentor_id ON public.idea_contacts(mentor_id);

-- Create function to update views count
CREATE OR REPLACE FUNCTION public.update_idea_views_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.ideas 
        SET views_count = views_count + 1 
        WHERE id = NEW.idea_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

-- Create trigger to automatically update views count
DROP TRIGGER IF EXISTS trigger_update_idea_views_count ON public.idea_views;
CREATE TRIGGER trigger_update_idea_views_count
    AFTER INSERT ON public.idea_views
    FOR EACH ROW EXECUTE FUNCTION public.update_idea_views_count();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS trigger_update_ideas_updated_at ON public.ideas;
CREATE TRIGGER trigger_update_ideas_updated_at
    BEFORE UPDATE ON public.ideas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_idea_contacts_updated_at ON public.idea_contacts;
CREATE TRIGGER trigger_update_idea_contacts_updated_at
    BEFORE UPDATE ON public.idea_contacts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for ideas table
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

-- Anyone can view active ideas
CREATE POLICY "Anyone can view active ideas" ON public.ideas
    FOR SELECT USING (is_active = true);

-- Mentees can view their own ideas (including inactive ones)
CREATE POLICY "Mentees can view their own ideas" ON public.ideas
    FOR SELECT USING (
        mentee_id IN (
            SELECT mentee_id FROM public.mentees 
            WHERE mentee_id IN (
                SELECT user_id FROM public.user_roles 
                WHERE role = 'mentee' AND user_id = auth.uid()
            )
        )
    );

-- Mentees can insert their own ideas
CREATE POLICY "Mentees can insert their own ideas" ON public.ideas
    FOR INSERT WITH CHECK (
        mentee_id IN (
            SELECT mentee_id FROM public.mentees 
            WHERE mentee_id IN (
                SELECT user_id FROM public.user_roles 
                WHERE role = 'mentee' AND user_id = auth.uid()
            )
        )
    );

-- Mentees can update their own ideas
CREATE POLICY "Mentees can update their own ideas" ON public.ideas
    FOR UPDATE USING (
        mentee_id IN (
            SELECT mentee_id FROM public.mentees 
            WHERE mentee_id IN (
                SELECT user_id FROM public.user_roles 
                WHERE role = 'mentee' AND user_id = auth.uid()
            )
        )
    );

-- Mentees can delete their own ideas
CREATE POLICY "Mentees can delete their own ideas" ON public.ideas
    FOR DELETE USING (
        mentee_id IN (
            SELECT mentee_id FROM public.mentees 
            WHERE mentee_id IN (
                SELECT user_id FROM public.user_roles 
                WHERE role = 'mentee' AND user_id = auth.uid()
            )
        )
    );

-- Admins can do everything
CREATE POLICY "Admins can do everything on ideas" ON public.ideas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for idea_views table
ALTER TABLE public.idea_views ENABLE ROW LEVEL SECURITY;

-- Users can view their own view records
CREATE POLICY "Users can view their own view records" ON public.idea_views
    FOR SELECT USING (viewer_id = auth.uid());

-- Anyone can insert view records
CREATE POLICY "Anyone can insert view records" ON public.idea_views
    FOR INSERT WITH CHECK (true);

-- RLS Policies for idea_contacts table
ALTER TABLE public.idea_contacts ENABLE ROW LEVEL SECURITY;

-- Mentors can view their own contact records
CREATE POLICY "Mentors can view their own contact records" ON public.idea_contacts
    FOR SELECT USING (
        mentor_id IN (
            SELECT mentor_id FROM public.mentors 
            WHERE mentor_id IN (
                SELECT user_id FROM public.user_roles 
                WHERE role = 'mentor' AND user_id = auth.uid()
            )
        )
    );

-- Mentees can view contact records for their ideas
CREATE POLICY "Mentees can view contact records for their ideas" ON public.idea_contacts
    FOR SELECT USING (
        idea_id IN (
            SELECT id FROM public.ideas 
            WHERE mentee_id IN (
                SELECT mentee_id FROM public.mentees 
                WHERE mentee_id IN (
                    SELECT user_id FROM public.user_roles 
                    WHERE role = 'mentee' AND user_id = auth.uid()
                )
            )
        )
    );

-- Mentors can insert contact records
CREATE POLICY "Mentors can insert contact records" ON public.idea_contacts
    FOR INSERT WITH CHECK (
        mentor_id IN (
            SELECT mentor_id FROM public.mentors 
            WHERE mentor_id IN (
                SELECT user_id FROM public.user_roles 
                WHERE role = 'mentor' AND user_id = auth.uid()
            )
        )
    );

-- Mentors can update their own contact records
CREATE POLICY "Mentors can update their own contact records" ON public.idea_contacts
    FOR UPDATE USING (
        mentor_id IN (
            SELECT mentor_id FROM public.mentors 
            WHERE mentor_id IN (
                SELECT user_id FROM public.user_roles 
                WHERE role = 'mentor' AND user_id = auth.uid()
            )
        )
    );

-- Admins can do everything
CREATE POLICY "Admins can do everything on idea_contacts" ON public.idea_contacts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    ); 