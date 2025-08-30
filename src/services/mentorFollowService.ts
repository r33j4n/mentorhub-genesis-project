import { supabase } from '@/integrations/supabase/client';

// Helper function to get current user ID
const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  console.log('getCurrentUserId called, user:', user);
  return user?.id || null;
};

export interface MentorFollow {
  id: string;
  mentee_id: string;
  mentor_id: string;
  created_at: string;
}

export interface PublicSeminar {
  id: string;
  mentor_id: string;
  title: string;
  description: string;
  seminar_date: string;
  duration_minutes: number;
  max_participants: number | null;
  current_participants: number;
  is_free: boolean;
  price: number;
  zoom_meeting_id: string | null;
  zoom_password: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  speaker_name?: string;
  speaker_title?: string;
  speaker_bio?: string;
  speaker_image?: string;
  company_name?: string;
  company_logo?: string;
  company_website?: string;
  is_company_sponsored?: boolean;
  created_at: string;
  updated_at: string;
  mentor?: {
    users: {
      first_name: string;
      last_name: string;
      profile_image: string;
    };
  };
}

export interface SeminarNotification {
  id: string;
  mentee_id: string;
  seminar_id: string;
  mentor_id: string;
  notification_type: 'new_seminar' | 'seminar_reminder' | 'seminar_starting';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  seminar?: PublicSeminar;
  mentor?: {
    users: {
      first_name: string;
      last_name: string;
      profile_image: string;
    };
  };
}

export class MentorFollowService {
  // Follow a mentor
  static async followMentor(mentorId: string): Promise<boolean> {
    try {
      console.log('followMentor called with mentorId:', mentorId);
      const currentUserId = await getCurrentUserId();
      console.log('Current user ID:', currentUserId);
      
      if (!currentUserId) {
        console.error('No authenticated user found');
        return false;
      }

      console.log('Inserting follow record:', { mentee_id: currentUserId, mentor_id: mentorId });
      const { data, error } = await supabase
        .from('mentor_follows')
        .insert({
          mentee_id: currentUserId,
          mentor_id: mentorId
        })
        .select();

      console.log('Insert result:', { data, error });
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error following mentor:', error);
      return false;
    }
  }

  // Unfollow a mentor
  static async unfollowMentor(mentorId: string): Promise<boolean> {
    try {
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) {
        console.error('No authenticated user found');
        return false;
      }

      const { error } = await supabase
        .from('mentor_follows')
        .delete()
        .eq('mentor_id', mentorId)
        .eq('mentee_id', currentUserId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unfollowing mentor:', error);
      return false;
    }
  }

