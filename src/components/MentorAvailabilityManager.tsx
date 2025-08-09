import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Clock, Calendar, Save, CheckCircle, XCircle } from 'lucide-react';

interface AvailabilitySlot {
  availability_id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  timezone: string;
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

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
];

export const MentorAvailabilityManager = () => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timezone, setTimezone] = useState('UTC');

  useEffect(() => {
    if (user) {
      loadAvailability();
    }
  }, [user]);

  const loadAvailability = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('mentor_availability')
        .select('*')
        .eq('mentor_id', user.id)
        .order('day_of_week', { ascending: true });

      if (error) throw error;

      // Initialize availability for all days if none exist
      if (!data || data.length === 0) {
        const defaultAvailability = DAYS_OF_WEEK.map(day => ({
          day_of_week: day.value,
          start_time: '09:00',
          end_time: '17:00',
          is_available: false,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }));
        setAvailability(defaultAvailability);
        setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
      } else {
        setAvailability(data);
        setTimezone(data[0]?.timezone || 'UTC');
      }
    } catch (error: any) {
      console.error('Error loading availability:', error);
      toast({
        title: "Error loading availability",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAvailability = (dayOfWeek: number, field: keyof AvailabilitySlot, value: any) => {
    setAvailability(prev => 
      prev.map(slot => 
        slot.day_of_week === dayOfWeek 
          ? { ...slot, [field]: value }
          : slot
      )
    );
  };

  const saveAvailability = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Delete existing availability
      await supabase
        .from('mentor_availability')
        .delete()
        .eq('mentor_id', user.id);

      // Insert new availability
      const availabilityToSave = availability.map(slot => ({
        ...slot,
        mentor_id: user.id,
        timezone
      }));

      const { error } = await supabase
        .from('mentor_availability')
        .insert(availabilityToSave);

      if (error) throw error;

      toast({
        title: "Availability saved successfully!",
        description: "Your availability schedule has been updated.",
      });
    } catch (error: any) {
      console.error('Error saving availability:', error);
      toast({
        title: "Error saving availability",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getDayAvailability = (dayOfWeek: number) => {
    return availability.find(slot => slot.day_of_week === dayOfWeek);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
            <span className="text-gray-600">Loading availability...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Manage Your Availability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Label htmlFor="timezone">Timezone:</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                <SelectItem value="Europe/London">London</SelectItem>
                <SelectItem value="Europe/Paris">Paris</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                <SelectItem value="Asia/Shanghai">Shanghai</SelectItem>
                <SelectItem value="Australia/Sydney">Sydney</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {DAYS_OF_WEEK.map((day) => {
              const dayAvailability = getDayAvailability(day.value);
              
              return (
                <Card key={day.value} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Switch
                        checked={dayAvailability?.is_available || false}
                        onCheckedChange={(checked) => 
                          updateAvailability(day.value, 'is_available', checked)
                        }
                      />
                      <Label className="text-lg font-medium">{day.label}</Label>
                      {dayAvailability?.is_available && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Available
                        </Badge>
                      )}
                    </div>

                    {dayAvailability?.is_available && (
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`start-${day.value}`}>Start:</Label>
                          <Select
                            value={dayAvailability.start_time}
                            onValueChange={(value) => 
                              updateAvailability(day.value, 'start_time', value)
                            }
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_SLOTS.map(time => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`end-${day.value}`}>End:</Label>
                          <Select
                            value={dayAvailability.end_time}
                            onValueChange={(value) => 
                              updateAvailability(day.value, 'end_time', value)
                            }
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_SLOTS.map(time => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={saveAvailability} 
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Availability
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-600" />
            Quick Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Set your availability for each day of the week</li>
            <li>• Choose your preferred time slots</li>
            <li>• Mentees will only see your available times</li>
            <li>• You can update your schedule anytime</li>
            <li>• Make sure to set your correct timezone</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}; 