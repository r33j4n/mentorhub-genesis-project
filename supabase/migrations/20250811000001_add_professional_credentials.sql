-- Add professional credentials and certifications support
-- This is crucial for healthcare, legal, and other regulated professions

-- Create professional credentials table
CREATE TABLE IF NOT EXISTS public.professional_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentor_id UUID NOT NULL REFERENCES public.mentors(mentor_id) ON DELETE CASCADE,
    credential_type TEXT NOT NULL, -- 'license', 'certification', 'degree', 'membership'
    credential_name TEXT NOT NULL,
    issuing_organization TEXT NOT NULL,
    credential_number TEXT,
    issue_date DATE,
    expiry_date DATE,
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP WITH TIME ZONE,
    verification_notes TEXT,
    document_url TEXT, -- URL to uploaded credential document
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create professional specializations table
CREATE TABLE IF NOT EXISTS public.professional_specializations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentor_id UUID NOT NULL REFERENCES public.mentors(mentor_id) ON DELETE CASCADE,
    specialization_name TEXT NOT NULL,
    years_of_experience INTEGER,
    description TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add professional fields to mentors table
ALTER TABLE public.mentors 
ADD COLUMN IF NOT EXISTS professional_title TEXT,
ADD COLUMN IF NOT EXISTS years_of_practice INTEGER,
ADD COLUMN IF NOT EXISTS practice_license_number TEXT,
ADD COLUMN IF NOT EXISTS practice_license_state TEXT,
ADD COLUMN IF NOT EXISTS practice_license_country TEXT,
ADD COLUMN IF NOT EXISTS practice_license_expiry DATE,
ADD COLUMN IF NOT EXISTS is_licensed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS license_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS professional_summary TEXT,
ADD COLUMN IF NOT EXISTS consultation_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS accepts_insurance BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS insurance_providers TEXT[],
ADD COLUMN IF NOT EXISTS languages_spoken TEXT[],
ADD COLUMN IF NOT EXISTS consultation_duration INTEGER DEFAULT 60, -- in minutes
ADD COLUMN IF NOT EXISTS consultation_type TEXT DEFAULT 'video', -- 'video', 'phone', 'in_person', 'chat'
ADD COLUMN IF NOT EXISTS availability_schedule JSONB,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS professional_website TEXT,
ADD COLUMN IF NOT EXISTS linkedin_profile TEXT,
ADD COLUMN IF NOT EXISTS professional_photo TEXT;

