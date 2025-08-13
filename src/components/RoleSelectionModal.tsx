import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/ui/logo';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoleSelect?: (role: 'mentor' | 'mentee') => void;
}

export const RoleSelectionModal = ({ isOpen, onClose, onRoleSelect }: RoleSelectionModalProps) => {
  const [selectedRole, setSelectedRole] = useState<'mentor' | 'mentee' | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelection = async () => {
    if (!selectedRole || !user) {
      toast({
        title: "Role Required",
        description: "Please select whether you want to be a Mentor or looking for Mentors",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Setting user role:', selectedRole);

      // Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: selectedRole
        });

      if (roleError) {
        console.error('Error creating user role:', roleError);
        throw roleError;
      }

      console.log('User role created successfully');

      // Create role-specific profile
      if (selectedRole === 'mentor') {
        const { error: mentorError } = await supabase
          .from('mentors')
          .insert({
            mentor_id: user.id,
            bio: '',
            hourly_rate: 0,
            is_approved: false
          });

        if (mentorError) {
          console.error('Error creating mentor profile:', mentorError);
          throw mentorError;
        }

        console.log('Mentor profile created successfully');
        toast({
          title: "Welcome, Mentor!",
          description: "Your mentor profile has been created. You can now start helping others."
        });

        // Call onRoleSelect callback if provided
        if (onRoleSelect) {
          onRoleSelect(selectedRole);
        }
        
        // Redirect to mentor dashboard
        navigate('/mentor-dashboard');
      } else if (selectedRole === 'mentee') {
        const { error: menteeError } = await supabase
          .from('mentees')
          .insert({
            mentee_id: user.id,
            goals: '',
            budget_range: null,
            career_stage: null,
            preferred_communication: null
          });

        if (menteeError) {
          console.error('Error creating mentee profile:', menteeError);
          throw menteeError;
        }

        console.log('Mentee profile created successfully');
        toast({
          title: "Welcome, Mentee!",
          description: "Your mentee profile has been created. You can now start finding mentors."
        });

        // Call onRoleSelect callback if provided
        if (onRoleSelect) {
          onRoleSelect(selectedRole);
        }
        
        // Redirect to mentee dashboard
        navigate('/mentee-dashboard');
      }

      onClose();
    } catch (error: any) {
      console.error('Error setting user role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to set user role. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <Logo size="lg" variant="gradient" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Choose Your Role
          </CardTitle>
          <p className="text-gray-600">
            Tell us how you'd like to use MentorSES
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <RadioGroup 
              onValueChange={(value) => setSelectedRole(value as 'mentor' | 'mentee')} 
              value={selectedRole || ''} 
              className="grid grid-cols-1 gap-4"
            >
              <div 
                className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-purple-300 hover:bg-purple-50" 
                style={{ borderColor: selectedRole === 'mentor' ? '#9333ea' : '#e5e7eb' }}
                onClick={() => setSelectedRole('mentor')}
              >
                <RadioGroupItem value="mentor" id="mentor" className="mr-3" />
                <div className="flex items-center">
                  <div className="text-2xl mr-3">👨‍🏫</div>
                  <div>
                    <Label htmlFor="mentor" className="text-lg font-medium cursor-pointer">
                      I want to be a Mentor
                    </Label>
                    <p className="text-sm text-gray-600">
                      Share your expertise and help others grow
                    </p>
                  </div>
                </div>
              </div>
              
              <div 
                className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-purple-300 hover:bg-purple-50" 
                style={{ borderColor: selectedRole === 'mentee' ? '#9333ea' : '#e5e7eb' }}
                onClick={() => setSelectedRole('mentee')}
              >
                <RadioGroupItem value="mentee" id="mentee" className="mr-3" />
                <div className="flex items-center">
                  <div className="text-2xl mr-3">👨‍🎓</div>
                  <div>
                    <Label htmlFor="mentee" className="text-lg font-medium cursor-pointer">
                      I'm looking for Mentors
                    </Label>
                    <p className="text-sm text-gray-600">
                      Find expert mentors to guide your journey
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
            
            {selectedRole === null && (
              <p className="text-sm text-red-500">
                Please select your role to continue
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleRoleSelection} 
              disabled={!selectedRole || loading}
              className="flex-1"
            >
              {loading ? 'Setting up...' : 'Continue'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 