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
            users:mentors_mentor_id_fkey (
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

  // Get all public seminars (excluding seminars from followed mentors)
  static async getAllPublicSeminars(): Promise<PublicSeminar[]> {
    try {
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) {
        console.error('No authenticated user found');
        return [];
      }

      console.log('Getting all public seminars (excluding followed mentors) for user:', currentUserId);

      // First, get the mentor IDs that the current user follows
      const { data: followedMentors, error: followsError } = await supabase
        .from('mentor_follows')
        .select('mentor_id')
        .eq('mentee_id', currentUserId);

      if (followsError) throw followsError;

      console.log('Followed mentor IDs to exclude:', followedMentors);

      // Get all seminars, excluding those from followed mentors
      let query = supabase
        .from('public_seminars')
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
        .gte('seminar_date', new Date().toISOString());

      // If user follows mentors, exclude their seminars
      if (followedMentors && followedMentors.length > 0) {
        const mentorIds = followedMentors.map(fm => fm.mentor_id);
        query = query.not('mentor_id', 'in', `(${mentorIds.join(',')})`);
      }

      const { data, error } = await query.order('seminar_date', { ascending: true });

      if (error) throw error;

      console.log('All public seminars (excluding followed):', data);
      return data || [];
    } catch (error) {
      console.error('Error getting public seminars:', error);
      return [];
    }
  }

  // Join a public seminar
  static async joinSeminar(seminarId: string): Promise<boolean> {
    try {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        console.error('No authenticated user found');
        return false;
      }

      const { error } = await supabase
        .from('seminar_participants')
        .insert({
          mentee_id: currentUserId,
          seminar_id: seminarId
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error joining seminar:', error);
      return false;
    }
  }

  // Leave a public seminar
  static async leaveSeminar(seminarId: string): Promise<boolean> {
    try {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        console.error('No authenticated user found');
        return false;
      }

      const { error } = await supabase
        .from('seminar_participants')
        .delete()
        .eq('seminar_id', seminarId)
        .eq('mentee_id', currentUserId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error leaving seminar:', error);
      return false;
    }
  }

  // Check if user is participating in a seminar
  static async isParticipatingInSeminar(seminarId: string): Promise<boolean> {
    try {
      const currentUserId = getCurrentUserId();
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