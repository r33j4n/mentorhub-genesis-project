
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { SessionFormData } from './SessionFormData';

interface SessionScheduleFormProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  sessionData: SessionFormData;
  onSessionDataChange: (data: Partial<SessionFormData>) => void;
}

export const SessionScheduleForm = ({ 
  selectedDate, 
  onDateChange, 
  sessionData, 
  onSessionDataChange 
}: SessionScheduleFormProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label>Select Date</Label>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateChange}
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
          onChange={(e) => onSessionDataChange({ scheduledTime: e.target.value })}
          required
        />
      </div>
    </div>
  );
};
