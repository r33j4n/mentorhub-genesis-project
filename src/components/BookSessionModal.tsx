
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { SessionDetailsForm } from './BookSessionModal/SessionDetailsForm';
import { SessionScheduleForm } from './BookSessionModal/SessionScheduleForm';
import { SessionSummary } from './BookSessionModal/SessionSummary';
import { SessionFormData, SessionType } from './BookSessionModal/SessionFormData';

interface BookSessionModalProps {
  mentorId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BookSessionModal = ({ mentorId, isOpen, onClose }: BookSessionModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
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

      // Insert session
      const { error: sessionError } = await supabase
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
        });

      if (sessionError) throw sessionError;

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book a Session</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <SessionDetailsForm 
              sessionData={sessionData}
              onSessionDataChange={handleSessionDataChange}
            />

            <SessionScheduleForm
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              sessionData={sessionData}
              onSessionDataChange={handleSessionDataChange}
            />

            <SessionSummary
              selectedDate={selectedDate}
              sessionData={sessionData}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Booking...' : 'Request Session'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
