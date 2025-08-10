import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Clock, Calendar, MessageCircle, BookOpen, CheckCircle, XCircle, Eye } from 'lucide-react';

interface MentorAvailability {
  availability_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  timezone: string;
  mentor_id: string;
}

interface Mentor {
  mentor_id: string;
  hourly_rate: number;
  experience_years: number;
  rating: number;
  reviews_count: number;
  users: {
    first_name: string;
    last_name: string;
    email: string;
    profile_image: string;
    bio: string;
  } | null;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

interface MentorAvailabilityViewerProps {
  mentor: Mentor;
}

export const MentorAvailabilityViewer = ({ mentor }: MentorAvailabilityViewerProps) => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<MentorAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [duration, setDuration] = useState('60');
  const [requesting, setRequesting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const loadMentorAvailability = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mentor_availability')
        .select('*')
        .eq('mentor_id', mentor.mentor_id)
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
      setLoading(false);
    }
  };

  const getAvailableDays = () => {
    return availability.map(slot => DAYS_OF_WEEK[slot.day_of_week]);
  };

  const getTimeSlotsForDay = (dayOfWeek: number) => {
    const dayAvailability = availability.find(slot => slot.day_of_week === dayOfWeek);
    if (!dayAvailability) return [];

    const slots = [];
    const start = dayAvailability.start_time;
    const end = dayAvailability.end_time;
    
    // Generate 30-minute slots between start and end time
    let currentTime = new Date(`2000-01-01T${start}`);
    const endTime = new Date(`2000-01-01T${end}`);
    
    while (currentTime < endTime) {
      slots.push(currentTime.toTimeString().slice(0, 5));
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
    
    return slots;
  };

  // Default time slots when mentor hasn't set availability
  const getDefaultTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const requestSession = async () => {
    if (!user || !selectedDate || !selectedTime || !sessionTitle) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setRequesting(true);
    try {
      const sessionDate = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      sessionDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const endDate = new Date(sessionDate);
      endDate.setMinutes(endDate.getMinutes() + parseInt(duration));

      const { error } = await supabase
        .from('sessions')
        .insert({
          mentor_id: mentor.mentor_id,
          mentee_id: user.id,
          title: sessionTitle,
          description: sessionDescription,
          scheduled_start: sessionDate.toISOString(),
          scheduled_end: endDate.toISOString(),
          duration_minutes: parseInt(duration),
          base_price: mentor.hourly_rate * (parseInt(duration) / 60),
          final_price: mentor.hourly_rate * (parseInt(duration) / 60),
          commission_rate: 0.1,
          platform_fee: mentor.hourly_rate * (parseInt(duration) / 60) * 0.1,
          status: 'requested',
          session_type: 'one_on_one'
        });

      if (error) throw error;

      toast({
        title: "Session requested successfully!",
        description: "The mentor will review your request and confirm the session.",
      });

      // Reset form and close dialog
      setSelectedDate('');
      setSelectedTime('');
      setSessionTitle('');
      setSessionDescription('');
      setDuration('60');
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error requesting session:', error);
      toast({
        title: "Error requesting session",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setRequesting(false);
    }
  };

  const handleOpenDialog = () => {
    setIsOpen(true);
    loadMentorAvailability();
  };

  const availableDays = getAvailableDays();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          onClick={handleOpenDialog}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <BookOpen className="h-4 w-4 mr-1" />
          Book Session
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Book Session with {mentor.users?.first_name} {mentor.users?.last_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Availability Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5 text-green-600" />
                Mentor Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-gray-600">Loading availability...</span>
                </div>
              ) : availableDays.length === 0 ? (
                <div className="text-center py-6">
                  <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No availability set</p>
                  <p className="text-sm text-gray-500 mt-1">This mentor hasn't set their availability yet.</p>
                  <p className="text-sm text-gray-500">You can still request a session and they'll respond with their availability.</p>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> You can select any preferred time below. The mentor will confirm if it works for them.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableDays.map((day) => {
                    const timeSlots = getTimeSlotsForDay(day.value);
                    return (
                      <div key={day.value} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{day.label}</h4>
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Available
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          {timeSlots.slice(0, 3).map((time, index) => (
                            <div key={index} className="text-xs text-gray-600">
                              {time}
                            </div>
                          ))}
                          {timeSlots.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{timeSlots.length - 3} more times
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session Request Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Request Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="session-title">Session Title *</Label>
                <Input
                  id="session-title"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="e.g., React Development Help"
                />
              </div>

              <div>
                <Label htmlFor="session-description">Description</Label>
                <Textarea
                  id="session-description"
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                  placeholder="Describe what you'd like to work on..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="session-date">Preferred Date *</Label>
                  <Input
                    id="session-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <Label htmlFor="session-time">Preferred Time *</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDays.length > 0 ? (
                        // Use mentor's available times if they have set availability
                        availableDays.flatMap(day => getTimeSlotsForDay(day.value)).map(time => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))
                      ) : (
                        // Use default time slots if mentor hasn't set availability
                        getDefaultTimeSlots().map(time => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="session-duration">Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
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

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-900">Session Summary</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <div><strong>Mentor:</strong> {mentor.users?.first_name} {mentor.users?.last_name}</div>
                  <div><strong>Rate:</strong> ${mentor.hourly_rate}/hour</div>
                  <div><strong>Total Cost:</strong> ${(mentor.hourly_rate * (parseInt(duration) / 60)).toFixed(2)}</div>
                  {selectedDate && selectedTime && (
                    <div><strong>Preferred Time:</strong> {selectedDate} at {selectedTime}</div>
                  )}
                </div>
              </div>

              <Button 
                onClick={requestSession} 
                disabled={requesting || !selectedDate || !selectedTime || !sessionTitle}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {requesting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Requesting...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Request Session
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 