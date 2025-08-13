import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { X, Upload, Save, Clock, Calendar, Plus, Trash2, Star, Heart, HeartOff, Users } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface UserProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  bio: string;
  profile_image: string;
}

interface Availability {
  day_of_week: number;
  is_available: boolean;
  start_time: string;
  end_time: string;
  timezone: string;
  mentor_id?: string;
}

interface ExpertiseArea {
  area_id: string;
  name: string;
  category: string | null;
  description: string | null;
}

interface MentorExpertise {
  area_id: string;
  mentor_id: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_experience: number | null;
  area_name?: string; // For display purposes
}

interface FollowedMentor {
  id: string;
  mentor_id: string;
  created_at: string;
  mentor: {
    users: {
      first_name: string;
      last_name: string;
      profile_image: string;
      bio: string;
    };
  };
}

interface UserProfileModalProps {
  userType: 'mentor' | 'mentee';
  onClose: () => void;
  onProfileUpdated?: () => void;
}

const DAYS_OF_WEEK = [
  { name: 'Monday', value: 1 },
  { name: 'Tuesday', value: 2 },
  { name: 'Wednesday', value: 3 },
  { name: 'Thursday', value: 4 },
  { name: 'Friday', value: 5 },
  { name: 'Saturday', value: 6 },
  { name: 'Sunday', value: 0 }
];

const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
];

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
  'Australia/Sydney', 'Pacific/Auckland'
];

