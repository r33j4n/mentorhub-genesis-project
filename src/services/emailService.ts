import { supabase } from '@/integrations/supabase/client';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SessionBookingEmailData {
  mentorEmail: string;
  mentorName: string;
  menteeName: string;
  sessionTitle: string;
  sessionDescription: string;
  sessionDate: string;
  sessionTime: string;
  duration: number;
  price: number;
}

export class EmailService {
  private static instance: EmailService;
  private apiKey: string;

  constructor() {
    // This should be loaded from environment variables
    this.apiKey = import.meta.env.VITE_RESEND_API_KEY || '';
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Send email using Supabase Edge Function
   */
  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: emailData
      });

      if (error) {
        console.error('Error sending email:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error invoking email function:', error);
      return false;
    }
  }

  /**
   * Send session booking notification to mentor
   */
  async sendSessionBookingEmail(sessionData: SessionBookingEmailData): Promise<boolean> {
    const subject = `New Session Request: ${sessionData.sessionTitle}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Session Request</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .session-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 New Session Request</h1>
            <p>You have a new mentoring session request!</p>
          </div>
          
          <div class="content">
            <p>Hello <strong>${sessionData.mentorName}</strong>,</p>
            
            <p>Great news! You have received a new session request from <strong>${sessionData.menteeName}</strong>.</p>
            
            <div class="session-details">
              <h3>📋 Session Details</h3>
              <p><strong>Title:</strong> ${sessionData.sessionTitle}</p>
              <p><strong>Description:</strong> ${sessionData.sessionDescription}</p>
              <p><strong>Date:</strong> ${sessionData.sessionDate}</p>
              <p><strong>Time:</strong> ${sessionData.sessionTime}</p>
              <p><strong>Duration:</strong> ${sessionData.duration} minutes</p>
              <p><strong>Price:</strong> $${sessionData.price.toFixed(2)}</p>
            </div>
            
            <p>Please review this request and respond within 24 hours to maintain a great experience for your mentees.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${window.location.origin}/dashboard" class="button">View Dashboard</a>
              <a href="${window.location.origin}/dashboard?tab=sessions" class="button">Review Sessions</a>
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
            
            <p>Best regards,<br>The MentorHub Team</p>
          </div>
          
          <div class="footer">
            <p>This email was sent from MentorHub. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} MentorHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
New Session Request: ${sessionData.sessionTitle}

Hello ${sessionData.mentorName},

Great news! You have received a new session request from ${sessionData.menteeName}.

Session Details:
- Title: ${sessionData.sessionTitle}
- Description: ${sessionData.sessionDescription}
- Date: ${sessionData.sessionDate}
- Time: ${sessionData.sessionTime}
- Duration: ${sessionData.duration} minutes
- Price: $${sessionData.price.toFixed(2)}

Please review this request and respond within 24 hours to maintain a great experience for your mentees.

View your dashboard: ${window.location.origin}/dashboard

Best regards,
The MentorHub Team
    `;

    return await this.sendEmail({
      to: sessionData.mentorEmail,
      subject,
      html,
      text
    });
  }

  /**
   * Send session confirmation email to mentee
   */
  async sendSessionConfirmationEmail(menteeEmail: string, menteeName: string, mentorName: string, sessionTitle: string, sessionDate: string, sessionTime: string): Promise<boolean> {
    const subject = `Session Confirmed: ${sessionTitle}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Session Confirmed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .session-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Session Confirmed!</h1>
            <p>Your mentoring session has been confirmed</p>
          </div>
          
          <div class="content">
            <p>Hello <strong>${menteeName}</strong>,</p>
            
            <p>Great news! Your session with <strong>${mentorName}</strong> has been confirmed.</p>
            
            <div class="session-details">
              <h3>📅 Session Details</h3>
              <p><strong>Title:</strong> ${sessionTitle}</p>
              <p><strong>Mentor:</strong> ${mentorName}</p>
              <p><strong>Date:</strong> ${sessionDate}</strong></p>
              <p><strong>Time:</strong> ${sessionTime}</p>
            </div>
            
            <p>Please make sure to:</p>
            <ul>
              <li>Prepare your questions and topics for discussion</li>
              <li>Test your video/audio equipment beforehand</li>
              <li>Join the session 5 minutes early</li>
              <li>Have a quiet, distraction-free environment ready</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${window.location.origin}/dashboard" class="button">View Dashboard</a>
              <a href="${window.location.origin}/dashboard?tab=sessions" class="button">Session Details</a>
            </div>
            
            <p>If you need to reschedule or have any questions, please contact your mentor or our support team.</p>
            
            <p>Best regards,<br>The MentorHub Team</p>
          </div>
          
          <div class="footer">
            <p>This email was sent from MentorHub. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} MentorHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Session Confirmed: ${sessionTitle}

Hello ${menteeName},

Great news! Your session with ${mentorName} has been confirmed.

Session Details:
- Title: ${sessionTitle}
- Mentor: ${mentorName}
- Date: ${sessionDate}
- Time: ${sessionTime}

Please make sure to:
- Prepare your questions and topics for discussion
- Test your video/audio equipment beforehand
- Join the session 5 minutes early
- Have a quiet, distraction-free environment ready

View your dashboard: ${window.location.origin}/dashboard

Best regards,
The MentorHub Team
    `;

    return await this.sendEmail({
      to: menteeEmail,
      subject,
      html,
      text
    });
  }
}

export const emailService = EmailService.getInstance(); 