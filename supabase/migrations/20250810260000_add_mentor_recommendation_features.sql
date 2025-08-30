-- Add mentor recommendation features

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;

-- Add mentee requirements table
CREATE TABLE IF NOT EXISTS public.mentee_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentee_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
  skills_needed TEXT[],
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  goals TEXT,
  preferred_mentor_style TEXT[],
  availability_preferences TEXT[],
  budget_range_min DECIMAL(10,2),
  budget_range_max DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for mentee_requirements
ALTER TABLE public.mentee_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own requirements" ON public.mentee_requirements
  FOR ALL USING (auth.uid() = mentee_id);

-- Add similarity search function
CREATE OR REPLACE FUNCTION get_mentor_recommendations(
  p_skills_needed TEXT[],
  p_experience_level TEXT,
  p_budget_min DECIMAL DEFAULT 0,
  p_budget_max DECIMAL DEFAULT 1000,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  mentor_id UUID,
  similarity_score FLOAT,
  match_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.mentor_id,
    (
      -- Skills match score (40% weight)
      (CASE 
        WHEN array_length(p_skills_needed, 1) > 0 THEN
          (SELECT COALESCE(AVG(
            CASE 
              WHEN ea.description ILIKE ANY (SELECT '%' || skill || '%' FROM unnest(p_skills_needed) AS skill) 
              THEN 1.0 
              ELSE 0.0 
            END
          ), 0.0)
          FROM mentor_expertise me
          JOIN expertise_areas ea ON me.area_id = ea.id
          WHERE me.mentor_id = m.mentor_id)
        ELSE 0.5
      END * 0.4) +
      
      -- Experience level match (30% weight)
      (CASE 
        WHEN p_experience_level = 'beginner' AND m.total_sessions_completed >= 10 THEN 1.0
        WHEN p_experience_level = 'intermediate' AND m.total_sessions_completed >= 50 THEN 1.0
        WHEN p_experience_level = 'advanced' AND m.total_sessions_completed >= 100 THEN 1.0
        ELSE 0.5
      END * 0.3) +
      
      -- Budget match (20% weight)
      (CASE 
        WHEN m.hourly_rate BETWEEN p_budget_min AND p_budget_max THEN 1.0
        WHEN m.hourly_rate <= p_budget_max * 1.2 THEN 0.8
        WHEN m.hourly_rate <= p_budget_max * 1.5 THEN 0.5
        ELSE 0.2
      END * 0.2) +
      
      -- Rating bonus (10% weight)
      (COALESCE(m.rating, 0) / 5.0 * 0.1)
    ) AS similarity_score,
    
    -- Generate match reason
    CASE 
      WHEN array_length(p_skills_needed, 1) > 0 THEN
        'Matches ' || array_length(p_skills_needed, 1) || ' of your required skills'
      ELSE 'Experienced mentor in your field'
    END AS match_reason
    
  FROM mentors m
  WHERE m.is_approved = true
    AND m.hourly_rate BETWEEN p_budget_min AND p_budget_max * 1.5
  ORDER BY similarity_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mentee_requirements_mentee_id ON public.mentee_requirements(mentee_id);
CREATE INDEX IF NOT EXISTS idx_mentors_approved_rating ON public.mentors(is_approved, rating DESC);
CREATE INDEX IF NOT EXISTS idx_mentors_hourly_rate ON public.mentors(hourly_rate);
CREATE INDEX IF NOT EXISTS idx_expertise_areas_description ON public.expertise_areas USING gin(description gin_trgm_ops); 