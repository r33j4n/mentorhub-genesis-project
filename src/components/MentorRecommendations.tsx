import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Brain, Target, DollarSign, Star, Users, Clock, Sparkles } from 'lucide-react';
import { MentorCard } from './MentorCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

interface MentorRecommendation {
  mentor_id: string;
  similarity_score: number;
  match_reason: string;
  mentor: {
    mentor_id: string;
    hourly_rate: number;
    rating: number;
    total_sessions: number;
    is_approved: boolean;
    users: {
      first_name: string;
      last_name: string;
      profile_image: string;
    };
    mentor_expertise: Array<{
      expertise_areas: {
        name: string;
        description: string;
      };
    }>;
  };
}

interface MenteeRequirements {
  skills_needed: string[];
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  goals: string;
  preferred_mentor_style: string[];
  budget_range_min: number;
  budget_range_max: number;
}

export const MentorRecommendations = () => {
  const { user } = useAuth();
  const [requirements, setRequirements] = useState<MenteeRequirements>({
    skills_needed: [],
    experience_level: 'intermediate',
    goals: '',
    preferred_mentor_style: [],
    budget_range_min: 0,
    budget_range_max: 200
  });
  const [recommendations, setRecommendations] = useState<MentorRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSkill, setCurrentSkill] = useState('');
  const [showRequirementsForm, setShowRequirementsForm] = useState(true);

  // Load recommendations when component mounts
  useEffect(() => {
    if (!showRequirementsForm) {
      getRecommendations();
    }
  }, [showRequirementsForm]);

  const mentorStyles = [
    'Hands-on coding', 'Theory-focused', 'Project-based', 'Interview prep',
    'Career guidance', 'Code review', 'Pair programming', 'Structured learning'
  ];

  const addSkill = () => {
    if (currentSkill.trim() && !requirements.skills_needed.includes(currentSkill.trim())) {
      setRequirements(prev => ({
        ...prev,
        skills_needed: [...prev.skills_needed, currentSkill.trim()]
      }));
      setCurrentSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setRequirements(prev => ({
      ...prev,
      skills_needed: prev.skills_needed.filter(s => s !== skill)
    }));
  };

  const toggleMentorStyle = (style: string) => {
    setRequirements(prev => ({
      ...prev,
      preferred_mentor_style: prev.preferred_mentor_style.includes(style)
        ? prev.preferred_mentor_style.filter(s => s !== style)
        : [...prev.preferred_mentor_style, style]
    }));
  };

  const saveRequirements = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('mentee_requirements')
        .upsert({
          mentee_id: user.id,
          ...requirements
        });

      if (error) throw error;

      toast({
        title: "Requirements saved!",
        description: "Your learning requirements have been saved successfully.",
      });

      setShowRequirementsForm(false);
      getRecommendations();
    } catch (error) {
      console.error('Error saving requirements:', error);
      toast({
        title: "Error",
        description: "Failed to save requirements. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getRecommendations = async () => {
    setLoading(true);
    try {
      console.log('Getting recommendations with requirements:', requirements);
      
      const { data, error } = await supabase
        .rpc('get_mentor_recommendations', {
          p_skills_needed: requirements.skills_needed,
          p_experience_level: requirements.experience_level,
          p_budget_min: requirements.budget_range_min,
          p_budget_max: requirements.budget_range_max,
          p_limit: 10
        });

      console.log('Recommendation function result:', { data, error });

      if (error) throw error;

      // Get full mentor data for recommendations
      if (data && data.length > 0) {
        const mentorIds = data.map(r => r.mentor_id);
        console.log('Mentor IDs to fetch:', mentorIds);
        
        const { data: mentorsData, error: mentorsError } = await supabase
          .from('mentors')
          .select(`
            *,
            users (
              first_name,
              last_name,
              profile_image
            ),
            mentor_expertise (
              expertise_areas (
                name,
                description
              )
            )
          `)
          .in('mentor_id', mentorIds);

        console.log('Mentors data result:', { mentorsData, mentorsError });

        if (mentorsError) throw mentorsError;

        // Combine recommendations with mentor data and fix data structure
        const fullRecommendations = data.map(rec => {
          const mentor = mentorsData?.find(m => m.mentor_id === rec.mentor_id);
          if (mentor) {
            // Fix the mentor data structure to match MentorCard expectations
            const fixedMentor = {
              ...mentor,
              total_sessions_completed: mentor.total_sessions || mentor.total_sessions_completed || 0,
              total_sessions: mentor.total_sessions || mentor.total_sessions_completed || 0
            };
            return {
              ...rec,
              mentor: fixedMentor
            };
          }
          return null;
        }).filter(rec => rec !== null);

        console.log('Final recommendations:', fullRecommendations);
        setRecommendations(fullRecommendations);
      } else {
        console.log('No recommendations returned from function');
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to get mentor recommendations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = (mentorId: string) => {
    // Navigate to booking page or open booking modal
    console.log('Book session for mentor:', mentorId);
  };

  if (showRequirementsForm) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-brand-sunshine-yellow" />
              Tell us about your learning goals
            </CardTitle>
            <p className="text-gray-600">
              Help us find the perfect mentor for your needs
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Skills Needed */}
            <div className="space-y-2">
              <Label>What skills do you want to learn?</Label>
              <div className="flex gap-2">
                <Input
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  placeholder="e.g., React, TypeScript, Node.js"
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                />
                <Button onClick={addSkill} className="bg-black hover:bg-gray-800">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {requirements.skills_needed.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="bg-brand-sunshine-yellow/20 text-brand-charcoal">
                    {skill}
                    <button
                      onClick={() => removeSkill(skill)}
                      className="ml-1 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Experience Level */}
            <div className="space-y-2">
              <Label>Your current experience level</Label>
              <Select
                value={requirements.experience_level}
                onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') =>
                  setRequirements(prev => ({ ...prev, experience_level: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner (0-1 years)</SelectItem>
                  <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                  <SelectItem value="advanced">Advanced (3+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Goals */}
            <div className="space-y-2">
              <Label>What are your learning goals?</Label>
              <Textarea
                value={requirements.goals}
                onChange={(e) => setRequirements(prev => ({ ...prev, goals: e.target.value }))}
                placeholder="e.g., Build a full-stack web application, Prepare for technical interviews, Learn advanced React patterns"
                rows={3}
              />
            </div>

            {/* Mentor Style Preferences */}
            <div className="space-y-2">
              <Label>Preferred mentor style</Label>
              <div className="grid grid-cols-2 gap-2">
                {mentorStyles.map((style) => (
                  <div key={style} className="flex items-center space-x-2">
                    <Checkbox
                      id={style}
                      checked={requirements.preferred_mentor_style.includes(style)}
                      onCheckedChange={() => toggleMentorStyle(style)}
                    />
                    <Label htmlFor={style} className="text-sm">{style}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget Range */}
            <div className="space-y-2">
              <Label>Budget range per hour (USD)</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label className="text-xs">Min: ${requirements.budget_range_min}</Label>
                  <Slider
                    value={[requirements.budget_range_min]}
                    onValueChange={([value]) => setRequirements(prev => ({ ...prev, budget_range_min: value }))}
                    max={500}
                    step={10}
                    className="mt-2"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs">Max: ${requirements.budget_range_max}</Label>
                  <Slider
                    value={[requirements.budget_range_max]}
                    onValueChange={([value]) => setRequirements(prev => ({ ...prev, budget_range_max: value }))}
                    max={500}
                    step={10}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={saveRequirements}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Get Personalized Recommendations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Recommended Mentors</h1>
        <p className="text-gray-600">
          Based on your requirements, here are the best mentors for you
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-80 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : recommendations.length > 0 ? (
        <div className="space-y-6">
          {recommendations.map((recommendation, index) => (
            <Card key={recommendation.mentor_id} className="relative">
              <div className="absolute top-4 right-4 z-10">
                <Badge className="bg-brand-sunshine-yellow text-brand-charcoal">
                  <Star className="h-3 w-3 mr-1" />
                  {Math.round(recommendation.similarity_score * 100)}% Match
                </Badge>
              </div>
              <CardContent className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    {recommendation.match_reason}
                  </p>
                </div>
                <MentorCard
                  mentor={recommendation.mentor}
                  onBookSession={handleBookSession}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium mb-2">No recommendations found</p>
            <p className="text-sm text-gray-500 mb-4">
              Try adjusting your requirements or expanding your budget range
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowRequirementsForm(true)}
                className="bg-black hover:bg-gray-800 text-white"
              >
                Update Requirements
              </Button>
              <Button
                onClick={() => getRecommendations()}
                variant="outline"
                className="border-black text-black hover:bg-gray-100"
              >
                Test Recommendations
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 