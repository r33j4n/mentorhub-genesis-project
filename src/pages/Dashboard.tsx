import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ProfileSetup } from '@/components/ProfileSetup';
import { MentorDiscovery } from '@/components/MentorDiscovery';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Calendar, Star, DollarSign, LogOut, Search, User } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface UserProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  bio: string;
  profile_image: string;
}

interface UserRole {
  role_type: 'mentor' | 'mentee' | 'admin';
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [requestedSessions, setRequestedSessions] = useState([]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profile);

      // Load user roles - filter to only include valid roles and map to UserRole type
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role_type')
        .eq('user_id', user.id)
        .in('role_type', ['mentor', 'mentee', 'admin']);

      if (rolesError) throw rolesError;
      
      // Filter and map to ensure only valid role types
      const validRoles: UserRole[] = (roles || [])
        .filter(role => ['mentor', 'mentee', 'admin'].includes(role.role_type))
        .map(role => ({ role_type: role.role_type as 'mentor' | 'mentee' | 'admin' }));
      
      setUserRoles(validRoles);

      // Load sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          *,
          mentors:mentor_id (
            users:mentor_id (first_name, last_name)
          ),
          mentees:mentee_id (
            users:mentee_id (first_name, last_name)
          )
        `)
        .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
        .order('scheduled_start', { ascending: false });

      if (!sessionsError) {
        setSessions(sessionsData || []);
        // For mentors, filter requested sessions
        if (validRoles.some(role => role.role_type === 'mentor')) {
          setRequestedSessions((sessionsData || []).filter((s: any) => s.status === 'requested' && s.mentor_id === user.id));
        } else {
          setRequestedSessions([]);
        }
      }
    } catch (error: any) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error loading profile",
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
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If user has no profile or roles, show profile setup
  if (!userProfile || userRoles.length === 0) {
    return <ProfileSetup />;
  }

  const isMentor = userRoles.some(role => role.role_type === 'mentor');
  const isMentee = userRoles.some(role => role.role_type === 'mentee');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                MentorHub
              </h1>
              <div className="flex space-x-2">
                {userRoles.map((role) => (
                  <Badge key={role.role_type} variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                    {role.role_type.charAt(0).toUpperCase() + role.role_type.slice(1)}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-white/50 rounded-full px-4 py-2">
                <Avatar className="h-10 w-10 border-2 border-white">
                  <AvatarImage src={userProfile.profile_image} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {userProfile.first_name[0]}{userProfile.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-gray-900">
                  {userProfile.first_name} {userProfile.last_name}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue={isMentee ? "discover" : "overview"} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-lg">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all">
              <Calendar className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            {isMentee && (
              <TabsTrigger value="discover" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all">
                <Search className="h-4 w-4 mr-2" />
                Find Mentors
              </TabsTrigger>
            )}
            <TabsTrigger value="sessions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all">
              <Users className="h-4 w-4 mr-2" />
              Sessions
            </TabsTrigger>
            {isMentor && (
              <TabsTrigger value="requested" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white rounded-lg transition-all">
                <Users className="h-4 w-4 mr-2" />
                Requested Sessions
              </TabsTrigger>
            )}
            <TabsTrigger value="profile" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all">
              <User className="h-4 w-4 mr-2" />
              Profile
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
                  <div className="text-2xl font-bold text-gray-900">{sessions.length}</div>
                </CardContent>
              </Card>
              
              {isMentor && (
                <>
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Rating</CardTitle>
                      <Star className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">4.8</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">$2,345</div>
                    </CardContent>
                  </Card>
                </>
              )}
              
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                  <Users className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">12</div>
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
                    <p className="text-gray-400 text-sm mt-2">Your upcoming sessions will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.slice(0, 5).map((session: any) => (
                      <div key={session.session_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div>
                          <h4 className="font-medium text-gray-900">{session.title}</h4>
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

          {isMentee && (
            <TabsContent value="discover">
              <MentorDiscovery />
            </TabsContent>
          )}

          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle>All Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No sessions yet</p>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session: any) => (
                      <div key={session.session_id} className={`border rounded-lg p-4 ${session.status === 'requested' && isMentor ? 'bg-yellow-50 border-yellow-400' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h3 className="font-semibold">{session.title}</h3>
                            <p className="text-gray-600">{session.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>{new Date(session.scheduled_start).toLocaleString()}</span>
                              <span>{session.duration_minutes} minutes</span>
                              <span>${session.final_price}</span>
                            </div>
                          </div>
                          <Badge variant={
                            session.status === 'requested' && isMentor ? 'outline' :
                            session.status === 'completed' ? 'default' :
                            session.status === 'confirmed' ? 'secondary' :
                            session.status === 'cancelled' ? 'destructive' : 'outline'
                          }
                          className={session.status === 'requested' && isMentor ? 'bg-yellow-200 text-yellow-800 border-yellow-400' : ''}
                          >
                            {session.status === 'requested' && isMentor ? 'Requested' : session.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requested">
            <Card>
              <CardHeader>
                <CardTitle>Requested Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {requestedSessions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No requested sessions</p>
                ) : (
                  <div className="space-y-4">
                    {requestedSessions.map((session: any) => (
                      <div key={session.session_id} className="border rounded-lg p-4 bg-yellow-50">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h3 className="font-semibold">{session.title}</h3>
                            <p className="text-gray-600">{session.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>{new Date(session.scheduled_start).toLocaleString()}</span>
                              <span>{session.duration_minutes} minutes</span>
                              <span>${session.final_price}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-yellow-200 text-yellow-800 border-yellow-400">Requested</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={userProfile.profile_image} />
                    <AvatarFallback className="text-2xl">
                      {userProfile.first_name[0]}{userProfile.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {userProfile.first_name} {userProfile.last_name}
                    </h3>
                    <p className="text-gray-600">{user?.email}</p>
                    <div className="flex space-x-2 mt-2">
                      {userRoles.map((role) => (
                        <Badge key={role.role_type} variant="secondary">
                          {role.role_type.charAt(0).toUpperCase() + role.role_type.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                {userProfile.bio && (
                  <div>
                    <h4 className="font-medium mb-2">Bio</h4>
                    <p className="text-gray-600">{userProfile.bio}</p>
                  </div>
                )}
                
                <Button variant="outline">Edit Profile</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
