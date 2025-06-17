
import React from 'react';
import { format } from 'date-fns';
import { SessionFormData } from './SessionFormData';

interface SessionSummaryProps {
  selectedDate: Date | undefined;
  sessionData: SessionFormData;
}

export const SessionSummary = ({ selectedDate, sessionData }: SessionSummaryProps) => {
  if (!selectedDate || !sessionData.scheduledTime) {
    return null;
  }

  return (
    <div className="p-4 bg-blue-50 rounded-lg">
      <h4 className="font-medium text-blue-900">Session Summary</h4>
      <p className="text-blue-700 text-sm mt-1">
        {format(selectedDate, 'EEEE, MMMM d, yyyy')} at {sessionData.scheduledTime}
      </p>
      <p className="text-blue-700 text-sm">
        Duration: {sessionData.durationMinutes} minutes
      </p>
    </div>
  );
};
