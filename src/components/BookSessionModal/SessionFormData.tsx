
export type SessionType = 'one_on_one' | 'consultation' | 'group' | 'workshop';

export interface SessionFormData {
  title: string;
  description: string;
  sessionType: SessionType;
  durationMinutes: string;
  scheduledTime: string;
}