const PROFICIENCY_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: 'bg-blue-100 text-blue-800' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'advanced', label: 'Advanced', color: 'bg-orange-100 text-orange-800' },
  { value: 'expert', label: 'Expert', color: 'bg-green-100 text-green-800' }
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  userType,
  onClose,
  onProfileUpdated
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [expertiseAreas, setExpertiseAreas] = useState<ExpertiseArea[]>([]);
  const [mentorExpertise, setMentorExpertise] = useState<MentorExpertise[]>([]);
  const [showAddExpertise, setShowAddExpertise] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedProficiency, setSelectedProficiency] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');
  const [yearsExperience, setYearsExperience] = useState<number>(1);
  const [customExpertise, setCustomExpertise] = useState<string>('');
  const [showCustomExpertise, setShowCustomExpertise] = useState(false);
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const [followedMentors, setFollowedMentors] = useState<FollowedMentor[]>([]);

  useEffect(() => {
    loadProfile();
    if (userType === 'mentor') {
      loadAvailability();
      loadExpertiseAreas();
      loadMentorExpertise();
    } else if (userType === 'mentee') {
      loadFollowedMentors();
    }
  }, [userType]);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Loading availability for user:', user.id);

      const { data, error } = await supabase
        .from('mentor_availability')
        .select('*')
        .eq('mentor_id', user.id);

      if (error) throw error;

      console.log('Availability data from DB:', data);

      if (data && data.length > 0) {
        setAvailability(data);
      } else {
        // Initialize with default availability
        const defaultAvailability = DAYS_OF_WEEK.map(day => ({
          day_of_week: day.value,
          is_available: false,
          start_time: '09:00',
          end_time: '17:00',
          timezone: 'UTC',
          mentor_id: user.id
        }));
        console.log('Setting default availability:', defaultAvailability);
        setAvailability(defaultAvailability);
      }
    } catch (error: any) {
      console.error('Error loading availability:', error);
    }
  };

  const loadExpertiseAreas = async () => {
    try {
      const { data, error } = await supabase
        .from('expertise_areas')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setExpertiseAreas(data || []);
    } catch (error: any) {
      console.error('Error loading expertise areas:', error);
    }
  };

  const loadMentorExpertise = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('mentor_expertise')
        .select(`
          *,
          expertise_areas:area_id (
            name,
            category,
            description
          )
        `)
        .eq('mentor_id', user.id);

      if (error) throw error;

      const expertiseWithNames = (data || []).map(item => ({
        ...item,
        area_name: item.expertise_areas?.name
      }));

      setMentorExpertise(expertiseWithNames);
    } catch (error: any) {
      console.error('Error loading mentor expertise:', error);
    }
  };

  const loadFollowedMentors = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('mentor_follows')
        .select(`
          *,
          mentor:mentor_id (
            users (
              first_name,
              last_name,
              profile_image
            )
          )
        `)
        .eq('mentee_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFollowedMentors(data || []);
    } catch (error: any) {
      console.error('Error loading followed mentors:', error);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Try to upload to avatars bucket first
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (error) {
        // If bucket doesn't exist, store as base64 in database
        const reader = new FileReader();
        return new Promise((resolve) => {
          reader.onload = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const saveAvailability = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete existing availability
      await supabase
        .from('mentor_availability')
        .delete()
        .eq('mentor_id', user.id);

      // Insert new availability
      const availabilityToSave = availability
        .filter(av => av.is_available)
        .map(av => ({
          mentor_id: user.id,
          day_of_week: av.day_of_week,
          is_available: av.is_available,
          start_time: av.start_time,
          end_time: av.end_time,
          timezone: av.timezone
        }));

      if (availabilityToSave.length > 0) {
        const { error } = await supabase
          .from('mentor_availability')
          .insert(availabilityToSave);

        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Error saving availability:', error);
      throw error;
    }
  };

  const saveMentorExpertise = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete existing expertise
      await supabase
        .from('mentor_expertise')
        .delete()
        .eq('mentor_id', user.id);

      // Insert new expertise
      if (mentorExpertise.length > 0) {
        const expertiseToSave = mentorExpertise.map(expertise => ({
          mentor_id: user.id,
          area_id: expertise.area_id,
          proficiency_level: expertise.proficiency_level,
          years_experience: expertise.years_experience
        }));

        const { error } = await supabase
          .from('mentor_expertise')
          .insert(expertiseToSave);

        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Error saving mentor expertise:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      let imageUrl = profile.profile_image;

      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const { error } = await supabase
        .from('users')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          bio: profile.bio,
          profile_image: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      // Save availability and expertise for mentors
      if (userType === 'mentor') {
        await saveAvailability();
        await saveMentorExpertise();
      }

      toast({
        title: "Profile updated successfully",
        description: "Your profile has been saved."
      });

      onProfileUpdated?.();
      onClose();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateAvailability = (day: number, field: keyof Availability, value: any) => {
    console.log('Updating availability:', { day, field, value });
    setAvailability(prev => {
      const updated = prev.map(av => 
        av.day_of_week === day 
          ? { ...av, [field]: value }
          : av
      );
      console.log('Updated availability:', updated);
      return updated;
    });
  };

  const addExpertise = () => {
    if (!selectedArea) return;

    const area = expertiseAreas.find(a => a.area_id === selectedArea);
    if (!area) return;

    const newExpertise: MentorExpertise = {
      area_id: selectedArea,
      mentor_id: profile?.user_id || '',
      proficiency_level: selectedProficiency,
      years_experience: yearsExperience,
      area_name: area.name
    };

    setMentorExpertise(prev => [...prev, newExpertise]);
    setSelectedArea('');
    setSelectedProficiency('intermediate');
    setYearsExperience(1);
    setShowAddExpertise(false);
  };

  const addCustomExpertise = () => {
    if (!customExpertise.trim()) return;

    const newExpertise: MentorExpertise = {
      area_id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      mentor_id: profile?.user_id || '',
      proficiency_level: selectedProficiency,
      years_experience: yearsExperience,
      area_name: customExpertise.trim()
    };

    setMentorExpertise(prev => [...prev, newExpertise]);
    setCustomExpertise('');
    setSelectedProficiency('intermediate');
    setYearsExperience(1);
    setShowCustomExpertise(false);
  };

  const removeExpertise = (areaId: string) => {
    setMentorExpertise(prev => prev.filter(exp => exp.area_id !== areaId));
  };

  const updateExpertise = (areaId: string, field: keyof MentorExpertise, value: any) => {
    setMentorExpertise(prev => 
      prev.map(exp => 
        exp.area_id === areaId 
          ? { ...exp, [field]: value }
          : exp
      )
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
              <span>Loading profile...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl">
            Edit {userType === 'mentor' ? 'Mentor' : 'Mentee'} Profile
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Image */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={imagePreview || profile?.profile_image} />
              <AvatarFallback className="text-2xl">
                {profile?.first_name?.[0]}{profile?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center space-x-2">
              <Label htmlFor="image-upload" className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </span>
                </Button>
              </Label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name</Label>
              <Input
                id="first-name"
                value={profile?.first_name || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, first_name: e.target.value } : null)}
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Last Name</Label>
              <Input
                id="last-name"
                value={profile?.last_name || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, last_name: e.target.value } : null)}
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profile?.bio || ''}
              onChange={(e) => setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
              placeholder={`Tell us about yourself as a ${userType}...`}
              rows={4}
            />
          </div>

          {/* Followed Mentors Section for Mentees */}
          {userType === 'mentee' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Followed Mentors</h3>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  {followedMentors.length}
                </Badge>
              </div>

              {followedMentors.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">You haven't followed any mentors yet</p>
                  <p className="text-sm text-gray-500">Follow mentors to see their public seminars and get notified of new content</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {followedMentors.map((followedMentor) => (
                    <div key={followedMentor.id} className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={followedMentor.mentor.users.profile_image} />
                        <AvatarFallback className="text-sm">
                          {followedMentor.mentor.users.first_name?.[0]}{followedMentor.mentor.users.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {followedMentor.mentor.users.first_name} {followedMentor.mentor.users.last_name}
                          </h4>
                          <Heart className="h-4 w-4 text-red-500" />
                        </div>
                        {followedMentor.mentor.users.bio && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {followedMentor.mentor.users.bio}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Following since {new Date(followedMentor.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (!user) {
                              toast({
                                title: "Error",
                                description: "You must be logged in to unfollow mentors",
                                variant: "destructive"
                              });
                              return;
                            }

                            console.log('Unfollowing mentor:', followedMentor.mentor_id);
                            console.log('Current user ID:', user.id);

                            const { error } = await supabase
                              .from('mentor_follows')
                              .delete()
                              .eq('mentor_id', followedMentor.mentor_id)
                              .eq('mentee_id', user.id);

                            console.log('Unfollow result:', { error });

                            if (error) {
                              throw error;
                            }

                            // Update local state
                            setFollowedMentors(prev => prev.filter(fm => fm.id !== followedMentor.id));
                            
                            toast({
                              title: "Unfollowed",
                              description: `You've unfollowed ${followedMentor.mentor.users.first_name} ${followedMentor.mentor.users.last_name}`,
                            });
                          } catch (error: any) {
                            console.error('Error unfollowing mentor:', error);
                            toast({
                              title: "Error",
                              description: `Failed to unfollow mentor: ${error.message}`,
                              variant: "destructive"
                            });
                          }
                        }}
                        className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                      >
                        <HeartOff className="h-4 w-4 mr-2" />
                        Unfollow
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Expertise Areas Section for Mentors */}
          {userType === 'mentor' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Expertise Areas</h3>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => setShowCustomExpertise(true)}
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => setShowAddExpertise(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expertise
                  </Button>
                </div>
              </div>

              {/* Current Expertise Areas */}
              {mentorExpertise.length > 0 && (
                <div className="space-y-3">
                  {mentorExpertise.map((expertise) => (
                    <div key={expertise.area_id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-900">{expertise.area_name}</h4>
                          <Badge className={PROFICIENCY_LEVELS.find(p => p.value === expertise.proficiency_level)?.color}>
                            {PROFICIENCY_LEVELS.find(p => p.value === expertise.proficiency_level)?.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{expertise.years_experience} years experience</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={expertise.proficiency_level}
                          onValueChange={(value: any) => updateExpertise(expertise.area_id, 'proficiency_level', value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PROFICIENCY_LEVELS.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          value={expertise.years_experience || 1}
                          onChange={(e) => updateExpertise(expertise.area_id, 'years_experience', parseInt(e.target.value) || 1)}
                          className="w-20"
                          min="1"
                          max="50"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeExpertise(expertise.area_id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Expertise Modal */}
              {showAddExpertise && (
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h4 className="font-medium text-gray-900 mb-3">Add New Expertise</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label>Expertise Area</Label>
                      <Select value={selectedArea} onValueChange={setSelectedArea}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select expertise area" />
                        </SelectTrigger>
                        <SelectContent>
                          {expertiseAreas
                            .filter(area => !mentorExpertise.find(exp => exp.area_id === area.area_id))
                            .map((area) => (
                              <SelectItem key={area.area_id} value={area.area_id}>
                                {area.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Proficiency Level</Label>
                      <Select value={selectedProficiency} onValueChange={(value: any) => setSelectedProficiency(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROFICIENCY_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Years of Experience</Label>
                      <Input
                        type="number"
                        value={yearsExperience}
                        onChange={(e) => setYearsExperience(parseInt(e.target.value) || 1)}
                        min="1"
                        max="50"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setShowAddExpertise(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addExpertise} disabled={!selectedArea}>
                      Add Expertise
                    </Button>
                  </div>
                </div>
              )}

              {/* Add Custom Expertise Modal */}
              {showCustomExpertise && (
                <div className="border rounded-lg p-4 bg-green-50">
                  <h4 className="font-medium text-gray-900 mb-3">Add Custom Expertise</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label>Custom Expertise Area</Label>
                      <Input
                        value={customExpertise}
                        onChange={(e) => setCustomExpertise(e.target.value)}
                        placeholder="Enter your custom expertise area"
                      />
                    </div>
                    <div>
                      <Label>Proficiency Level</Label>
                      <Select value={selectedProficiency} onValueChange={(value: any) => setSelectedProficiency(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROFICIENCY_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Years of Experience</Label>
                      <Input
                        type="number"
                        value={yearsExperience}
                        onChange={(e) => setYearsExperience(parseInt(e.target.value) || 1)}
                        min="1"
                        max="50"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setShowCustomExpertise(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addCustomExpertise} disabled={!customExpertise.trim()}>
                      Add Custom Expertise
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Availability Section for Mentors */}
          {userType === 'mentor' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Availability Settings</h3>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditingAvailability ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingAvailability(true)}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Edit Availability
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Timezone:</span>
                      <Select
                        value={availability[0]?.timezone || 'UTC'}
                        onValueChange={(value) => {
                          setAvailability(prev => prev.map(av => ({ ...av, timezone: value })));
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Quick Actions - Only show when editing */}
              {isEditingAvailability && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAvailability(prev => prev.map(av => ({ ...av, is_available: true })));
                    }}
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    Set All Available
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAvailability(prev => prev.map(av => ({ ...av, is_available: false })));
                    }}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    Set All Unavailable
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAvailability(prev => prev.map(av => ({ 
                        ...av, 
                        is_available: [1, 2, 3, 4, 5].includes(av.day_of_week),
                        start_time: '09:00',
                        end_time: '17:00'
                      })));
                    }}
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    Weekdays Only
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAvailability(prev => prev.map(av => ({ 
                        ...av, 
                        is_available: [6, 0].includes(av.day_of_week),
                        start_time: '10:00',
                        end_time: '18:00'
                      })));
                    }}
                    className="text-purple-600 border-purple-600 hover:bg-purple-50"
                  >
                    Weekends Only
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAvailability(prev => prev.map(av => ({ 
                        ...av, 
                        is_available: true,
                        start_time: '18:00',
                        end_time: '22:00'
                      })));
                    }}
                    className="text-orange-600 border-orange-600 hover:bg-orange-50"
                  >
                    Evenings Only
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAvailability(prev => prev.map(av => ({ 
                        ...av, 
                        is_available: true,
                        start_time: '06:00',
                        end_time: '12:00'
                      })));
                    }}
                    className="text-teal-600 border-teal-600 hover:bg-teal-50"
                  >
                    Mornings Only
                  </Button>
                </div>
              )}
              
              <div className="space-y-3">
                {DAYS_OF_WEEK.map((day) => {
                  const dayAvailability = availability.find(av => av.day_of_week === day.value);
                  return (
                    <div key={day.value} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        {isEditingAvailability ? (
                          <Switch
                            checked={dayAvailability?.is_available || false}
                            onCheckedChange={(checked) => {
                              console.log('Switch clicked for day:', day.name, 'value:', checked);
                              updateAvailability(day.value, 'is_available', checked);
                            }}
                          />
                        ) : (
                          <div className={`w-4 h-4 rounded-full ${dayAvailability?.is_available ? 'bg-green-500' : 'bg-gray-300'}`} />
                        )}
                        <span className="font-medium min-w-[100px] text-gray-700">{day.name}</span>
                      </div>
                      
                      {dayAvailability?.is_available && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-gray-600">Available:</span>
                            {isEditingAvailability ? (
                              <>
                                <Select
                                  value={dayAvailability.start_time}
                                  onValueChange={(value) => 
                                    updateAvailability(day.value, 'start_time', value)
                                  }
                                >
                                  <SelectTrigger className="w-28">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {TIME_SLOTS.map((time) => (
                                      <SelectItem key={time} value={time}>
                                        {time}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <span className="text-gray-500 text-sm">to</span>
                                <Select
                                  value={dayAvailability.end_time}
                                  onValueChange={(value) => 
                                    updateAvailability(day.value, 'end_time', value)
                                  }
                                >
                                  <SelectTrigger className="w-28">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {TIME_SLOTS.map((time) => (
                                      <SelectItem key={time} value={time}>
                                        {time}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </>
                            ) : (
                              <span className="text-sm font-medium text-gray-800">
                                {dayAvailability.start_time} - {dayAvailability.end_time}
                              </span>
                            )}
                          </div>
                          {isEditingAvailability && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const currentSettings = dayAvailability;
                                setAvailability(prev => prev.map(av => ({
                                  ...av,
                                  is_available: currentSettings.is_available,
                                  start_time: currentSettings.start_time,
                                  end_time: currentSettings.end_time
                                })));
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800"
                              title="Copy this schedule to all days"
                            >
                              Copy to All
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Availability Summary */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Availability Summary</h4>
                <div className="text-sm text-blue-800">
                  {(() => {
                    const availableDays = availability.filter(av => av.is_available);
                    const unavailableDays = availability.filter(av => !av.is_available);
                    
                    if (availableDays.length === 0) {
                      return "No days available for sessions";
                    } else if (availableDays.length === 7) {
                      return "Available all week";
                    } else if (availableDays.length === 5 && unavailableDays.every(av => [0, 6].includes(av.day_of_week))) {
                      return "Available weekdays only";
                    } else if (availableDays.length === 2 && availableDays.every(av => [0, 6].includes(av.day_of_week))) {
                      return "Available weekends only";
                    } else {
                      const dayNames = availableDays.map(av => {
                        const day = DAYS_OF_WEEK.find(d => d.value === av.day_of_week);
                        return day?.name;
                      }).filter(Boolean);
                      return `Available: ${dayNames.join(', ')}`;
                    }
                  })()}
                </div>
                {isEditingAvailability && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingAvailability(false)}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      Done Editing
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 