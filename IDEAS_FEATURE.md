# Business Ideas Feature

## Overview

The Business Ideas feature allows mentees to post their business ideas publicly on the platform, enabling mentors to discover and potentially invest in these ideas. This creates a marketplace for innovation and investment opportunities.

## Features

### For Mentees

1. **Post Business Ideas**
   - Create detailed posts about business ideas
   - Include industry, development stage, funding needs, and equity offered
   - Add contact information for interested mentors
   - Toggle idea visibility (active/inactive)

2. **Manage Ideas**
   - View all posted ideas with statistics
   - Edit or delete existing ideas
   - Track views and engagement

3. **Handle Mentor Contacts**
   - Receive and review contact requests from mentors
   - Accept, decline, or respond to mentor interest
   - Manage contact status and communication

### For Mentors

1. **Browse Ideas**
   - View all active business ideas from mentees
   - Filter by industry, stage, funding range
   - Search ideas by keywords
   - Sort by newest, oldest, views, or funding amount

2. **Contact Mentees**
   - Express interest in specific ideas
   - Send personalized messages
   - Choose preferred contact method (email, phone, platform)

3. **Track Contacts**
   - View all contacts made with mentees
   - Monitor response status
   - Manage ongoing conversations

## Database Schema

### Tables

1. **ideas**
   - `id`: Unique identifier
   - `mentee_id`: Reference to mentee
   - `title`: Idea title
   - `description`: Detailed description
   - `industry`: Industry category
   - `stage`: Development stage (idea, prototype, mvp, early_traction, scaling)
   - `funding_needed`: Amount of funding required
   - `equity_offered`: Percentage of equity offered
   - `contact_email`: Contact email
   - `contact_phone`: Contact phone
   - `is_active`: Visibility status
   - `views_count`: Number of views
   - `created_at`, `updated_at`: Timestamps

2. **idea_views**
   - `id`: Unique identifier
   - `idea_id`: Reference to idea
   - `viewer_id`: Reference to user who viewed
   - `viewed_at`: Timestamp

3. **idea_contacts**
   - `id`: Unique identifier
   - `idea_id`: Reference to idea
   - `mentor_id`: Reference to mentor
   - `message`: Contact message
   - `contact_method`: Preferred contact method
   - `status`: Contact status (pending, accepted, declined, contacted)
   - `created_at`, `updated_at`: Timestamps

## Components

### Core Components

1. **CreateIdeaModal** (`src/components/CreateIdeaModal.tsx`)
   - Form for mentees to create new ideas
   - Validation and submission handling

2. **IdeaCard** (`src/components/IdeaCard.tsx`)
   - Display individual idea with all details
   - Contact functionality for mentors
   - Status management for mentees

3. **IdeasList** (`src/components/IdeasList.tsx`)
   - List view of ideas with filtering and search
   - Statistics and analytics
   - Responsive grid layout

4. **IdeaContactsManager** (`src/components/IdeaContactsManager.tsx`)
   - Mentee interface for managing contacts
   - Response handling and status updates

5. **MentorIdeaContacts** (`src/components/MentorIdeaContacts.tsx`)
   - Mentor interface for tracking contacts
   - Contact history and status overview

### Service Layer

**IdeaService** (`src/services/ideaService.ts`)
- All database operations for ideas
- Contact management
- Search and filtering functionality
- View tracking

## User Interface

### Mentee Dashboard
- New "My Ideas" tab
- Create, manage, and track ideas
- Handle mentor contacts
- View analytics and statistics

### Mentor Dashboard
- New "Business Ideas" tab with two sub-tabs:
  - Browse Ideas: Discover and filter ideas
  - My Contacts: Track interactions with mentees

## Security & Permissions

### Row Level Security (RLS)
- Mentees can only manage their own ideas
- Mentors can only view active ideas
- Contact records are properly scoped
- Admin access for all operations

### Data Validation
- Required fields validation
- Contact method restrictions
- Status constraints
- Funding and equity validation

## Usage Examples

### Posting an Idea (Mentee)
1. Navigate to "My Ideas" tab
2. Click "Post New Idea"
3. Fill in idea details:
   - Title: "AI-Powered Learning Platform"
   - Description: "Personalized learning using AI..."
   - Industry: "Technology"
   - Stage: "MVP"
   - Funding: $50,000
   - Equity: 15%
4. Add contact information
5. Submit and publish

### Browsing Ideas (Mentor)
1. Navigate to "Business Ideas" tab
2. Use filters to narrow down:
   - Industry: Technology
   - Stage: MVP or later
   - Funding: $10K - $100K
3. Review idea details
4. Click "Contact Mentee" to express interest

### Managing Contacts (Mentee)
1. View contacts in idea management
2. Review mentor messages
3. Accept, decline, or respond to contacts
4. Track conversation status

## Future Enhancements

1. **Notifications**
   - Email notifications for new contacts
   - In-app notifications for idea views
   - Status change alerts

2. **Advanced Features**
   - Idea collaboration tools
   - Investment tracking
   - Due diligence checklists
   - Legal document templates

3. **Analytics**
   - Idea performance metrics
   - Market trend analysis
   - Success rate tracking

4. **Integration**
   - Payment processing for investments
   - Document sharing
   - Video conferencing integration

## Technical Notes

- Uses Supabase for database and authentication
- Implements real-time view tracking
- Responsive design for mobile and desktop
- TypeScript for type safety
- Tailwind CSS for styling
- Lucide React for icons

## Migration

The feature requires the following database migration:
- `20250101000006_create_ideas_table.sql`

Run with: `npx supabase db push --include-all` 