# Email Setup for MentorHub

This document explains how to set up email notifications for the MentorHub application.

## Overview

The application now includes email notifications that are sent to mentors when mentees book sessions, and to mentees when mentors confirm sessions.

## Email Service

We use **Resend** as our email service provider. Resend is a modern email API that provides excellent deliverability and developer experience.

## Setup Steps

### 1. Get Resend API Key

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Navigate to the API Keys section
4. Create a new API key
5. Copy the API key

### 2. Configure Environment Variables

Create a `.env` file in your project root and add:

```bash
# Email Service Configuration
VITE_RESEND_API_KEY=your_resend_api_key_here

# Supabase Configuration (if not already set)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Deploy Supabase Edge Function

The email functionality uses a Supabase Edge Function. Deploy it using:

```bash
# Navigate to your Supabase project directory
cd supabase

# Deploy the send-email function
supabase functions deploy send-email

# Set the environment variable for the function
supabase secrets set RESEND_API_KEY=your_resend_api_key_here
```

### 4. Verify Domain (Optional but Recommended)

For production use, verify your domain with Resend to improve email deliverability:

1. In Resend dashboard, go to Domains
2. Add your domain (e.g., `mentorhub.com`)
3. Follow the DNS verification steps
4. Update the `from` email in the Edge Function to use your verified domain

## How It Works

### Email Flow

1. **Mentee books a session** → Email sent to mentor
2. **Mentor accepts session** → Email sent to mentee
3. **Mentor declines session** → Notification only (no email)

### Email Templates

The application includes two email templates:

1. **Session Request Email** (to mentor):
   - Session details (title, description, date, time, duration, price)
   - Call-to-action buttons to view dashboard
   - Professional styling with MentorHub branding

2. **Session Confirmation Email** (to mentee):
   - Confirmation details
   - Preparation checklist
   - Links to dashboard and session details

### Technical Implementation

- **Frontend**: `src/services/emailService.ts` - Email service class
- **Backend**: `supabase/functions/send-email/index.ts` - Edge Function
- **Integration**: Updated session booking and acceptance flows

## Testing

### Local Development

1. Set up your environment variables
2. Deploy the Edge Function to Supabase
3. Book a test session as a mentee
4. Check that the mentor receives an email
5. Accept the session as a mentor
6. Check that the mentee receives a confirmation email

### Production

1. Verify your domain with Resend
2. Update the `from` email address in the Edge Function
3. Test with real users
4. Monitor email delivery rates

## Troubleshooting

### Common Issues

1. **"Email service not configured" error**
   - Check that `RESEND_API_KEY` is set in Supabase secrets
   - Verify the Edge Function is deployed

2. **Emails not being sent**
   - Check browser console for errors
   - Verify the Edge Function logs in Supabase dashboard
   - Check Resend dashboard for API errors

3. **Emails going to spam**
   - Verify your domain with Resend
   - Use a professional `from` address
   - Ensure proper email content and formatting

### Debug Mode

Enable debug logging by checking the browser console and Supabase Edge Function logs.

## Security Considerations

- API keys are stored securely in Supabase secrets
- Email addresses are validated before sending
- Rate limiting is handled by Resend
- No sensitive data is included in emails

## Cost

- Resend offers 3,000 free emails per month
- Additional emails cost $0.80 per 1,000
- Monitor usage in your Resend dashboard

## Support

For technical issues:
1. Check the browser console
2. Review Supabase Edge Function logs
3. Check Resend dashboard for delivery status
4. Contact the development team

For Resend-specific issues:
- Visit [Resend Documentation](https://resend.com/docs)
- Contact Resend Support 