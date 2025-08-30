import { supabase } from '@/integrations/supabase/client';

interface ZoomMeetingDetails {
  meetingId: string;
  password?: string;
  joinUrl: string;
  startUrl?: string;
}

interface SessionData {
  sessionId: string;
  mentorId: string;
  menteeId: string;
  startTime: string;
  endTime: string;
  sessionTitle: string;
  description?: string;
}

export class ZoomService {
  private static instance: ZoomService;
  private zoomApiKey: string;
  private zoomApiSecret: string;

  constructor() {
    // These should be loaded from environment variables
    this.zoomApiKey = process.env.REACT_APP_ZOOM_API_KEY || '';
    this.zoomApiSecret = process.env.REACT_APP_ZOOM_API_SECRET || '';
  }

  static getInstance(): ZoomService {
    if (!ZoomService.instance) {
      ZoomService.instance = new ZoomService();
    }
    return ZoomService.instance;
  }

  async createMeeting(sessionData: SessionData): Promise<ZoomMeetingDetails> {
    try {
      // Create Zoom meeting using Zoom API
      const meetingDetails = await this.createZoomMeeting(sessionData);
      
      // Update session with meeting details
      await this.updateSessionWithMeetingDetails(sessionData.sessionId, meetingDetails);
      
      return meetingDetails;
    } catch (error) {
      console.error('Error creating Zoom meeting:', error);
      throw new Error('Failed to create Zoom meeting');
    }
  }

  private async createZoomMeeting(sessionData: SessionData): Promise<ZoomMeetingDetails> {
    // This is a simplified version - you'll need to implement actual Zoom API calls
    const meetingId = this.generateMeetingId();
    const password = this.generatePassword();
    
    return {
      meetingId,
      password,
      joinUrl: `https://zoom.us/j/${meetingId}?pwd=${password}`,
      startUrl: `https://zoom.us/s/${meetingId}?pwd=${password}`
    };
  }

  private async updateSessionWithMeetingDetails(sessionId: string, meetingDetails: ZoomMeetingDetails) {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          zoom_meeting_id: meetingDetails.meetingId,
          zoom_password: meetingDetails.password,
          zoom_join_url: meetingDetails.joinUrl,
          zoom_start_url: meetingDetails.startUrl,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating session with meeting details:', error);
      throw error;
    }
  }

  generateSignature(meetingId: string, role: number = 0): string {
    // This is a placeholder - you'll need to implement proper JWT signature generation
    // using your Zoom API credentials and the Zoom SDK
    
    const timestamp = Math.round(new Date().getTime() / 1000);
    const payload = {
      iss: this.zoomApiKey,
      exp: timestamp + 60 * 60 * 2, // 2 hours
      aud: 'zoom',
      appKey: this.zoomApiKey,
      tokenExp: timestamp + 60 * 60 * 2,
      alg: 'HS256',
      typ: 'JWT'
    };

    // In a real implementation, you would use a JWT library to sign this
    // For now, we'll return a placeholder
    return 'signature_placeholder_' + meetingId + '_' + timestamp;
  }

  private generateMeetingId(): string {
    // Generate a 9-11 digit meeting ID
    return Math.floor(100000000 + Math.random() * 900000000).toString();
  }

  private generatePassword(): string {
    // Generate a 6-character password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  async getSessionMeetingDetails(sessionId: string): Promise<ZoomMeetingDetails | null> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('zoom_meeting_id, zoom_password, zoom_join_url, zoom_start_url')
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      if (!data?.zoom_meeting_id) {
        return null;
      }

      return {
        meetingId: data.zoom_meeting_id,
        password: data.zoom_password,
        joinUrl: data.zoom_join_url,
        startUrl: data.zoom_start_url
      };
    } catch (error) {
      console.error('Error getting session meeting details:', error);
      return null;
    }
  }

  async cancelSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error cancelling session:', error);
      throw error;
    }
  }

  async endSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  async rescheduleSession(sessionId: string, newStartTime: string, newEndTime: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          scheduled_start: newStartTime,
          scheduled_end: newEndTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error rescheduling session:', error);
      throw error;
    }
  }
}

export const zoomService = ZoomService.getInstance(); 