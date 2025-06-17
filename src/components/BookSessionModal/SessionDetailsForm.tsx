
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SessionFormData, SessionType } from './SessionFormData';

interface SessionDetailsFormProps {
  sessionData: SessionFormData;
  onSessionDataChange: (data: Partial<SessionFormData>) => void;
}

export const SessionDetailsForm = ({ sessionData, onSessionDataChange }: SessionDetailsFormProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Session Title</Label>
        <Input
          id="title"
          value={sessionData.title}
          onChange={(e) => onSessionDataChange({ title: e.target.value })}
          placeholder="e.g., React.js mentoring session"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={sessionData.description}
          onChange={(e) => onSessionDataChange({ description: e.target.value })}
          placeholder="What would you like to learn or discuss?"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sessionType">Session Type</Label>
          <Select 
            value={sessionData.sessionType} 
            onValueChange={(value: SessionType) => onSessionDataChange({ sessionType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one_on_one">One-on-One</SelectItem>
              <SelectItem value="consultation">Consultation</SelectItem>
              <SelectItem value="group">Group Session</SelectItem>
              <SelectItem value="workshop">Workshop</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="duration">Duration</Label>
          <Select 
            value={sessionData.durationMinutes} 
            onValueChange={(value) => onSessionDataChange({ durationMinutes: value })}
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
    </div>
  );
};
