
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Calendar, Search, LogOut, BookOpen, Target, TrendingUp } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { MentorDiscovery } from '@/components/MentorDiscovery';

interface UserProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  bio: string;
  profile_image: string;
}

interface MenteeStats {
  totalSessions: number;
  completedSessions: number;
  activeMentors: number;
  goalProgress: number;
}

export default function MenteeDashboard() {
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isMentee, setIsMentee] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MenteeStats>({
    totalSessions: 0,
    completedSessions: 0,
    activeMentors: 0,
    goalProgress: 0
  });
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Check if user is a mentee
      const { data: menteeRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role_type')
        .eq('user_id', user.id)
        .eq('role_type', 'mentee')
        .single();

      if (roleError && roleError.code !== 'PGRST116') throw roleError;
      
      if (!menteeRole) {
        setLoading(false);
        return;
      }

      setIsMentee(true);

      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profile);

      // Load sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          *,
          mentors:mentor_id (
            users:mentor_id (first_name, last_name)
          )
        `)
        .eq('mentee_id', user.id)
        .order('scheduled_start', { ascending: false })
        .limit(10);

      if (!sessionsError) {
        setSessions(sessionsData || []);
        
        // Calculate stats
        const totalSessions = sessionsData?.length || 0;
        const completedSessions = sessionsData?.filter(s => s.status === 'completed').length || 0;
        const uniqueMentors = new Set(sessionsData?.map(s => s.mentor_id)).size;
        
        setStats({
          totalSessions,
          completedSessions,
          activeMentors: uniqueMentors,
          goalProgress: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0
        });
      }
    } catch (error: any) {
      console.error('Error loading mentee data:', error);
      toast({
        title: "Error loading mentee dashboard",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading mentee dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !isMentee) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Mentee Dashboard
              </h1>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                Mentee
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              {userProfile && (
                <div className="flex items-center space-x-3 bg-white/50 rounded-full px-4 py-2">
                  <Avatar className="h-10 w-10 border-2 border-white">
                    <AvatarImage src={userProfile.profile_image} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {userProfile.first_name[0]}{userProfile.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-gray-900">
                    {userProfile.first_name} {userProfile.last_name}
                  </span>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleSignOut} className="hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-lg">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all">
              <TrendingUp className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="discover" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all">
              <Search className="h-4 w-4 mr-2" />
              Find Mentors
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all">
              <Calendar className="h-4 w-4 mr-2" />
              My Sessions
            </TabsTrigger>
            <TabsTrigger value="goals" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all">
              <Target className="h-4 w-4 mr-2" />
              Goals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                  <Calendar className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalSessions}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
                  <BookOpen className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.completedSessions}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Mentors</CardTitle>
                  <Users className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.activeMentors}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Goal Progress</CardTitle>
                  <Target className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.goalProgress.toFixed(0)}%</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Sessions */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Calendar className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg">No sessions yet</p>
                    <p className="text-gray-400 text-sm mt-2">Book your first session to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.slice(0, 5).map((session: any) => (
                      <div key={session.session_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div>
                          <h4 className="font-medium text-gray-900">{session.title || 'Mentoring Session'}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(session.scheduled_start).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={
                          session.status === 'completed' ? 'default' :
                          session.status === 'confirmed' ? 'secondary' :
                          session.status === 'cancelled' ? 'destructive' : 'outline'
                        }>
                          {session.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discover">
            <MentorDiscovery />
          </TabsContent>

          <TabsContent value="sessions">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>All Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No sessions yet</p>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session: any) => (
                      <div key={session.session_id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h3 className="font-semibold">{session.title || 'Mentoring Session'}</h3>
                            <p className="text-gray-600">{session.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>{new Date(session.scheduled_start).toLocaleString()}</span>
                              <span>{session.duration_minutes} minutes</span>
                              <span>${session.final_price}</span>
                            </div>
                          </div>
                          <Badge variant={
                            session.status === 'completed' ? 'default' :
                            session.status === 'confirmed' ? 'secondary' :
                            session.status === 'cancelled' ? 'destructive' : 'outline'
                          }>
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Learning Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-8">Goal tracking coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
