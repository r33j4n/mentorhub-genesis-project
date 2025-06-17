
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Calendar, MessageCircle, Users, Star, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    upcomingSessions: 0,
    unreadMessages: 0,
    mentorRating: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchUserRoles();
      fetchDashboardStats();
    }
  }, [user]);

  const fetchUserData = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user?.id)
      .single();

    if (data) {
      setUserProfile(data);
    }
  };

  const fetchUserRoles = async () => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role_type')
      .eq('user_id', user?.id)
      .eq('is_active', true);

    if (data) {
      setUserRoles(data.map(role => role.role_type));
    }
  };

  const fetchDashboardStats = async () => {
    // Fetch session counts
    const { count: totalSessions } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .or(`mentor_id.eq.${user?.id},mentee_id.eq.${user?.id}`);

    const { count: upcomingSessions } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .or(`mentor_id.eq.${user?.id},mentee_id.eq.${user?.id}`)
      .gte('scheduled_start', new Date().toISOString())
      .in('status', ['confirmed', 'requested']);

    setStats(prev => ({
      ...prev,
      totalSessions: totalSessions || 0,
      upcomingSessions: upcomingSessions || 0
    }));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isMentor = userRoles.includes('mentor');
  const isMentee = userRoles.includes('mentee');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">MentorHub</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {userProfile?.first_name || user?.email}
              </span>
              <div className="flex gap-2">
                {userRoles.map(role => (
                  <Badge key={role} variant="secondary">
                    {role}
                  </Badge>
                ))}
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {isMentee && (
              <Button 
                onClick={() => navigate('/find-mentors')}
                className="h-20 flex flex-col items-center justify-center"
              >
                <Users className="h-6 w-6 mb-2" />
                Find Mentors
              </Button>
            )}
            {isMentor && (
              <Button 
                onClick={() => navigate('/mentor-profile')}
                className="h-20 flex flex-col items-center justify-center"
              >
                <Star className="h-6 w-6 mb-2" />
                Manage Profile
              </Button>
            )}
            <Button 
              onClick={() => navigate('/sessions')}
              className="h-20 flex flex-col items-center justify-center"
            >
              <Calendar className="h-6 w-6 mb-2" />
              My Sessions
            </Button>
            <Button 
              onClick={() => navigate('/messages')}
              className="h-20 flex flex-col items-center justify-center"
            >
              <MessageCircle className="h-6 w-6 mb-2" />
              Messages
            </Button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingSessions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unreadMessages}</div>
            </CardContent>
          </Card>

          {isMentor && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.mentorRating.toFixed(1)}</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Role Setup Cards */}
        {userRoles.length === 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Get Started</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Become a Mentor</CardTitle>
                  <CardDescription>
                    Share your expertise and help others grow in their careers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate('/become-mentor')} className="w-full">
                    Set up Mentor Profile
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Find a Mentor</CardTitle>
                  <CardDescription>
                    Connect with experienced professionals to accelerate your growth
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate('/find-mentors')} className="w-full">
                    Browse Mentors
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
