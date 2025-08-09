
import React, { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { SessionFormData } from './SessionFormData';

interface AvailabilitySlot {
  availability_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  timezone: string;
}

interface SessionScheduleFormProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  sessionData: SessionFormData;
  onSessionDataChange: (data: Partial<SessionFormData>) => void;
  availability?: AvailabilitySlot[];
}

export const SessionScheduleForm = ({ 
  selectedDate, 
  onDateChange, 
  sessionData, 
  onSessionDataChange,
  availability = []
}: SessionScheduleFormProps) => {
  
  // Generate time slots for the selected date
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate || availability.length === 0) return [];
    
    const dayOfWeek = selectedDate.getDay();
    const dayAvailability = availability.filter(slot => slot.day_of_week === dayOfWeek);
    
    if (dayAvailability.length === 0) return [];
    
    const timeSlots: string[] = [];
    
    dayAvailability.forEach(slot => {
      const startHour = parseInt(slot.start_time.split(':')[0]);
      const startMinute = parseInt(slot.start_time.split(':')[1]);
      const endHour = parseInt(slot.end_time.split(':')[0]);
      const endMinute = parseInt(slot.end_time.split(':')[1]);
      
      // Generate 30-minute slots within the availability window
      let currentHour = startHour;
      let currentMinute = startMinute;
      
      while (
        currentHour < endHour || 
        (currentHour === endHour && currentMinute < endMinute)
      ) {
        const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        timeSlots.push(timeString);
        
        // Add 30 minutes
        currentMinute += 30;
        if (currentMinute >= 60) {
          currentHour += 1;
          currentMinute = 0;
        }
      }
    });
    
    return timeSlots;
  }, [selectedDate, availability]);

  const isDateAvailable = (date: Date) => {
    const dayOfWeek = date.getDay();
    return availability.some(slot => slot.day_of_week === dayOfWeek);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Select Date</Label>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateChange}
          disabled={(date) => {
            const isPast = date < new Date() || date < new Date(Date.now() - 86400000);
            const isUnavailable = availability.length > 0 && !isDateAvailable(date);
            return isPast || isUnavailable;
          }}
          className="rounded-md border"
        />
        {availability.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            <span className="text-green-600">●</span> Available days
            <span className="text-gray-400 ml-4">●</span> Unavailable days
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="time">Preferred Time</Label>
        <Input
          id="time"
          type="time"
          value={sessionData.scheduledTime}
          onChange={(e) => onSessionDataChange({ scheduledTime: e.target.value })}
          required
        />
        
        {availableTimeSlots.length > 0 && (
          <div className="mt-2">
            <Label className="text-sm text-gray-600 mb-2">Available Time Slots:</Label>
            <div className="flex flex-wrap gap-2">
              {availableTimeSlots.slice(0, 8).map((time, index) => (
                <Badge
                  key={index}
                  variant={sessionData.scheduledTime === time ? "default" : "outline"}
                  className="cursor-pointer hover:bg-blue-50"
                  onClick={() => onSessionDataChange({ scheduledTime: time })}
                >
                  {time}
                </Badge>
              ))}
              {availableTimeSlots.length > 8 && (
                <Badge variant="outline" className="text-gray-500">
                  +{availableTimeSlots.length - 8} more
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {selectedDate && availability.length > 0 && availableTimeSlots.length === 0 && (
          <div className="mt-2 text-sm text-orange-600">
            ⚠️ No availability set for this day. You can still request a session and the mentor will confirm.
          </div>
        )}
      </div>
    </div>
  );
};
