import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, User, Briefcase, Target, ArrowRight, CheckCircle } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

interface ExpertiseArea {
  area_id: string;
  name: string;
  category: string;
}

export const ProfileSetup = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<'mentor' | 'mentee' | null>(null);
  const [loading, setLoading] = useState(false);
  const [expertiseAreas, setExpertiseAreas] = useState<ExpertiseArea[]>([]);
  
  // Profile data
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    phone: '',
    timezone: 'UTC'
  });

  // Mentor specific data
  const [mentorData, setMentorData] = useState({
    hourlyRate: '',
    experienceYears: '',
    githubUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
    selectedExpertise: [] as string[]
  });

  // Mentee specific data
  const [menteeData, setMenteeData] = useState({
    careerStage: '',
    goals: '',
    budgetRange: '',
    preferredCommunication: ''
  });

  useEffect(() => {
    loadExpertiseAreas();
    loadUserProfile();
  }, [user]);

  useEffect(() => {
    console.log('ExpertiseAreas:', expertiseAreas);
  }, [expertiseAreas]);

  const loadExpertiseAreas = async () => {
    const { data, error } = await supabase
      .from('expertise_areas')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (error) {
      toast({
        title: "Error loading expertise areas",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setExpertiseAreas(data || []);
    }
  };

  const loadUserProfile = async () => {
    if (!user) return;

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (userData && !userError) {
      setProfileData({
        firstName: userData.first_name || '',
        lastName: userData.last_name || '',
        bio: userData.bio || '',
        phone: userData.phone || '',
        timezone: userData.timezone || 'UTC'
      });
    }

    // Check if user has roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role_type')
      .eq('user_id', user.id);

    if (roles && roles.length > 0) {
      const role = roles[0].role_type;
      if (role === 'mentor' || role === 'mentee') {
        setUserType(role);
        setStep(2);
      }
    }
  };

  const handleUserTypeSubmit = async () => {
    if (!userType || !user) return;
    
    setLoading(true);
    try {
      // Insert user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role_type: userType });

      if (roleError) throw roleError;

      setStep(2);
    } catch (error: any) {
      toast({
        title: "Error setting user type",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update user profile
      const { error: profileError } = await supabase
        .from('users')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          bio: profileData.bio,
          phone: profileData.phone,
          timezone: profileData.timezone
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      if (userType === 'mentor') {
        // Create mentor profile
        const { error: mentorError } = await supabase
          .from('mentors')
          .insert({
            mentor_id: user.id,
            hourly_rate: parseFloat(mentorData.hourlyRate) || null,
            experience_years: parseInt(mentorData.experienceYears) || null,
            github_url: mentorData.githubUrl || null,
            linkedin_url: mentorData.linkedinUrl || null,
            portfolio_url: mentorData.portfolioUrl || null
          });

        if (mentorError) throw mentorError;

        // Add expertise areas
        if (mentorData.selectedExpertise.length > 0) {
          const expertiseInserts = mentorData.selectedExpertise.map(areaId => ({
            mentor_id: user.id,
            area_id: areaId,
            proficiency_level: 'intermediate' as const
          }));

          const { error: expertiseError } = await supabase
            .from('mentor_expertise')
            .insert(expertiseInserts);

          if (expertiseError) throw expertiseError;
        }
      } else if (userType === 'mentee') {
        // Create mentee profile
        const { error: menteeError } = await supabase
          .from('mentees')
          .insert({
            mentee_id: user.id,
            career_stage: menteeData.careerStage as any || null,
            goals: menteeData.goals || null,
            budget_range: menteeData.budgetRange || null,
            preferred_communication: menteeData.preferredCommunication as any || null
          });

        if (menteeError) throw menteeError;
      }

      toast({
        title: "Profile created successfully!",
        description: "Welcome to MentorSES"
      });

      // Refresh the page to load the dashboard
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error creating profile",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-white" />
            </div>
                          <div className="flex justify-center mb-4">
                <Logo size="lg" variant="gradient" />
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome!
              </CardTitle>
            <p className="text-gray-600 mt-2">
              Join our community of learners and mentors. Choose your path to get started.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Button
                variant={userType === 'mentor' ? 'default' : 'outline'}
                className={`w-full h-16 text-left justify-start ${
                  userType === 'mentor' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white' 
                    : 'hover:bg-blue-50 hover:border-blue-200'
                }`}
                onClick={() => setUserType('mentor')}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    userType === 'mentor' ? 'bg-white/20' : 'bg-blue-100'
                  }`}>
                    <Briefcase className={`h-6 w-6 ${userType === 'mentor' ? 'text-white' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <div className="font-semibold">I want to be a Mentor</div>
                    <div className={`text-sm ${userType === 'mentor' ? 'text-white/80' : 'text-gray-500'}`}>
                      Share your expertise and guide others
                    </div>
                  </div>
                </div>
              </Button>
              
              <Button
                variant={userType === 'mentee' ? 'default' : 'outline'}
                className={`w-full h-16 text-left justify-start ${
                  userType === 'mentee' 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white' 
                    : 'hover:bg-green-50 hover:border-green-200'
                }`}
                onClick={() => setUserType('mentee')}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    userType === 'mentee' ? 'bg-white/20' : 'bg-green-100'
                  }`}>
                    <Target className={`h-6 w-6 ${userType === 'mentee' ? 'text-white' : 'text-green-600'}`} />
                  </div>
                  <div>
                    <div className="font-semibold">I'm looking for a Mentor</div>
                    <div className={`text-sm ${userType === 'mentee' ? 'text-white/80' : 'text-gray-500'}`}>
                      Learn from experienced professionals
                    </div>
                  </div>
                </div>
              </Button>
            </div>

            <Button 
              onClick={handleUserTypeSubmit} 
              disabled={!userType || loading}
              className={`w-full h-12 ${
                !userType 
                  ? 'bg-gray-200 text-gray-400' 
                  : userType === 'mentor'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
              } text-white font-semibold`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Setting up...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </div>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Complete Your Profile
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Tell us about yourself to create the perfect {userType} experience
          </p>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Basic Profile Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Basic Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name *</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors"
                  placeholder="Enter your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name *</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors"
                  placeholder="Enter your last name"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium text-gray-700">Bio *</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself, your experience, and what you're passionate about..."
                value={profileData.bio}
                onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                className="min-h-32 border-2 border-gray-200 focus:border-blue-500 transition-colors resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors"
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          {/* Mentor specific fields */}
          {userType === 'mentor' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Mentor Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    value={mentorData.hourlyRate}
                    onChange={(e) => setMentorData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="experienceYears">Years of Experience</Label>
                  <Input
                    id="experienceYears"
                    type="number"
                    value={mentorData.experienceYears}
                    onChange={(e) => setMentorData(prev => ({ ...prev, experienceYears: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                <Input
                  id="linkedinUrl"
                  value={mentorData.linkedinUrl}
                  onChange={(e) => setMentorData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="githubUrl">GitHub URL (optional)</Label>
                <Input
                  id="githubUrl"
                  value={mentorData.githubUrl}
                  onChange={(e) => setMentorData(prev => ({ ...prev, githubUrl: e.target.value }))}
                />
              </div>
              <div>
                <Label>Expertise Areas</Label>
                {expertiseAreas.length === 0 ? (
                  <div className="text-sm text-red-500 mt-2">No expertise areas found. Please contact support or add some in the admin panel.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {expertiseAreas.map((area) => (
                      <div key={area.area_id} className="flex items-center space-x-2">
                        <Checkbox
                          id={area.area_id}
                          checked={mentorData.selectedExpertise.includes(area.area_id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setMentorData(prev => ({
                                ...prev,
                                selectedExpertise: [...prev.selectedExpertise, area.area_id]
                              }));
                            } else {
                              setMentorData(prev => ({
                                ...prev,
                                selectedExpertise: prev.selectedExpertise.filter(id => id !== area.area_id)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={area.area_id} className="text-sm">{area.name}</Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mentee specific fields */}
          {userType === 'mentee' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Mentee Information</h3>
              <div>
                <Label htmlFor="careerStage">Career Stage</Label>
                <Select value={menteeData.careerStage} onValueChange={(value) => setMenteeData(prev => ({ ...prev, careerStage: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your career stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="entry_level">Entry Level</SelectItem>
                    <SelectItem value="mid_level">Mid Level</SelectItem>
                    <SelectItem value="senior_level">Senior Level</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="goals">Goals</Label>
                <Textarea
                  id="goals"
                  placeholder="What do you hope to achieve through mentoring?"
                  value={menteeData.goals}
                  onChange={(e) => setMenteeData(prev => ({ ...prev, goals: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="budgetRange">Budget Range</Label>
                <Select value={menteeData.budgetRange} onValueChange={(value) => setMenteeData(prev => ({ ...prev, budgetRange: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-50">$0 - $50/hour</SelectItem>
                    <SelectItem value="50-100">$50 - $100/hour</SelectItem>
                    <SelectItem value="100-200">$100 - $200/hour</SelectItem>
                    <SelectItem value="200+">$200+/hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="preferredCommunication">Preferred Communication</Label>
                <Select value={menteeData.preferredCommunication} onValueChange={(value) => setMenteeData(prev => ({ ...prev, preferredCommunication: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="How do you prefer to communicate?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chat">Chat</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-gray-200">
            <Button 
              onClick={handleProfileSubmit} 
              disabled={loading || !profileData.firstName || !profileData.lastName || !profileData.bio} 
              className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg shadow-lg"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Creating Your Profile...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  Complete Setup
                  <CheckCircle className="h-5 w-5 ml-2" />
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
