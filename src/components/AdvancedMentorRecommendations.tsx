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
import { Brain, Target, DollarSign, Star, Users, Clock, Sparkles, TrendingUp, Zap, BarChart3 } from 'lucide-react';
import { MentorCard } from './MentorCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

interface AdvancedMentorRecommendation {
  mentor_id: string;
  similarity_score: number;
  match_reason: string;
  confidence_score: number;
  recommendation_type: string;
  mentor: {
    mentor_id: string;
    hourly_rate: number;
    rating: number;
    total_sessions_completed: number;
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

export const AdvancedMentorRecommendations = () => {
  const { user } = useAuth();
  const [requirements, setRequirements] = useState<MenteeRequirements>({
    skills_needed: [],
    experience_level: 'intermediate',
    goals: '',
    preferred_mentor_style: [],
    budget_range_min: 0,
    budget_range_max: 200
  });
  const [recommendations, setRecommendations] = useState<AdvancedMentorRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSkill, setCurrentSkill] = useState('');
  const [showRequirementsForm, setShowRequirementsForm] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

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
      getAdvancedRecommendations();
    } catch (error) {
      console.error('Error saving requirements:', error);
      toast({
        title: "Error",
        description: "Failed to save requirements. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getAdvancedRecommendations = async () => {
    setLoading(true);
    try {
      console.log('Getting advanced recommendations with requirements:', requirements);
      
      // First, sync data to BigQuery
      const { error: syncError } = await supabase
        .rpc('sync_data_to_bigquery');

      if (syncError) {
        console.warn('BigQuery sync warning:', syncError);
        // Continue with local recommendations if BigQuery is not available
      }

      // Get advanced recommendations
      const { data, error } = await supabase
        .rpc('get_advanced_mentor_recommendations', {
          p_mentee_id: user?.id,
          p_skills_needed: requirements.skills_needed,
          p_experience_level: requirements.experience_level,
          p_budget_min: requirements.budget_range_min,
          p_budget_max: requirements.budget_range_max,
          p_limit: 10
        });

      console.log('Advanced recommendation result:', { data, error });

      if (error) {
        console.warn('Advanced recommendations failed, falling back to basic:', error);
        // Fallback to basic recommendations
        const { data: basicData, error: basicError } = await supabase
          .rpc('get_mentor_recommendations', {
            p_skills_needed: requirements.skills_needed,
            p_experience_level: requirements.experience_level,
            p_budget_min: requirements.budget_range_min,
            p_budget_max: requirements.budget_range_max,
            p_limit: 10
          });

        if (basicError) throw basicError;
        
        // Transform basic data to advanced format
        const transformedData = basicData?.map(rec => ({
          ...rec,
          confidence_score: 0.75,
          recommendation_type: 'Content-Based (Fallback)'
        })) || [];

        await loadMentorData(transformedData);
        return;
      }

      await loadMentorData(data || []);
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

  const loadMentorData = async (recommendationData: any[]) => {
    if (recommendationData.length === 0) {
      setRecommendations([]);
      return;
    }

    const mentorIds = recommendationData.map(r => r.mentor_id);
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
    const fullRecommendations = recommendationData.map(rec => {
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

    console.log('Final advanced recommendations:', fullRecommendations);
    setRecommendations(fullRecommendations);
  };

  const handleBookSession = (mentorId: string) => {
    console.log('Book session for mentor:', mentorId);
  };

  const getRecommendationTypeIcon = (type: string) => {
    switch (type) {
      case 'Hybrid (Content + Collaborative)':
        return <Brain className="h-4 w-4" />;
      case 'Content-Based':
        return <Target className="h-4 w-4" />;
      case 'Collaborative':
        return <Users className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getRecommendationTypeColor = (type: string) => {
    switch (type) {
      case 'Hybrid (Content + Collaborative)':
        return 'bg-gradient-to-r from-purple-500 to-blue-500';
      case 'Content-Based':
        return 'bg-gradient-to-r from-green-500 to-teal-500';
      case 'Collaborative':
        return 'bg-gradient-to-r from-orange-500 to-red-500';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  if (showRequirementsForm) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-2 border-brand-sunshine-yellow/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-brand-sunshine-yellow" />
              AI-Powered Mentor Matching
            </CardTitle>
            <p className="text-gray-600">
              Our advanced ML algorithm analyzes thousands of successful mentor-mentee relationships to find your perfect match
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
              <Zap className="h-4 w-4 mr-2" />
              Get AI-Powered Recommendations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI-Powered Mentor Recommendations</h1>
        <p className="text-gray-600">
          Based on ML analysis of successful mentor-mentee relationships
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
            <Card key={recommendation.mentor_id} className="relative border-2 border-brand-sunshine-yellow/20">
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Badge className={`${getRecommendationTypeColor(recommendation.recommendation_type)} text-white`}>
                  {getRecommendationTypeIcon(recommendation.recommendation_type)}
                  <span className="ml-1">{recommendation.recommendation_type}</span>
                </Badge>
                <Badge className="bg-brand-sunshine-yellow text-brand-charcoal">
                  <Star className="h-3 w-3 mr-1" />
                  {Math.round(recommendation.similarity_score * 100)}% Match
                </Badge>
                <Badge variant="outline" className="border-green-500 text-green-600">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  {Math.round(recommendation.confidence_score * 100)}% Confidence
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
            <p className="text-gray-600 font-medium mb-2">No AI recommendations found</p>
            <p className="text-sm text-gray-500 mb-4">
              Try adjusting your requirements or expanding your budget range
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => setShowRequirementsForm(true)}
                className="bg-black hover:bg-gray-800 text-white"
              >
                Update Requirements
              </Button>
              <Button
                onClick={() => getAdvancedRecommendations()}
                variant="outline"
                className="border-black text-black hover:bg-gray-100"
              >
                <Zap className="h-4 w-4 mr-2" />
                Retry AI Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 