-- Create professional domains table for categorization
CREATE TABLE IF NOT EXISTS public.professional_domains (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert professional domains
INSERT INTO public.professional_domains (name, description, display_order) VALUES
('Healthcare & Medicine', 'Medical professionals, doctors, nurses, specialists', 1),
('Mental Health & Counseling', 'Psychologists, therapists, counselors', 2),
('Business & Professional Development', 'Business consultants, coaches, trainers', 3),
('Legal & Professional Services', 'Lawyers, legal consultants, compliance', 4),
('Education & Training', 'Teachers, tutors, educational consultants', 5),
('Technology & IT', 'Software developers, IT consultants, tech experts', 6),
('Creative & Media', 'Designers, writers, content creators', 7),
('Fitness & Wellness', 'Personal trainers, nutritionists, wellness coaches', 8),
('Finance & Investment', 'Financial advisors, accountants, investment consultants', 9),
('Real Estate', 'Real estate agents, property consultants', 10),
('Marketing & Sales', 'Marketing consultants, sales trainers', 11),
('Human Resources', 'HR consultants, recruiters, workplace experts', 12),
('Engineering', 'Engineers, technical consultants', 13),
('Science & Research', 'Scientists, researchers, analysts', 14),
('Arts & Entertainment', 'Artists, performers, creative professionals', 15),
('Social Services', 'Social workers, community advocates', 16),
('Environmental & Sustainability', 'Environmental consultants, sustainability experts', 17),
('Government & Public Policy', 'Policy analysts, government consultants', 18),
('Nonprofit & Social Impact', 'Nonprofit leaders, social entrepreneurs', 19),
('Other', 'Other professional services', 20);

-- Add domain_id to expertise_areas table
ALTER TABLE public.expertise_areas 
ADD COLUMN IF NOT EXISTS domain_id UUID REFERENCES public.professional_domains(id),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create professional verification requests table
CREATE TABLE IF NOT EXISTS public.professional_verification_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentor_id UUID NOT NULL REFERENCES public.mentors(mentor_id) ON DELETE CASCADE,
    credential_id UUID REFERENCES public.professional_credentials(id),
    request_type TEXT NOT NULL, -- 'license_verification', 'credential_verification', 'background_check'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_review', 'approved', 'rejected'
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES public.users(user_id),
    review_notes TEXT,
    documents_submitted JSONB,
    verification_fee DECIMAL(10,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'pending' -- 'pending', 'paid', 'refunded'
);

-- Create professional consultation types table
CREATE TABLE IF NOT EXISTS public.consultation_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert common consultation types
INSERT INTO public.consultation_types (name, description, duration_minutes) VALUES
('Initial Consultation', 'First meeting to understand needs and goals', 30),
('Follow-up Session', 'Regular ongoing consultation', 60),
('Emergency Consultation', 'Urgent or crisis consultation', 30),
('Group Session', 'Group consultation or workshop', 90),
('Assessment Session', 'Comprehensive evaluation and assessment', 120),
('Strategy Session', 'Strategic planning and goal setting', 90),
('Review Session', 'Progress review and adjustment', 45),
('Training Session', 'Skill development and training', 120),
('Coaching Session', 'One-on-one coaching and guidance', 60),
('Therapy Session', 'Therapeutic intervention and support', 60),
('Consultation Package', 'Multiple sessions package', 240),
('Workshop', 'Educational workshop or seminar', 180);

-- Add RLS policies for new tables
ALTER TABLE public.professional_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_types ENABLE ROW LEVEL SECURITY;

-- Professional credentials policies
CREATE POLICY "Users can view their own credentials" ON public.professional_credentials
    FOR SELECT USING (mentor_id = auth.uid());

CREATE POLICY "Users can insert their own credentials" ON public.professional_credentials
    FOR INSERT WITH CHECK (mentor_id = auth.uid());

CREATE POLICY "Users can update their own credentials" ON public.professional_credentials
    FOR UPDATE USING (mentor_id = auth.uid());

CREATE POLICY "Admins can view all credentials" ON public.professional_credentials
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Professional specializations policies
CREATE POLICY "Users can view their own specializations" ON public.professional_specializations
    FOR SELECT USING (mentor_id = auth.uid());

CREATE POLICY "Users can insert their own specializations" ON public.professional_specializations
    FOR INSERT WITH CHECK (mentor_id = auth.uid());

CREATE POLICY "Users can update their own specializations" ON public.professional_specializations
    FOR UPDATE USING (mentor_id = auth.uid());

-- Professional domains policies (read-only for all users)
CREATE POLICY "All users can view professional domains" ON public.professional_domains
    FOR SELECT USING (true);

-- Professional verification requests policies
CREATE POLICY "Users can view their own verification requests" ON public.professional_verification_requests
    FOR SELECT USING (mentor_id = auth.uid());

CREATE POLICY "Users can insert their own verification requests" ON public.professional_verification_requests
    FOR INSERT WITH CHECK (mentor_id = auth.uid());

CREATE POLICY "Admins can view all verification requests" ON public.professional_verification_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update verification requests" ON public.professional_verification_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Consultation types policies (read-only for all users)
CREATE POLICY "All users can view consultation types" ON public.consultation_types
    FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_professional_credentials_mentor_id ON public.professional_credentials(mentor_id);
CREATE INDEX IF NOT EXISTS idx_professional_credentials_type ON public.professional_credentials(credential_type);
CREATE INDEX IF NOT EXISTS idx_professional_credentials_verified ON public.professional_credentials(is_verified);
CREATE INDEX IF NOT EXISTS idx_professional_specializations_mentor_id ON public.professional_specializations(mentor_id);
CREATE INDEX IF NOT EXISTS idx_professional_verification_requests_mentor_id ON public.professional_verification_requests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_professional_verification_requests_status ON public.professional_verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_expertise_areas_domain_id ON public.expertise_areas(domain_id); 