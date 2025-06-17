
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface BookSessionModalProps {
  mentorId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BookSessionModal = ({ mentorId, isOpen, onClose }: BookSessionModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [sessionData, setSessionData] = useState({
    title: '',
    description: '',
    sessionType: 'one_on_one',
    durationMinutes: '60',
    scheduledTime: ''
  });

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
            <div>
              <Label htmlFor="title">Session Title</Label>
              <Input
                id="title"
                value={sessionData.title}
                onChange={(e) => setSessionData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., React.js mentoring session"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={sessionData.description}
                onChange={(e) => setSessionData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What would you like to learn or discuss?"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sessionType">Session Type</Label>
                <Select 
                  value={sessionData.sessionType} 
                  onValueChange={(value) => setSessionData(prev => ({ ...prev, sessionType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_on_one">One-on-One</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="group">Group Session</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration">Duration</Label>
                <Select 
                  value={sessionData.durationMinutes} 
                  onValueChange={(value) => setSessionData(prev => ({ ...prev, durationMinutes: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Select Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date < new Date(Date.now() - 86400000)}
                  className="rounded-md border"
                />
              </div>

              <div>
                <Label htmlFor="time">Preferred Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={sessionData.scheduledTime}
                  onChange={(e) => setSessionData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  required
                />
              </div>
            </div>

            {selectedDate && sessionData.scheduledTime && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">Session Summary</h4>
                <p className="text-blue-700 text-sm mt-1">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')} at {sessionData.scheduledTime}
                </p>
                <p className="text-blue-700 text-sm">
                  Duration: {sessionData.durationMinutes} minutes
                </p>
              </div>
            )}
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
