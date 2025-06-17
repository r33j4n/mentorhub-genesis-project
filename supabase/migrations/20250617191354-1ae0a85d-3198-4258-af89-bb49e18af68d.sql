
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

-- Add some default expertise areas
INSERT INTO public.expertise_areas (name, category, description) VALUES 
('JavaScript', 'Programming', 'Modern JavaScript development and frameworks'),
('React', 'Programming', 'React.js frontend development'),
('Node.js', 'Programming', 'Backend development with Node.js'),
('Python', 'Programming', 'Python programming and frameworks'),
('Data Science', 'Analytics', 'Data analysis, machine learning, and statistics'),
('Product Management', 'Business', 'Product strategy and management'),
('UX/UI Design', 'Design', 'User experience and interface design'),
('DevOps', 'Infrastructure', 'Development operations and cloud infrastructure'),
('Marketing', 'Business', 'Digital marketing and growth strategies'),
('Career Development', 'Professional', 'Career guidance and professional growth')
ON CONFLICT (name) DO NOTHING;
