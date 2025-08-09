import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Calendar, Star, DollarSign, LogOut, TrendingUp, Clock, Video, MessageCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { UserProfileModal } from '@/components/UserProfileModal';
import { Logo } from '@/components/ui/logo';
import { NotificationBell } from '@/components/NotificationBell';
import SessionDetailsModal from '@/components/SessionDetailsModal';
import { emailService } from '@/services/emailService';


interface UserProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  bio: string;
  profile_image: string;
}

interface MentorStats {
  totalSessions: number;
  totalEarnings: number;
  averageRating: number;
  responseRate: number;
}

export default function MentorDashboard() {
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isMentor, setIsMentor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<MentorStats>({
    totalSessions: 0,
    totalEarnings: 0,
    averageRating: 0,
    responseRate: 0
  });
  const [sessions, setSessions] = useState([]);
  const [acceptedSessions, setAcceptedSessions] = useState([]);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);

  useEffect(() => {
    if (user) {
      // Add a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (loading) {
          console.log('MentorDashboard loading timeout reached, forcing completion...');
          setLoading(false);
          toast({
            title: "Loading timeout",
            description: "Please refresh the page and try again.",
            variant: "destructive"
          });
        }
      }, 8000); // 8 second timeout

      loadUserData();

      return () => clearTimeout(timeoutId);
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      console.log('Loading mentor data for user:', user.id);
      
      // Simplified role check - just check if user exists in mentors table
      const { data: mentorData, error: mentorError } = await supabase
        .from('mentors')
        .select('*')
        .eq('mentor_id', user.id)
        .single();

      console.log('Mentor data check:', { mentorData, mentorError });

      if (mentorError && mentorError.code !== 'PGRST116') {
        // Create mentor record if it doesn't exist
        console.log('Creating mentor record...');
        const { error: createMentorError } = await supabase
          .from('mentors')
          .insert({
            mentor_id: user.id,
            hourly_rate: 50,
            experience_years: 5,
            rating: 0,
            reviews_count: 0,
            is_approved: true,
            total_sessions_completed: 0,
            total_earnings: 0,
            response_rate: 0
          });

        if (createMentorError) {
          console.error('Error creating mentor record:', createMentorError);
          throw createMentorError;
        } else {
          console.log('Mentor record created successfully');
        }
      }

      setIsMentor(true);

      // Load user profile (simplified)
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('user_id, first_name, last_name, email, profile_image, bio')
        .eq('user_id', user.id)
        .single();

      console.log('Profile data:', { profile, profileError });

      if (profileError) {
        console.error('Profile error:', profileError);
        // Create basic profile if missing
        const { error: createProfileError } = await supabase
          .from('users')
          .insert({
            user_id: user.id,
            first_name: 'Mentor',
            last_name: 'User',
            email: user.email || 'mentor@example.com', // Ensure email is set
            profile_image: '',
            bio: ''
          });
        
        if (!createProfileError) {
          setUserProfile({
            user_id: user.id,
            first_name: 'Mentor',
            last_name: 'User',
            email: user.email || 'mentor@example.com',
            profile_image: '',
            bio: ''
          });
        }
      } else {
      setUserProfile(profile);
      }

      // Set basic stats
      setStats({
        totalSessions: 0,
        totalEarnings: 0,
        averageRating: 0,
        responseRate: 0
      });

      // Load requested sessions (simplified query)
      await loadRequestedSessions();
      await loadAcceptedSessions();

    } catch (error: any) {
      console.error('Error loading mentor data:', error);
      toast({
        title: "Error loading mentor dashboard",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRequestedSessions = async () => {
    try {
      console.log('Loading requested sessions...');
      
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          session_id,
          title,
          description,
          scheduled_start,
          scheduled_end,
          duration_minutes,
          final_price,
          status,
          mentee_id,
          mentees:mentee_id (
            users:mentees_mentee_id_fkey (
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('mentor_id', user?.id)
        .eq('status', 'requested')
        .order('scheduled_start', { ascending: false });

      console.log('Sessions data:', { sessionsData, sessionsError });

      if (!sessionsError && sessionsData) {
        setSessions(sessionsData);
        
        // Create test sessions if none exist
        if (sessionsData.length === 0) {
          console.log('No sessions found, creating test data...');
          await createTestSessionRequests();
        }
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadAcceptedSessions = async () => {
    try {
      console.log('Loading accepted sessions...');
      
      const { data: acceptedData, error: acceptedError } = await supabase
        .from('sessions')
        .select(`
          session_id,
          title,
          description,
          scheduled_start,
          scheduled_end,
          duration_minutes,
          final_price,
          status,
          mentee_id
        `)
        .eq('mentor_id', user?.id)
        .eq('status', 'confirmed')
        .order('scheduled_start', { ascending: false });

      console.log('Accepted sessions data:', { acceptedData, acceptedError });

      if (!acceptedError && acceptedData) {
        setAcceptedSessions(acceptedData);
      }
    } catch (error) {
      console.error('Error loading accepted sessions:', error);
    }
  };

  const handleAcceptSession = async (sessionId: string) => {
    try {
      console.log('Accepting session:', sessionId);
      
      // Update session status to confirmed
      const { error: updateError } = await supabase
        .from('sessions')
        .update({ status: 'confirmed' })
        .eq('session_id', sessionId);

      if (updateError) {
        console.error('Error accepting session:', updateError);
        toast({
          title: "Error accepting session",
          description: updateError.message,
          variant: "destructive"
        });
        return;
      }

      // Create notification for mentee
      const session = sessions.find(s => s.session_id === sessionId);
      if (session) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: session.mentee_id,
            type: 'session_booked',
            title: 'Session Confirmed!',
            content: `Your session "${session.title}" has been confirmed by your mentor.`,
            is_read: false
          });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        }

        // Send email confirmation to mentee
        if (session.mentees?.users?.email) {
          try {
            const sessionDate = new Date(session.scheduled_start).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
            
            const sessionTime = new Date(session.scheduled_start).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            });
            
            await emailService.sendSessionConfirmationEmail(
              session.mentees.users.email,
              `${session.mentees.users.first_name} ${session.mentees.users.last_name}`,
              `${userProfile?.first_name} ${userProfile?.last_name}`,
              session.title,
              sessionDate,
              sessionTime
            );

            console.log('Email confirmation sent to mentee successfully');
          } catch (emailError) {
            console.error('Error sending email confirmation:', emailError);
            // Don't fail the session acceptance if email fails
          }
        }
      }

      // Reload sessions
      await loadRequestedSessions();
      await loadAcceptedSessions();

      toast({
        title: "Session Accepted!",
        description: "The mentee has been notified of your acceptance.",
        variant: "default"
      });

    } catch (error: any) {
      console.error('Error accepting session:', error);
      toast({
        title: "Error accepting session",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeclineSession = async (sessionId: string) => {
    try {
      console.log('Declining session:', sessionId);
      
      // Update session status to cancelled
      const { error: updateError } = await supabase
        .from('sessions')
        .update({ status: 'cancelled' })
        .eq('session_id', sessionId);

      if (updateError) {
        console.error('Error declining session:', updateError);
        toast({
          title: "Error declining session",
          description: updateError.message,
          variant: "destructive"
        });
        return;
      }

      // Create notification for mentee
      const session = sessions.find(s => s.session_id === sessionId);
      if (session) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: session.mentee_id,
            type: 'system_update',
            title: 'Session Declined',
            content: `Your session "${session.title}" was declined by the mentor.`,
            is_read: false
          });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        }
      }

      // Reload sessions
      await loadRequestedSessions();

      toast({
        title: "Session Declined",
        description: "The mentee has been notified.",
        variant: "default"
      });

    } catch (error: any) {
      console.error('Error declining session:', error);
      toast({
        title: "Error declining session",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const createTestSessionRequests = async () => {
    try {
      // Create test mentee users first
      const testMentees = [
        {
          user_id: 'test-mentee-1',
          first_name: 'Alice',
          last_name: 'Johnson',
          email: 'alice@test.com',
          profile_image: '',
          bio: 'Learning React development'
        },
        {
          user_id: 'test-mentee-2',
          first_name: 'Bob',
          last_name: 'Smith',
          email: 'bob@test.com',
          profile_image: '',
          bio: 'JavaScript enthusiast'
        }
      ];

      // Insert test mentee users
      for (const mentee of testMentees) {
        await supabase.from('users').upsert(mentee);
        await supabase.from('mentees').upsert({
          mentee_id: mentee.user_id,
          career_stage: 'entry_level',
          goals: 'Learn React development'
        });
      }

      // Create test session requests
      const testSessions = [
        {
          session_id: 'test-session-1',
          mentor_id: user?.id,
          mentee_id: 'test-mentee-1',
          title: 'React Development Help',
          description: 'I need help with React hooks and state management',
          scheduled_start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          scheduled_end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
          duration_minutes: 60,
          base_price: 50,
          final_price: 50,
          commission_rate: 0.1,
          platform_fee: 5,
          status: 'requested' as const,
          session_type: 'one_on_one' as const,
          currency: 'USD'
        },
        {
          session_id: 'test-session-2',
          mentor_id: user?.id,
          mentee_id: 'test-mentee-2',
          title: 'JavaScript Fundamentals',
          description: 'Help me understand closures and async programming',
          scheduled_start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
          scheduled_end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
          duration_minutes: 90,
          base_price: 75,
          final_price: 75,
          commission_rate: 0.1,
          platform_fee: 7.5,
          status: 'requested' as const,
          session_type: 'one_on_one' as const,
          currency: 'USD'
        }
      ];

      for (const session of testSessions) {
        await supabase.from('sessions').upsert(session);
      }

      // Reload sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          *,
          mentees:mentee_id (
            users:mentee_id (
              first_name,
              last_name,
              email,
              profile_image
            )
          )
        `)
        .eq('mentor_id', user?.id)
        .eq('status', 'requested')
        .order('scheduled_start', { ascending: false });

      if (!sessionsError) {
        setSessions(sessionsData || []);
      }
    } catch (error) {
      console.error('Error creating test session requests:', error);
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading mentor dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !isMentor) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and Navigation */}
                          <div className="flex items-center space-x-8">
                <Logo size="lg" variant="default" />
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                Mentor Dashboard
              </Badge>
              
              {/* Navigation Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="ml-8">
                <TabsList className="bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md transition-all px-4 py-2">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="sessions" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md transition-all px-4 py-2">
                    <Calendar className="h-4 w-4 mr-2" />
                    Sessions
                  </TabsTrigger>
                  <TabsTrigger value="requested" className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md transition-all px-4 py-2">
                    <Users className="h-4 w-4 mr-2" />
                    Requests
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* Right side - User Info */}
            <div className="flex items-center space-x-4">
              <NotificationBell />
              {userProfile && (
                <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-4 py-2">
                  <Avatar className="h-8 w-8 border-2 border-white cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setShowProfileEdit(true)}>
                    <AvatarImage src={userProfile.profile_image} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm">
                      {userProfile.first_name[0]}{userProfile.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-gray-900 text-sm">
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

      <div className="px-4 py-8">
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, {userProfile?.first_name}! 👋
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Here's what's happening with your mentoring business today.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Active Mentor
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Available for Sessions
                  </Badge>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Sessions</CardTitle>
                  <Calendar className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{stats.totalSessions}</div>
                  <p className="text-xs text-gray-500 mt-1">Completed sessions</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">${stats.totalEarnings}</div>
                  <p className="text-xs text-gray-500 mt-1">Lifetime earnings</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Average Rating</CardTitle>
                  <Star className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</div>
                  <p className="text-xs text-gray-500 mt-1">Out of 5 stars</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Response Rate</CardTitle>
                  <Users className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{stats.responseRate.toFixed(1)}%</div>
                  <p className="text-xs text-gray-500 mt-1">Session requests</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white">
                    <Calendar className="h-4 w-4 mr-2" />
                    Set Your Availability
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Video className="h-4 w-4 mr-2" />
                    Join Next Session
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    View Messages
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">New session request</p>
                        <p className="text-xs text-gray-500">From John Doe - React Development</p>
                      </div>
                      <span className="text-xs text-gray-400">2h ago</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Session completed</p>
                        <p className="text-xs text-gray-500">JavaScript Fundamentals - $75 earned</p>
                      </div>
                      <span className="text-xs text-gray-400">1d ago</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">New review received</p>
                        <p className="text-xs text-gray-500">5 stars - "Great mentor!"</p>
                      </div>
                      <span className="text-xs text-gray-400">2d ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "sessions" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Sessions</h2>
                <p className="text-gray-600">Manage your upcoming and completed sessions</p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Session
              </Button>
            </div>

            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  All Sessions ({acceptedSessions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {acceptedSessions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sessions Yet</h3>
                    <p className="text-gray-600 mb-4">
                      You haven't completed any sessions yet. Start by accepting session requests from mentees.
                    </p>
                    <Button variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                      <Users className="h-4 w-4 mr-2" />
                      View Requests
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {acceptedSessions.map((session: any) => (
                      <div 
                        key={session.session_id} 
                        className="flex items-center justify-between p-6 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleSessionClick(session)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Video className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{session.title || 'Mentoring Session'}</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(session.scheduled_start).toLocaleDateString()} at {new Date(session.scheduled_start).toLocaleTimeString()}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Confirmed
                              </Badge>
                              <span className="text-sm text-gray-500">${session.final_price}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <Video className="h-4 w-4 mr-2" />
                            Join Session
                          </Button>
                          <Button variant="outline" size="sm">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "requested" && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
              <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Requested Sessions ({sessions.length})
              </CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg">No requested sessions yet</p>
                    <p className="text-gray-400 text-sm mt-2">Requested sessions from mentees will appear here</p>
                  </div>
                ) : (
                <div className="space-y-4">
                    {sessions.map((session: any) => (
                    <Card 
                      key={session.session_id} 
                      className="border border-gray-200 hover:border-green-300 transition-colors cursor-pointer"
                      onClick={() => handleSessionClick(session)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={session.mentees?.users?.profile_image} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                {session.mentees?.users?.first_name?.[0]}{session.mentees?.users?.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900">
                              {session.mentees?.users?.first_name} {session.mentees?.users?.last_name}
                                </h3>
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                  New Request
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{session.mentees?.users?.email}</p>
                              <h4 className="font-medium text-gray-900 mb-2">{session.title || 'Mentoring Session'}</h4>
                              <p className="text-sm text-gray-600 mb-3">{session.description}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(session.scheduled_start).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {new Date(session.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  ${session.final_price}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {session.duration_minutes} min
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleAcceptSession(session.session_id)}
                            >
                              Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => handleDeclineSession(session.session_id)}
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
        )}


      </div>

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <UserProfileModal
          userType="mentor"
          onClose={() => setShowProfileEdit(false)}
          onProfileUpdated={() => {
            loadUserData();
            setShowProfileEdit(false);
          }}
        />
      )}

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
