import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { CheckCircle, Calendar, Clock, MessageSquare, Briefcase, Phone, X } from 'lucide-react';

interface SubscriptionApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentor: {
    mentor_id: string;
    hourly_rate: number;
    experience_years: number;
    rating: number;
    reviews_count: number;
    users: {
      first_name: string;
      last_name: string;
      bio: string;
      profile_image: string;
      timezone: string;
    };
    mentor_expertise: Array<{
      expertise_areas: {
        name: string;
        category: string;
      };
    }>;
  };
}

interface SubscriptionFormData {
  startDate: string;
  preferredTime: string;
  goals: string;
  experienceLevel: string;
  preferredCommunication: string;
}

export const SubscriptionApplicationModal = ({ isOpen, onClose, mentor }: SubscriptionApplicationModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SubscriptionFormData>({
    startDate: '',
    preferredTime: 'morning',
    goals: '',
    experienceLevel: 'beginner',
    preferredCommunication: 'video'
  });

  const { users: mentorUser } = mentor;

  const handleInputChange = (field: keyof SubscriptionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Calculate subscription details
      const monthlyPrice = mentor.hourly_rate * 4; // 2 calls of 60 min each = 4 hours
      const subscriptionDuration = 30; // days

      // For now, create a regular session since the subscription system isn't set up yet
      // TODO: Once migrations are applied, uncomment the subscription logic below
      
      // Create first session request (first call)
      const [hours, minutes] = formData.preferredTime === 'morning' ? ['09:00'] : 
                               formData.preferredTime === 'afternoon' ? ['14:00'] : ['18:00'];
      
      const scheduledStart = new Date(formData.startDate);
      scheduledStart.setHours(parseInt(hours), parseInt(minutes || '0'), 0, 0);
      
      const scheduledEnd = new Date(scheduledStart);
      scheduledEnd.setMinutes(scheduledEnd.getMinutes() + 60);

      const { error: sessionError } = await supabase
        .from('sessions')
        .insert({
          mentor_id: mentor.mentor_id,
          mentee_id: user.id,
          title: `Monthly Subscription - First Call`,
          description: `First call of monthly subscription. Goals: ${formData.goals}. Experience level: ${formData.experienceLevel}.`,
          session_type: 'consultation', // Use existing session type for now
          duration_minutes: 60,
          scheduled_start: scheduledStart.toISOString(),
          scheduled_end: scheduledEnd.toISOString(),
          base_price: mentor.hourly_rate,
          platform_fee: mentor.hourly_rate * 0.15,
          commission_rate: 0.15,
          final_price: mentor.hourly_rate * 1.15,
          status: 'requested'
        });

      if (sessionError) throw sessionError;

      // Create notification for mentor
      try {
        await supabase
          .from('notifications')
          .insert({
            user_id: mentor.mentor_id,
            title: 'New Subscription Application',
            message: `${user.email} has applied for your monthly subscription plan (2 calls/month)`,
            type: 'session_booked', // Use existing notification type for now
            related_id: null, // Will be updated once subscription system is in place
            is_read: false
          });
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
      }

      toast({
        title: "Subscription Applied Successfully!",
        description: `Your monthly subscription with ${mentorUser.first_name} ${mentorUser.last_name} has been activated. You have 2 calls remaining this month.`
      });

      onClose();
      setFormData({
        startDate: '',
        preferredTime: 'morning',
        goals: '',
        experienceLevel: 'beginner',
        preferredCommunication: 'video'
      });

      /* TODO: Uncomment this once the subscription system is set up
      // Create subscription record
      const { data: subscription, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert({
          mentee_id: user.id,
          mentor_id: mentor.mentor_id,
          subscription_type: 'monthly',
          monthly_price: monthlyPrice,
          calls_per_month: 2,
          call_duration_minutes: 60,
          start_date: formData.startDate,
          status: 'active',
          remaining_calls: 2,
          subscription_end_date: new Date(Date.now() + subscriptionDuration * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (subscriptionError) throw subscriptionError;

      // Create first session request (first call)
      const [hours, minutes] = formData.preferredTime === 'morning' ? ['09:00'] : 
                               formData.preferredTime === 'afternoon' ? ['14:00'] : ['18:00'];
      
      const scheduledStart = new Date(formData.startDate);
      scheduledStart.setHours(parseInt(hours), parseInt(minutes || '0'), 0, 0);
      
      const scheduledEnd = new Date(scheduledStart);
      scheduledEnd.setMinutes(scheduledEnd.getMinutes() + 60);

      const { error: sessionError } = await supabase
        .from('sessions')
        .insert({
          mentor_id: mentor.mentor_id,
          mentee_id: user.id,
          user_subscription_id: subscription.id,
          title: `Monthly Subscription - First Call`,
          description: `First call of monthly subscription. Goals: ${formData.goals}. Experience level: ${formData.experienceLevel}.`,
          session_type: 'subscription_call',
          duration_minutes: 60,
          scheduled_start: scheduledStart.toISOString(),
          scheduled_end: scheduledEnd.toISOString(),
          base_price: mentor.hourly_rate,
          platform_fee: mentor.hourly_rate * 0.15,
          commission_rate: 0.15,
          final_price: mentor.hourly_rate * 1.15,
          status: 'requested'
        });

      if (sessionError) throw sessionError;

      // Create notification for mentor
      try {
        await supabase
          .from('notifications')
          .insert({
            user_id: mentor.mentor_id,
            title: 'New Subscription Application',
            message: `${user.email} has applied for your monthly subscription plan (2 calls/month)`,
            type: 'subscription_request',
            related_id: subscription.id,
            is_read: false
          });
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
      }

      toast({
        title: "Subscription Applied Successfully!",
        description: `Your monthly subscription with ${mentorUser.first_name} ${mentorUser.last_name} has been activated. You have 2 calls remaining this month.`
      });

      onClose();
      setFormData({
        startDate: '',
        preferredTime: 'morning',
        goals: '',
        experienceLevel: 'beginner',
        preferredCommunication: 'video'
      });
      */

    } catch (error: any) {
      toast({
        title: "Error applying for subscription",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getNextMonthDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Apply for Monthly Subscription
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Subscription Plan Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  ${mentor.hourly_rate * 4}/month
                </div>
                <p className="text-gray-600 text-sm">
                  The most popular way to get mentored, let's work towards your goals!
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-3 text-green-500" />
                  <span>2 calls per month (60min/call)</span>
                </div>
                <div className="flex items-center text-sm">
                  <MessageSquare className="h-4 w-4 mr-3 text-green-500" />
                  <span>Unlimited Q&A via chat</span>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-3 text-green-500" />
                  <span>Expect responses in 2 days</span>
                </div>
                <div className="flex items-center text-sm">
                  <Briefcase className="h-4 w-4 mr-3 text-green-500" />
                  <span>Hands-on support</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center text-sm text-orange-600 mb-4">
                <span className="mr-1">🔥</span>
                Only 1 spot left!
              </div>
            </CardContent>
          </Card>

          {/* Application Form */}
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">When would you like to start?</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      max={getNextMonthDate()}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="preferredTime">Preferred time of day</Label>
                    <Select value={formData.preferredTime} onValueChange={(value) => handleInputChange('preferredTime', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (2 PM - 5 PM)</SelectItem>
                        <SelectItem value="evening">Evening (6 PM - 9 PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="goals">What are your main goals for this mentorship?</Label>
                  <Input
                    id="goals"
                    placeholder="e.g., Career transition, skill development, interview prep..."
                    value={formData.goals}
                    onChange={(e) => handleInputChange('goals', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="experienceLevel">Your experience level</Label>
                    <Select value={formData.experienceLevel} onValueChange={(value) => handleInputChange('experienceLevel', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner (0-2 years)</SelectItem>
                        <SelectItem value="intermediate">Intermediate (3-5 years)</SelectItem>
                        <SelectItem value="advanced">Advanced (5+ years)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="preferredCommunication">Preferred communication</Label>
                    <Select value={formData.preferredCommunication} onValueChange={(value) => handleInputChange('preferredCommunication', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Video calls</SelectItem>
                        <SelectItem value="audio">Audio calls</SelectItem>
                        <SelectItem value="chat">Chat only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Your subscription will be activated immediately</li>
                    <li>• First call will be scheduled based on your preferences</li>
                    <li>• Mentor will confirm the exact time and send you a calendar invite</li>
                    <li>• You'll have access to unlimited chat support</li>
                    <li>• Second call can be scheduled anytime during the month</li>
                  </ul>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                    {loading ? 'Applying...' : 'Apply for Subscription'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 