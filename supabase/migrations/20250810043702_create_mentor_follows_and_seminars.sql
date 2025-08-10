-- Create mentor follows table
CREATE TABLE IF NOT EXISTS mentor_follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES mentors(mentor_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mentee_id, mentor_id)
);

-- Create public seminars table
CREATE TABLE IF NOT EXISTS public_seminars (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentor_id UUID NOT NULL REFERENCES mentors(mentor_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    seminar_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    is_free BOOLEAN DEFAULT true,
    price DECIMAL(10,2) DEFAULT 0.00,
    zoom_meeting_id VARCHAR(255),
    zoom_password VARCHAR(255),
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create seminar participants table
CREATE TABLE IF NOT EXISTS seminar_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seminar_id UUID NOT NULL REFERENCES public_seminars(id) ON DELETE CASCADE,
    mentee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(seminar_id, mentee_id)
);

-- Create seminar notifications table
CREATE TABLE IF NOT EXISTS seminar_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seminar_id UUID NOT NULL REFERENCES public_seminars(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES mentors(mentor_id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('new_seminar', 'seminar_reminder', 'seminar_starting')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mentor_follows_mentee_id ON mentor_follows(mentee_id);
CREATE INDEX IF NOT EXISTS idx_mentor_follows_mentor_id ON mentor_follows(mentor_id);
CREATE INDEX IF NOT EXISTS idx_public_seminars_mentor_id ON public_seminars(mentor_id);
CREATE INDEX IF NOT EXISTS idx_public_seminars_date ON public_seminars(seminar_date);
CREATE INDEX IF NOT EXISTS idx_seminar_participants_seminar_id ON seminar_participants(seminar_id);
CREATE INDEX IF NOT EXISTS idx_seminar_participants_mentee_id ON seminar_participants(mentee_id);
CREATE INDEX IF NOT EXISTS idx_seminar_notifications_mentee_id ON seminar_notifications(mentee_id);
CREATE INDEX IF NOT EXISTS idx_seminar_notifications_is_read ON seminar_notifications(is_read);

-- Add RLS policies
ALTER TABLE mentor_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_seminars ENABLE ROW LEVEL SECURITY;
ALTER TABLE seminar_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE seminar_notifications ENABLE ROW LEVEL SECURITY;

-- Mentor follows policies
CREATE POLICY "Users can view their own follows" ON mentor_follows
    FOR SELECT USING (auth.uid() = mentee_id);

CREATE POLICY "Users can create their own follows" ON mentor_follows
    FOR INSERT WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Users can delete their own follows" ON mentor_follows
    FOR DELETE USING (auth.uid() = mentee_id);

-- Public seminars policies
CREATE POLICY "Anyone can view public seminars" ON public_seminars
    FOR SELECT USING (true);

CREATE POLICY "Mentors can create their own seminars" ON public_seminars
    FOR INSERT WITH CHECK (auth.uid() = mentor_id);

CREATE POLICY "Mentors can update their own seminars" ON public_seminars
    FOR UPDATE USING (auth.uid() = mentor_id);

CREATE POLICY "Mentors can delete their own seminars" ON public_seminars
    FOR DELETE USING (auth.uid() = mentor_id);

-- Seminar participants policies
CREATE POLICY "Users can view their own participations" ON seminar_participants
    FOR SELECT USING (auth.uid() = mentee_id);

CREATE POLICY "Users can join seminars" ON seminar_participants
    FOR INSERT WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Users can leave seminars" ON seminar_participants
    FOR DELETE USING (auth.uid() = mentee_id);

-- Seminar notifications policies
CREATE POLICY "Users can view their own notifications" ON seminar_notifications
    FOR SELECT USING (auth.uid() = mentee_id);

CREATE POLICY "Users can update their own notifications" ON seminar_notifications
    FOR UPDATE USING (auth.uid() = mentee_id);

-- Function to create notifications when a new seminar is created
CREATE OR REPLACE FUNCTION create_seminar_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert notifications for all followers of the mentor
    INSERT INTO seminar_notifications (mentee_id, seminar_id, mentor_id, notification_type, title, message)
    SELECT 
        mf.mentee_id,
        NEW.id,
        NEW.mentor_id,
        'new_seminar',
        'New Seminar: ' || NEW.title,
        'A mentor you follow has posted a new public seminar: "' || NEW.title || '". Join now!'
    FROM mentor_follows mf
    WHERE mf.mentor_id = NEW.mentor_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create notifications when a seminar is created
CREATE TRIGGER trigger_create_seminar_notifications
    AFTER INSERT ON public_seminars
    FOR EACH ROW
    EXECUTE FUNCTION create_seminar_notifications();

-- Function to update participant count
CREATE OR REPLACE FUNCTION update_seminar_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public_seminars 
        SET current_participants = current_participants + 1
        WHERE id = NEW.seminar_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public_seminars 
        SET current_participants = current_participants - 1
        WHERE id = OLD.seminar_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update participant count
CREATE TRIGGER trigger_update_seminar_participant_count
    AFTER INSERT OR DELETE ON seminar_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_seminar_participant_count();
