
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
    careerStage: 'student',
    goals: '',
    budgetRange: '0-50',
    preferredCommunication: 'chat'
  });

  useEffect(() => {
    loadExpertiseAreas();
    loadUserProfile();
  }, [user]);

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
      .maybeSingle();

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
        description: "Welcome to MentorHub"
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to MentorHub!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Let's get started by setting up your profile. Are you here to mentor others or to find a mentor?
            </p>
            
            <div className="space-y-3">
              <Button
                variant={userType === 'mentor' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => setUserType('mentor')}
              >
                I want to be a Mentor
              </Button>
              <Button
                variant={userType === 'mentee' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => setUserType('mentee')}
              >
                I'm looking for a Mentor
              </Button>
            </div>

            <Button 
              onClick={handleUserTypeSubmit} 
              disabled={!userType || loading}
              className="w-full"
            >
              {loading ? 'Setting up...' : 'Continue'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Profile Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={profileData.bio}
                onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
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

          <Button onClick={handleProfileSubmit} disabled={loading} className="w-full">
            {loading ? 'Creating Profile...' : 'Complete Setup'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
