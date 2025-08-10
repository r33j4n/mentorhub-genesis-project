import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
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
import { Logo } from '@/components/ui/logo';
import SessionDetailsModal from '@/components/SessionDetailsModal';

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
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);

  useEffect(() => {
    if (user) {
      // Add a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (loading) {
          console.log('Loading timeout reached, forcing completion...');
          setLoading(false);
          toast({
            title: "Loading timeout",
            description: "Please refresh the page and try again.",
            variant: "destructive"
          });
        }
      }, 5000); // Reduced to 5 second timeout

      loadUserData();

      return () => clearTimeout(timeoutId);
    } else {
      // If no user, set loading to false immediately
      setLoading(false);
    }
  }, [user, loading]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      console.log('Loading user data for user:', user.id);
      
      // Load user profile with timeout
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const result = await Promise.race([
        profilePromise,
        new Promise<{ data: any; error: any }>((_, reject) => 
          setTimeout(() => reject(new Error('Profile load timeout')), 3000)
        )
      ]);

      const { data: profile, error: profileError } = result;

      console.log('Profile data:', { profile, profileError });

      if (profileError) {
        console.error('Profile error:', profileError);
        // If profile doesn't exist, create it
        if (profileError.code === 'PGRST116') {
          console.log('Creating missing user profile...');
          const { error: createProfileError } = await supabase
            .from('users')
            .insert({
              user_id: user.id,
              first_name: user.user_metadata?.first_name || 'User',
              last_name: user.user_metadata?.last_name || 'Name',
              email: user.email || '',
              bio: '',
              profile_image: ''
            });

          if (createProfileError) {
            console.error('Error creating profile:', createProfileError);
            throw createProfileError;
          } else {
            console.log('User profile created successfully');
            // Reload the profile
            const { data: newProfile, error: newProfileError } = await supabase
              .from('users')
              .select('*')
              .eq('user_id', user.id)
              .single();

            if (newProfileError) throw newProfileError;
            setUserProfile(newProfile);
          }
        } else {
          throw profileError;
        }
      } else {
        setUserProfile(profile);
      }

      // Load user roles - filter to only include valid roles and map to UserRole type
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role_type')
        .eq('user_id', user.id)
        .in('role_type', ['mentor', 'mentee', 'admin']);

      console.log('Roles data:', { roles, rolesError });

      if (rolesError) {
        console.error('Roles error:', rolesError);
        throw rolesError;
      }
      
      // Filter and map to ensure only valid role types
      const validRoles: UserRole[] = (roles || [])
        .filter(role => ['mentor', 'mentee', 'admin'].includes(role.role_type))
        .map(role => ({ role_type: role.role_type as 'mentor' | 'mentee' | 'admin' }));
      
      console.log('Valid roles:', validRoles);

      // If no roles exist, create a default mentee role
      if (validRoles.length === 0) {
        console.log('No roles found, creating default mentee role...');
        const { error: createRoleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role_type: 'mentee'
          });

        if (createRoleError) {
          console.error('Error creating default role:', createRoleError);
        } else {
          console.log('Default mentee role created');
          validRoles.push({ role_type: 'mentee' });
        }
      }

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
        .order('scheduled_start', { ascending: false })
        .limit(5);

      if (!sessionsError) {
        setSessions(sessionsData || []);
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

  const handleSessionClick = (session: any) => {
    setSelectedSession(session);
    setShowSessionDetails(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Dashboard...</h2>
          <p className="text-gray-500 mb-4">Setting up your personalized experience</p>
          <div className="flex space-x-2 justify-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  // If no user, redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user has no profile or roles, show profile setup
  if (!userProfile || userRoles.length === 0) {
    console.log('User has no profile or roles, showing profile setup...');
    return <ProfileSetup />;
  }

  const isMentor = userRoles.some(role => role.role_type === 'mentor');
  const isMentee = userRoles.some(role => role.role_type === 'mentee');

  console.log('Role detection:', { isMentor, isMentee, userRoles });

  // Redirect to role-specific dashboards
  if (isMentee) {
    console.log('Redirecting to mentee dashboard...');
    return <Navigate to="/mentee-dashboard" replace />;
  }
  
  if (isMentor) {
    console.log('Redirecting to mentor dashboard...');
    return <Navigate to="/mentor-dashboard" replace />;
  }

  console.log('No specific role detected, showing general dashboard...');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6">
                <Logo size="xl" variant="gradient" />
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

      <div className="px-4 py-8">
        <Tabs defaultValue={isMentee ? "discover" : "overview"} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-lg">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg transition-all">
              <Calendar className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            {isMentee && (
                              <TabsTrigger value="discover" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg transition-all">
                <Search className="h-4 w-4 mr-2" />
                Find Mentors
              </TabsTrigger>
            )}
                            <TabsTrigger value="sessions" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg transition-all">
              <Users className="h-4 w-4 mr-2" />
              Sessions
            </TabsTrigger>
                            <TabsTrigger value="profile" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg transition-all">
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
                      <div 
                        key={session.session_id} 
                        className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleSessionClick(session)}
                      >
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

      {/* Session Details Modal */}
      {showSessionDetails && selectedSession && (
        <SessionDetailsModal
          session={selectedSession}
          isOpen={showSessionDetails}
          onClose={() => {
            setShowSessionDetails(false);
            setSelectedSession(null);
          }}
        />
      )}
    </div>
  );
}
