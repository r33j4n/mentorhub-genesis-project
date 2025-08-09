
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle } from 'lucide-react';
import { SessionDetailsForm } from './BookSessionModal/SessionDetailsForm';
import { SessionScheduleForm } from './BookSessionModal/SessionScheduleForm';
import { SessionSummary } from './BookSessionModal/SessionSummary';
import { SessionFormData, SessionType } from './BookSessionModal/SessionFormData';
import { emailService } from '@/services/emailService';

interface BookSessionModalProps {
  mentorId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface AvailabilitySlot {
  availability_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  timezone: string;
}

export const BookSessionModal = ({ mentorId, isOpen, onClose }: BookSessionModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [mentorName, setMentorName] = useState<string>('');
  const [mentorEmail, setMentorEmail] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [sessionData, setSessionData] = useState<SessionFormData>({
    title: '',
    description: '',
    sessionType: 'one_on_one',
    durationMinutes: '60',
    scheduledTime: ''
  });

  const handleSessionDataChange = (newData: Partial<SessionFormData>) => {
    setSessionData(prev => ({ ...prev, ...newData }));
  };

  useEffect(() => {
    if (isOpen && mentorId) {
      loadMentorAvailability();
    }
  }, [isOpen, mentorId]);

  const loadMentorAvailability = async () => {
    if (!mentorId) return;
    
    setAvailabilityLoading(true);
    try {
      // Load mentor name and email
      const { data: mentorData, error: mentorError } = await supabase
        .from('mentors')
        .select(`
          users:mentors_mentor_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq('mentor_id', mentorId)
        .single();

      if (mentorError) {
        console.error('Error loading mentor data:', mentorError);
      } else if (mentorData?.users) {
        setMentorName(`${mentorData.users.first_name} ${mentorData.users.last_name}`);
        setMentorEmail(mentorData.users.email || '');
      }

      // Load availability
      const { data, error } = await supabase
        .from('mentor_availability')
        .select('*')
        .eq('mentor_id', mentorId)
        .eq('is_available', true)
        .order('day_of_week', { ascending: true });

      if (error) throw error;
      setAvailability(data || []);
    } catch (error: any) {
      console.error('Error loading mentor availability:', error);
      toast({
        title: "Error loading availability",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !mentorId || !selectedDate) return;

    setLoading(true);
    try {
      // Get mentor details for pricing
      const { data: mentorData, error: mentorError } = await supabase
        .from('mentors')
        .select('hourly_rate')
        .eq('mentor_id', mentorId)
        .single();

      if (mentorError) throw mentorError;

      const duration = parseInt(sessionData.durationMinutes);
      const basePrice = (mentorData.hourly_rate * duration) / 60;
      const commissionRate = 0.15; // 15% commission
      const platformFee = basePrice * commissionRate;
      const finalPrice = basePrice + platformFee;

      // Create scheduled start and end times
      const [hours, minutes] = sessionData.scheduledTime.split(':').map(Number);
      const scheduledStart = new Date(selectedDate);
      scheduledStart.setHours(hours, minutes, 0, 0);
      
      const scheduledEnd = new Date(scheduledStart);
      scheduledEnd.setMinutes(scheduledEnd.getMinutes() + duration);

      // Check for session conflicts
      const { data: conflictingSessions, error: conflictError } = await supabase
        .from('sessions')
        .select('*')
        .eq('mentor_id', mentorId)
        .in('status', ['confirmed', 'requested', 'in_progress'])
        .or(`scheduled_start.lte.${scheduledEnd.toISOString()},scheduled_end.gte.${scheduledStart.toISOString()}`);

      if (conflictError) {
        console.error('Error checking for conflicts:', conflictError);
      } else if (conflictingSessions && conflictingSessions.length > 0) {
        // Check if there are any overlapping sessions
        const hasConflict = conflictingSessions.some(session => {
          const sessionStart = new Date(session.scheduled_start);
          const sessionEnd = new Date(session.scheduled_end);
          
          // Check if the new session overlaps with existing sessions
          return (scheduledStart < sessionEnd && scheduledEnd > sessionStart);
        });

        if (hasConflict) {
          toast({
            title: "Time Slot Unavailable",
            description: "This time slot conflicts with an existing session. Please choose a different time.",
            variant: "destructive"
          });
          return;
        }
      }

      // Check if the requested time falls within mentor's availability
      const dayOfWeek = scheduledStart.getDay();
      const requestedTime = sessionData.scheduledTime;
      
      const isWithinAvailability = availability.some(slot => {
        if (slot.day_of_week !== dayOfWeek) return false;
        
        const slotStart = slot.start_time;
        const slotEnd = slot.end_time;
        
        // Check if the requested time falls within the availability slot
        return requestedTime >= slotStart && requestedTime < slotEnd;
      });

      if (!isWithinAvailability && availability.length > 0) {
        toast({
          title: "Outside Available Hours",
          description: "The requested time is outside the mentor's available hours. Please choose a time within their availability.",
          variant: "destructive"
        });
        return;
      }

      // Insert session
      const { data: createdSession, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          mentor_id: mentorId,
          mentee_id: user.id,
          title: sessionData.title,
          description: sessionData.description,
          session_type: sessionData.sessionType,
          duration_minutes: duration,
          scheduled_start: scheduledStart.toISOString(),
          scheduled_end: scheduledEnd.toISOString(),
          base_price: basePrice,
          platform_fee: platformFee,
          commission_rate: commissionRate,
          final_price: finalPrice,
          status: 'requested'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create notification for mentor
      try {
        await supabase
          .from('notifications')
          .insert({
            user_id: mentorId,
            title: 'New Session Request',
            message: `${mentorName || 'A mentee'} has requested a session: "${sessionData.title}"`,
            type: 'session_request',
            related_id: createdSession.id,
            is_read: false
          });
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't fail the session creation if notification fails
      }

      // Send email notification to mentor
      if (mentorEmail && mentorName) {
        try {
          const sessionDate = selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          
          const sessionTime = sessionData.scheduledTime;
          
          await emailService.sendSessionBookingEmail({
            mentorEmail,
            mentorName,
            menteeName: `${user.user_metadata?.first_name || 'A mentee'} ${user.user_metadata?.last_name || ''}`,
            sessionTitle: sessionData.title,
            sessionDescription: sessionData.description,
            sessionDate,
            sessionTime,
            duration: duration,
            price: finalPrice
          });

          console.log('Email notification sent to mentor successfully');
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
          // Don't fail the session creation if email fails
        }
      }

      toast({
        title: "Session Requested!",
        description: "Your session request has been sent to the mentor. You'll be notified when they respond."
      });

      onClose();
      setSessionData({
        title: '',
        description: '',
        sessionType: 'one_on_one',
        durationMinutes: '60',
        scheduledTime: ''
      });
    } catch (error: any) {
      toast({
        title: "Error booking session",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const DAYS_OF_WEEK = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Book Session with {mentorName || 'guru mentor'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Mentor Availability Section */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Mentor Availability</h3>
              </div>
              
              {availabilityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-gray-600">Loading availability...</span>
                </div>
              ) : availability.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-2">
                    {availability.map((slot, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                        <span className="font-medium text-green-800">
                          {DAYS_OF_WEEK[slot.day_of_week]}
                        </span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {slot.start_time} - {slot.end_time}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-green-600 mt-2">
                    ✓ This mentor has set their availability. You can request any time within these slots.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <XCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h4 className="font-medium text-gray-900 mb-2">No availability set</h4>
                  <p className="text-gray-600 text-sm mb-2">
                    This mentor hasn't set their availability yet.
                  </p>
                  <p className="text-gray-600 text-sm">
                    You can still request a session and they'll respond with their availability.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> You can select any preferred time below. The mentor will confirm if it works for them.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session Request Form */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Request Session</h3>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <SessionDetailsForm 
                  sessionData={sessionData}
                  onSessionDataChange={handleSessionDataChange}
                />

                <SessionScheduleForm
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  sessionData={sessionData}
                  onSessionDataChange={handleSessionDataChange}
                  availability={availability}
                />

                <SessionSummary
                  selectedDate={selectedDate}
                  sessionData={sessionData}
                />

                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Booking...' : 'Request Session'}
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
