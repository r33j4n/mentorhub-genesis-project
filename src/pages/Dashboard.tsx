
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
import { Users, Calendar, Star, DollarSign, LogOut } from 'lucide-react';
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

      // Load user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role_type')
        .eq('user_id', user.id);

      if (rolesError) throw rolesError;
      setUserRoles(roles || []);

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
        .order('scheduled_start', { ascending: false })
        .limit(5);

      if (!sessionsError) {
        setSessions(sessionsData || []);
      }
    } catch (error: any) {
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">MentorHub</h1>
              <div className="flex space-x-2">
                {userRoles.map((role) => (
                  <Badge key={role.role_type} variant="secondary">
                    {role.role_type.charAt(0).toUpperCase() + role.role_type.slice(1)}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userProfile.profile_image} />
                  <AvatarFallback>
                    {userProfile.first_name[0]}{userProfile.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">
                  {userProfile.first_name} {userProfile.last_name}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue={isMentee ? "discover" : "overview"} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {isMentee && <TabsTrigger value="discover">Find Mentors</TabsTrigger>}
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sessions.length}</div>
                </CardContent>
              </Card>
              
              {isMentor && (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Rating</CardTitle>
                      <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">4.8</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">$2,345</div>
                    </CardContent>
                  </Card>
                </>
              )}
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No sessions yet</p>
                ) : (
                  <div className="space-y-3">
                    {sessions.slice(0, 5).map((session: any) => (
                      <div key={session.session_id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{session.title}</h4>
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
                      <div key={session.session_id} className="border rounded-lg p-4">
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
