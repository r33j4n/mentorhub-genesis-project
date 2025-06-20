
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface AdminStats {
  totalUsers: number;
  totalMentors: number;
  totalMentees: number;
  pendingMentors: number;
}

export const useAdminStats = (user: User | null) => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalMentors: 0,
    totalMentees: 0,
    pendingMentors: 0
  });

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get total mentors
      const { count: totalMentors } = await supabase
        .from('mentors')
        .select('*', { count: 'exact', head: true });

      // Get total mentees
      const { count: totalMentees } = await supabase
        .from('mentees')
        .select('*', { count: 'exact', head: true });

      // Get pending mentors
      const { count: pendingMentors } = await supabase
        .from('mentors')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false);

      setStats({
        totalUsers: totalUsers || 0,
        totalMentors: totalMentors || 0,
        totalMentees: totalMentees || 0,
        pendingMentors: pendingMentors || 0
      });
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  return { stats, loadStats };
};