  // Check if user is following a mentor
  static async isFollowingMentor(mentorId: string): Promise<boolean> {
    try {
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) {
        console.error('No authenticated user found');
        return false;
      }

      const { data, error } = await supabase
        .from('mentor_follows')
        .select('id')
        .eq('mentor_id', mentorId)
        .eq('mentee_id', currentUserId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }

  // Get all mentors that the user follows
  static async getFollowedMentors(): Promise<MentorFollow[]> {
    try {
      const { data, error } = await supabase
        .from('mentor_follows')
        .select(`
          *,
          mentor:mentor_id (
            users:mentors_mentor_id_fkey (
              first_name,
              last_name,
              profile_image
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting followed mentors:', error);
      return [];
    }
  }

  // Get public seminars from followed mentors
  static async getFollowedMentorsSeminars(): Promise<PublicSeminar[]> {
    try {
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) {
        console.error('No authenticated user found');
        return [];
      }

      console.log('Getting seminars from followed mentors for user:', currentUserId);

      // First, get the mentor IDs that the current user follows
      const { data: followedMentors, error: followsError } = await supabase
        .from('mentor_follows')
        .select('mentor_id')
        .eq('mentee_id', currentUserId);

      if (followsError) throw followsError;

      console.log('Followed mentor IDs:', followedMentors);

      if (!followedMentors || followedMentors.length === 0) {
        console.log('No followed mentors found');
        return [];
      }

      const mentorIds = followedMentors.map(fm => fm.mentor_id);
      console.log('Mentor IDs to filter by:', mentorIds);

      // Then, get seminars from those mentors
      const { data, error } = await supabase
        .from('public_seminars')
        .select(`
          *,
          mentor:mentor_id (
            users (
              first_name,
              last_name,
              profile_image
            )
          )
        `)
        .in('mentor_id', mentorIds)
        .gte('seminar_date', new Date().toISOString())
        .order('seminar_date', { ascending: true });

      if (error) throw error;

      console.log('Seminars from followed mentors:', data);
      return data || [];
    } catch (error) {
      console.error('Error getting followed mentors seminars:', error);
      return [];
    }
  }

  // Get all public seminars
  static async getAllPublicSeminars(): Promise<PublicSeminar[]> {
    try {
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) {
        console.error('No authenticated user found');
        return [];
      }

      console.log('Getting all public seminars for user:', currentUserId);

      // Optimized query with better performance
      const { data, error } = await supabase
        .from('public_seminars')
        .select(`
          id,
          mentor_id,
          title,
          description,
          seminar_date,
          duration_minutes,
          max_participants,
          current_participants,
          is_free,
          price,
          zoom_meeting_id,
          zoom_password,
          status,
          speaker_name,
          speaker_title,
          speaker_bio,
          speaker_image,
          company_name,
          company_logo,
          company_website,
          is_company_sponsored,
          created_at,
          updated_at,
          mentor:mentor_id (
            users (
              first_name,
              last_name,
              profile_image
            )
          )
        `)
        .gte('seminar_date', new Date().toISOString())
        .eq('status', 'scheduled')
        .order('seminar_date', { ascending: true })
        .limit(50); // Limit results for better performance

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log(`Loaded ${data?.length || 0} public seminars`);
      return data || [];
    } catch (error) {
      console.error('Error getting public seminars:', error);
      return [];
    }
  }

  // Join a public seminar (reserve seat)
  static async joinSeminar(seminarId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) {
        console.error('No authenticated user found');
        return { success: false, message: 'Authentication required' };
      }

      // First, check if user is already participating
      const isAlreadyParticipating = await this.isParticipatingInSeminar(seminarId);
      if (isAlreadyParticipating) {
        return { success: false, message: 'You are already registered for this seminar' };
      }

      // Get seminar details to check capacity
      const { data: seminar, error: seminarError } = await supabase
        .from('public_seminars')
        .select('max_participants, current_participants, title')
        .eq('id', seminarId)
        .single();

      if (seminarError) throw seminarError;

      // Check if seminar is full
      if (seminar.max_participants && seminar.current_participants >= seminar.max_participants) {
        return { success: false, message: 'This seminar is full. No seats available.' };
      }

      // Join the seminar (trigger will automatically update participant count)
      const { error: joinError } = await supabase
        .from('seminar_participants')
        .insert({
          mentee_id: currentUserId,
          seminar_id: seminarId
        });

      if (joinError) throw joinError;

      console.log(`Successfully reserved seat for seminar: ${seminar.title}`);
      return { success: true, message: `Seat reserved for "${seminar.title}"` };
    } catch (error) {
      console.error('Error joining seminar:', error);
      return { success: false, message: 'Failed to reserve seat. Please try again.' };
    }
  }

  // Leave a public seminar (cancel seat reservation)
  static async leaveSeminar(seminarId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) {
        console.error('No authenticated user found');
        return { success: false, message: 'Authentication required' };
      }

      // Check if user is actually participating
      const isParticipating = await this.isParticipatingInSeminar(seminarId);
      if (!isParticipating) {
        return { success: false, message: 'You are not registered for this seminar' };
      }

      // Get seminar title for the success message
      const { data: seminar, error: seminarError } = await supabase
        .from('public_seminars')
        .select('title')
        .eq('id', seminarId)
        .single();

      if (seminarError) throw seminarError;

      // Remove participation (trigger will automatically update participant count)
      const { error: leaveError } = await supabase
        .from('seminar_participants')
        .delete()
        .eq('seminar_id', seminarId)
        .eq('mentee_id', currentUserId);

      if (leaveError) throw leaveError;

      console.log(`Successfully cancelled seat reservation for seminar: ${seminar.title}`);
      return { success: true, message: `Seat reservation cancelled for "${seminar.title}"` };
    } catch (error) {
      console.error('Error leaving seminar:', error);
      return { success: false, message: 'Failed to cancel seat reservation. Please try again.' };
    }
  }

  // Check if user is participating in a seminar
  static async isParticipatingInSeminar(seminarId: string): Promise<boolean> {
    try {
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) {
        console.error('No authenticated user found');
        return false;
      }

      const { data, error } = await supabase
        .from('seminar_participants')
        .select('id')
        .eq('seminar_id', seminarId)
        .eq('mentee_id', currentUserId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking participation status:', error);
      return false;
    }
  }

  // Check if seminar has available seats
  static async checkSeatAvailability(seminarId: string): Promise<{ available: boolean; remainingSeats?: number; totalSeats?: number }> {
    try {
      const { data: seminar, error } = await supabase
        .from('public_seminars')
        .select('max_participants, current_participants')
        .eq('id', seminarId)
        .single();

      if (error) throw error;

      if (!seminar.max_participants) {
        return { available: true }; // Unlimited seats
      }

      const remainingSeats = seminar.max_participants - seminar.current_participants;
      return {
        available: remainingSeats > 0,
        remainingSeats,
        totalSeats: seminar.max_participants
      };
    } catch (error) {
      console.error('Error checking seat availability:', error);
      return { available: false };
    }
  }

  // Get seminar participants (for mentors to view who reserved seats)
  static async getSeminarParticipants(seminarId: string): Promise<Array<{
    id: string;
    mentee_id: string;
    seminar_id: string;
    created_at: string;
    mentee: {
      users: {
        first_name: string;
        last_name: string;
        email: string;
        profile_image: string;
      };
    };
  }>> {
    try {
      console.log('Getting participants for seminar:', seminarId);
      const { data, error } = await supabase
        .from('seminar_participants')
        .select(`
          *,
          mentee:mentee_id (
            users:user_id_fkey (
              first_name,
              last_name,
              email,
              profile_image
            )
          )
        `)
        .eq('seminar_id', seminarId)
        .order('created_at', { ascending: true });

      console.log('Raw participants query result:', { data, error });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting seminar participants:', error);
      return [];
    }
  }

  // Get user's seminar notifications
  static async getSeminarNotifications(): Promise<SeminarNotification[]> {
    try {
      const { data, error } = await supabase
        .from('seminar_notifications')
        .select(`
          *,
          seminar:seminar_id (*),
          mentor:mentor_id (
            users:mentors_mentor_id_fkey (
              first_name,
              last_name,
              profile_image
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting seminar notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  static async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('seminar_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Mark all notifications as read
  static async markAllNotificationsAsRead(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('seminar_notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Get unread notification count
  static async getUnreadNotificationCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('seminar_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }
} 