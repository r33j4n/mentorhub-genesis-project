import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, Users, DollarSign, BookOpen, Plus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CreateSeminarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSeminarCreated: () => void;
}

interface SeminarFormData {
  title: string;
  description: string;
  seminar_date: string;
  seminar_time: string;
  duration_minutes: number;
  max_participants: number | null;
  is_free: boolean;
  price: number;
  zoom_meeting_id: string;
  zoom_password: string;
  speaker_name: string;
  speaker_title: string;
  speaker_bio: string;
  speaker_image: string;
  company_name: string;
  company_logo: string;
  company_website: string;
  is_company_sponsored: boolean;
}

export const CreateSeminarModal: React.FC<CreateSeminarModalProps> = ({
  isOpen,
  onClose,
  onSeminarCreated
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<SeminarFormData>({
    title: '',
    description: '',
    seminar_date: '',
    seminar_time: '',
    duration_minutes: 60,
    max_participants: null,
    is_free: true,
    price: 0,
    zoom_meeting_id: '',
    zoom_password: '',
    speaker_name: '',
    speaker_title: '',
    speaker_bio: '',
    speaker_image: '',
    company_name: '',
    company_logo: '',
    company_website: '',
    is_company_sponsored: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof SeminarFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a seminar",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a seminar title",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a seminar description",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.seminar_date) {
      toast({
        title: "Validation Error",
        description: "Please select a seminar date",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.seminar_time) {
      toast({
        title: "Validation Error",
        description: "Please select a seminar time",
        variant: "destructive"
      });
      return false;
    }

    const selectedDateTime = new Date(`${formData.seminar_date}T${formData.seminar_time}`);
    const now = new Date();
    
    if (selectedDateTime <= now) {
      toast({
        title: "Validation Error",
        description: "Seminar date and time must be in the future",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.is_free && formData.price <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid price for paid seminars",
        variant: "destructive"
      });
      return false;
    }

    if (formData.max_participants !== null && formData.max_participants <= 0) {
      toast({
        title: "Validation Error",
        description: "Maximum participants must be greater than 0",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if user is a mentor
      console.log('Checking mentor status for user:', user?.id);
      
      // First check if user has mentor role
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id);

      console.log('User roles check:', { userRoles, rolesError });

      if (rolesError) {
        console.error('Roles check error:', rolesError);
        throw new Error('Failed to verify user roles. Please try again.');
      }

      const isMentor = userRoles?.some(role => role.role === 'mentor');
      console.log('Is mentor based on roles:', isMentor);

      if (!isMentor) {
        throw new Error('You must be a registered mentor to create seminars. Please complete your mentor profile setup first.');
      }

      // Then check if mentor profile exists
      const { data: mentorData, error: mentorError } = await supabase
        .from('mentors')
        .select('mentor_id')
        .eq('mentor_id', user?.id)
        .single();

      console.log('Mentor profile check result:', { mentorData, mentorError });

      if (mentorError) {
        console.error('Mentor profile check error:', mentorError);
        if (mentorError.code === 'PGRST116') {
          throw new Error('Mentor profile not found. Please complete your mentor profile setup first.');
        } else {
          throw new Error(`Mentor verification failed: ${mentorError.message}`);
        }
      }

      if (!mentorData) {
        throw new Error('Mentor profile not found. Please complete your mentor profile setup first.');
      }

      const selectedDateTime = new Date(`${formData.seminar_date}T${formData.seminar_time}`);
      
      console.log('Creating seminar with user:', user?.id);
      console.log('Form data:', formData);
      
      const { data, error } = await supabase
        .from('public_seminars')
        .insert({
          mentor_id: user?.id, // Add the mentor_id explicitly
          title: formData.title.trim(),
          description: formData.description.trim(),
          seminar_date: selectedDateTime.toISOString(),
          duration_minutes: formData.duration_minutes,
          max_participants: formData.max_participants,
          is_free: formData.is_free,
          price: formData.is_free ? 0 : formData.price,
          zoom_meeting_id: formData.zoom_meeting_id.trim() || null,
          zoom_password: formData.zoom_password.trim() || null,
          speaker_name: formData.speaker_name.trim() || null,
          speaker_title: formData.speaker_title.trim() || null,
          speaker_bio: formData.speaker_bio.trim() || null,
          speaker_image: formData.speaker_image.trim() || null,
          company_name: formData.company_name.trim() || null,
          company_logo: formData.company_logo.trim() || null,
          company_website: formData.company_website.trim() || null,
          is_company_sponsored: formData.is_company_sponsored
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Seminar Created!",
        description: `"${formData.title}" has been posted successfully. Your followers will be notified!`,
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        seminar_date: '',
        seminar_time: '',
        duration_minutes: 60,
        max_participants: null,
        is_free: true,
        price: 0,
        zoom_meeting_id: '',
        zoom_password: '',
        speaker_name: '',
        speaker_title: '',
        speaker_bio: '',
        speaker_image: '',
        company_name: '',
        company_logo: '',
        company_website: '',
        is_company_sponsored: false
      });

      onSeminarCreated();
      onClose();
    } catch (error) {
      console.error('Error creating seminar:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      toast({
        title: "Error",
        description: `Failed to create seminar: ${error.message || 'Please try again.'}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMinTime = () => {
    if (formData.seminar_date === new Date().toISOString().split('T')[0]) {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    return '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-5 w-5 text-purple-600" />
            Create Public Seminar
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-600" />
              Seminar Details
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Seminar Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter seminar title..."
                className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe what this seminar will cover..."
                rows={4}
                className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              Schedule
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.seminar_date}
                  onChange={(e) => handleInputChange('seminar_date', e.target.value)}
                  min={getMinDate()}
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.seminar_time}
                  onChange={(e) => handleInputChange('seminar_time', e.target.value)}
                  min={getMinTime()}
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select
                  value={formData.duration_minutes.toString()}
                  onValueChange={(value) => handleInputChange('duration_minutes', parseInt(value))}
                >
                  <SelectTrigger className="border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Pricing and Capacity */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              Pricing & Capacity
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_free"
                  checked={formData.is_free}
                  onCheckedChange={(checked) => handleInputChange('is_free', checked)}
                />
                <Label htmlFor="is_free">Free Seminar</Label>
              </div>

              {!formData.is_free && (
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="max_participants">Maximum Participants (Optional)</Label>
                <Input
                  id="max_participants"
                  type="number"
                  min="1"
                  value={formData.max_participants || ''}
                  onChange={(e) => handleInputChange('max_participants', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="No limit"
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
                <p className="text-sm text-gray-500">Leave empty for unlimited participants</p>
              </div>
            </div>
          </div>

          {/* Zoom Meeting Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              Meeting Details (Optional)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zoom_meeting_id">Zoom Meeting ID</Label>
                <Input
                  id="zoom_meeting_id"
                  value={formData.zoom_meeting_id}
                  onChange={(e) => handleInputChange('zoom_meeting_id', e.target.value)}
                  placeholder="123 456 7890"
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zoom_password">Zoom Password</Label>
                <Input
                  id="zoom_password"
                  type="password"
                  value={formData.zoom_password}
                  onChange={(e) => handleInputChange('zoom_password', e.target.value)}
                  placeholder="Meeting password"
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Speaker Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Speaker Information (Optional)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="speaker_name">Speaker Name</Label>
                <Input
                  id="speaker_name"
                  value={formData.speaker_name}
                  onChange={(e) => handleInputChange('speaker_name', e.target.value)}
                  placeholder="e.g., John Doe"
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="speaker_title">Speaker Title/Role</Label>
                <Input
                  id="speaker_title"
                  value={formData.speaker_title}
                  onChange={(e) => handleInputChange('speaker_title', e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="speaker_bio">Speaker Bio</Label>
              <Textarea
                id="speaker_bio"
                value={formData.speaker_bio}
                onChange={(e) => handleInputChange('speaker_bio', e.target.value)}
                placeholder="Brief biography of the speaker..."
                rows={3}
                className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="speaker_image">Speaker Image URL</Label>
              <Input
                id="speaker_image"
                value={formData.speaker_image}
                onChange={(e) => handleInputChange('speaker_image', e.target.value)}
                placeholder="https://example.com/speaker-image.jpg"
                className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              Company Information (Optional)
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_company_sponsored"
                  checked={formData.is_company_sponsored}
                  onCheckedChange={(checked) => handleInputChange('is_company_sponsored', checked)}
                />
                <Label htmlFor="is_company_sponsored">Company Sponsored Session</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="e.g., Google, Microsoft"
                    className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_website">Company Website</Label>
                  <Input
                    id="company_website"
                    value={formData.company_website}
                    onChange={(e) => handleInputChange('company_website', e.target.value)}
                    placeholder="https://company.com"
                    className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_logo">Company Logo URL</Label>
                <Input
                  id="company_logo"
                  value={formData.company_logo}
                  onChange={(e) => handleInputChange('company_logo', e.target.value)}
                  placeholder="https://example.com/company-logo.png"
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Seminar
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 