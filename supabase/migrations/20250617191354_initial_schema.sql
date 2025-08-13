-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    profile_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('mentor', 'mentee', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Create expertise_areas table
CREATE TABLE IF NOT EXISTS public.expertise_areas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mentors table
CREATE TABLE IF NOT EXISTS public.mentors (
    mentor_id UUID PRIMARY KEY REFERENCES public.users(user_id) ON DELETE CASCADE,
    bio TEXT,
    hourly_rate DECIMAL(10,2),
    rating DECIMAL(3,2) DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mentees table
CREATE TABLE IF NOT EXISTS public.mentees (
    mentee_id UUID PRIMARY KEY REFERENCES public.users(user_id) ON DELETE CASCADE,
    bio TEXT,
    goals TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mentor_expertise table
CREATE TABLE IF NOT EXISTS public.mentor_expertise (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentor_id UUID NOT NULL REFERENCES public.mentors(mentor_id) ON DELETE CASCADE,
    area_id UUID NOT NULL REFERENCES public.expertise_areas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mentor_id, area_id)
);

-- Create mentor_availability table
CREATE TABLE IF NOT EXISTS public.mentor_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentor_id UUID NOT NULL REFERENCES public.mentors(mentor_id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mentor_id, day_of_week, start_time, end_time)
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentor_id UUID NOT NULL REFERENCES public.mentors(mentor_id) ON DELETE CASCADE,
    mentee_id UUID NOT NULL REFERENCES public.mentees(mentee_id) ON DELETE CASCADE,
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'cancelled', 'completed', 'in_progress', 'no_show')),
    notes TEXT,
    zoom_meeting_id TEXT,
    zoom_password TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES public.mentors(mentor_id) ON DELETE CASCADE,
    mentee_id UUID NOT NULL REFERENCES public.mentees(mentee_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id)
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversation_participants table
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_days INTEGER NOT NULL,
    max_sessions INTEGER,
    features JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    payment_method TEXT,
    transaction_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI recommendations table
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentee_id UUID NOT NULL REFERENCES public.mentees(mentee_id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES public.mentors(mentor_id) ON DELETE CASCADE,
    score DECIMAL(3,2) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- First, let's create a function to handle new user registration and sync with our users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create user profile when someone signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add RLS policies for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = user_id);

-- Add RLS policies for user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roles" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add RLS policies for mentors table
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentors can view all mentor profiles" ON public.mentors
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own mentor profile" ON public.mentors
  FOR ALL USING (auth.uid() = mentor_id);

-- Add RLS policies for mentees table
ALTER TABLE public.mentees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mentee profile" ON public.mentees
  FOR SELECT USING (auth.uid() = mentee_id);

CREATE POLICY "Users can manage their own mentee profile" ON public.mentees
  FOR ALL USING (auth.uid() = mentee_id);

-- Add RLS policies for mentor_expertise table
ALTER TABLE public.mentor_expertise ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mentor expertise" ON public.mentor_expertise
  FOR SELECT USING (true);

CREATE POLICY "Mentors can manage their own expertise" ON public.mentor_expertise
  FOR ALL USING (
    auth.uid() = mentor_id OR 
    auth.uid() IN (SELECT mentor_id FROM public.mentors WHERE mentor_id = mentor_expertise.mentor_id)
  );

-- Add RLS policies for mentor_availability table
ALTER TABLE public.mentor_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mentor availability" ON public.mentor_availability
  FOR SELECT USING (true);

CREATE POLICY "Mentors can manage their own availability" ON public.mentor_availability
  FOR ALL USING (
    auth.uid() = mentor_id OR
    auth.uid() IN (SELECT mentor_id FROM public.mentors WHERE mentor_id = mentor_availability.mentor_id)
  );

-- Add RLS policies for sessions table
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sessions they're involved in" ON public.sessions
  FOR SELECT USING (
    auth.uid() = mentor_id OR 
    auth.uid() = mentee_id
  );

CREATE POLICY "Mentees can create sessions" ON public.sessions
  FOR INSERT WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Session participants can update sessions" ON public.sessions
  FOR UPDATE USING (
    auth.uid() = mentor_id OR 
    auth.uid() = mentee_id
  );

-- Add RLS policies for reviews table
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Session participants can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = mentee_id OR
    auth.uid() IN (SELECT mentee_id FROM public.sessions WHERE id = session_id)
  );

-- Add RLS policies for conversations table
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session participants can view conversations" ON public.conversations
  FOR SELECT USING (
    auth.uid() IN (
      SELECT mentor_id FROM public.sessions WHERE id = session_id
      UNION
      SELECT mentee_id FROM public.sessions WHERE id = session_id
    )
  );

-- Add RLS policies for conversation_participants table
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversation participants can view participants" ON public.conversation_participants
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.conversation_participants WHERE conversation_id = conversation_participants.conversation_id
    )
  );

CREATE POLICY "Users can join conversations they're part of" ON public.conversation_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add RLS policies for messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversation participants can view messages" ON public.messages
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.conversation_participants WHERE conversation_id = messages.conversation_id
    )
  );

CREATE POLICY "Users can send messages to conversations they're part of" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Add RLS policies for notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Add RLS policies for subscription_plans table
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans
  FOR SELECT USING (true);

-- Add RLS policies for subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own subscriptions" ON public.subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Add RLS policies for payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments" ON public.payments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.subscriptions WHERE id = subscription_id
    )
  );

-- Add RLS policies for AI recommendations table
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentees can view their own recommendations" ON public.ai_recommendations
  FOR SELECT USING (auth.uid() = mentee_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_mentors_rating ON public.mentors(rating);
CREATE INDEX IF NOT EXISTS idx_mentors_hourly_rate ON public.mentors(hourly_rate);
CREATE INDEX IF NOT EXISTS idx_sessions_mentor_id ON public.sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_mentee_id ON public.sessions(mentee_id);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_start ON public.sessions(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_reviews_mentor_id ON public.reviews(mentor_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_mentee_id ON public.ai_recommendations(mentee_id);
