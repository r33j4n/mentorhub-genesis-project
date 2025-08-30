import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Calendar, Star, DollarSign, LogOut, TrendingUp, Clock, Video, MessageCircle, BookOpen, RefreshCw } from 'lucide-react';
import { ManageSeminarsList } from '@/components/ManageSeminarsList';
import { IdeasList } from '@/components/IdeasList';
import { MentorIdeaContacts } from '@/components/MentorIdeaContacts';

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
  // Version identifier to help with cache debugging
  console.log('MentorDashboard version: 2024-01-15-v3');
  
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
      }, 5000); // Reduced from 8 seconds to 5 seconds

      loadUserData();

      return () => clearTimeout(timeoutId);
    }
  }, [user]);

  const loadUserData = async (retryCount = 0) => {
    if (!user) return;

    const maxRetries = 2;

    try {
      console.log(`Loading mentor data for user: ${user.id} (attempt ${retryCount + 1})`);
      
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
          // Don't throw error, just log it and continue
        } else {
          console.log('Mentor record created successfully');
        }
      }

      setIsMentor(true);

      // Load user profile with timeout
      try {
        const profilePromise = supabase
          .from('users')
          .select('user_id, first_name, last_name, email, profile_image, bio')
          .eq('user_id', user.id)
          .single();

        const result = await Promise.race([
          profilePromise,
          new Promise<{ data: null; error: Error }>((_, reject) => 
            setTimeout(() => reject(new Error('Profile query timeout')), 3000)
          )
        ]);

        const { data: profile, error: profileError } = result;

        console.log('Profile data:', { profile, profileError });

        if (profileError) {
          console.error('Profile error:', profileError);
          // Create basic profile if missing
          const { error: createProfileError } = await supabase
            .from('users')
            .insert({
              user_id: user.id,
              first_name: user.user_metadata?.first_name || 'Mentor',
              last_name: user.user_metadata?.last_name || 'User',
              email: user.email || 'mentor@example.com',
              profile_image: '',
              bio: ''
            });
          
          if (!createProfileError) {
            setUserProfile({
              user_id: user.id,
              first_name: user.user_metadata?.first_name || 'Mentor',
              last_name: user.user_metadata?.last_name || 'User',
              email: user.email || 'mentor@example.com',
              profile_image: '',
              bio: ''
            });
          }
        } else {
          setUserProfile(profile);
        }
      } catch (profileTimeoutError) {
        console.error('Profile query timed out:', profileTimeoutError);
        // Set default profile data
        setUserProfile({
          user_id: user.id,
          first_name: user.user_metadata?.first_name || 'Mentor',
          last_name: user.user_metadata?.last_name || 'User',
          email: user.email || 'mentor@example.com',
          profile_image: '',
          bio: ''
        });
      }

      // Load sessions with timeout
      try {
        await Promise.race([
          loadSessions(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Sessions query timeout')), 4000)
          )
        ]);
      } catch (sessionsTimeoutError) {
        console.error('Sessions query timed out:', sessionsTimeoutError);
        // Set empty sessions array as fallback
        setSessions([]);
        setAcceptedSessions([]);
      }

      // Load accepted sessions with timeout
      try {
        await Promise.race([
          loadAcceptedSessions(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Accepted sessions query timeout')), 3000)
          )
        ]);
      } catch (acceptedSessionsTimeoutError) {
        console.error('Accepted sessions query timed out:', acceptedSessionsTimeoutError);
        // Keep existing accepted sessions or set empty array
        if (acceptedSessions.length === 0) {
          setAcceptedSessions([]);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error(`Error in loadUserData (attempt ${retryCount + 1}):`, error);
      
      // Retry logic
      if (retryCount < maxRetries) {
        console.log(`Retrying in 2 seconds... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          loadUserData(retryCount + 1);
        }, 2000);
        return;
      }
      
      // Final fallback after all retries
      setLoading(false);
      toast({
        title: "Connection issue",
        description: "Unable to load data. Please check your connection and refresh the page.",
        variant: "destructive"
      });
    }
  };

  const loadSessions = async () => {
    try {
      console.log('=== loadSessions called ===');
      console.log('Loading requested sessions for mentor:', user?.id);
      
      // Use a simpler query to avoid timeouts
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          id,
          title,
          description,
          scheduled_start,
          scheduled_end,
          duration_minutes,
          final_price,
          status,
          mentor_id,
          mentee_id
        `)
        .eq('mentor_id', user?.id)
        .eq('status', 'requested')
        .order('scheduled_start', { ascending: false })
        .limit(10); // Limit to prevent large queries

      console.log('Sessions query result:', { sessionsData, sessionsError });

      if (!sessionsError && sessionsData) {
        setSessions(sessionsData);
        console.log('Loaded requested sessions:', sessionsData.length);
      } else if (sessionsError) {
        console.error('Error loading requested sessions:', sessionsError);
        // Don't show toast for session loading errors, just log them
        setSessions([]);
      } else {
        setSessions([]);
      }

      // Debug: Check all sessions for this mentor (simplified)
      const { data: allSessions, error: allSessionsError } = await supabase
        .from('sessions')
        .select('id, mentor_id, mentee_id, status, title')
        .eq('mentor_id', user?.id)
        .limit(5); // Limit for debugging
      
      console.log('All sessions for mentor:', allSessions, 'Error:', allSessionsError);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessions([]);
    }
  };

  const loadAcceptedSessions = async () => {
    try {
      console.log('Loading accepted sessions...');
      
      const { data: acceptedData, error: acceptedError } = await supabase
        .from('sessions')
        .select(`
          id,
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
        .order('scheduled_start', { ascending: false })
        .limit(10); // Limit to prevent large queries

      console.log('Accepted sessions data:', { acceptedData, acceptedError });

      if (!acceptedError && acceptedData) {
        setAcceptedSessions(acceptedData);
      } else {
        setAcceptedSessions([]);
      }
    } catch (error) {
      console.error('Error loading accepted sessions:', error);
      setAcceptedSessions([]);
    }
  };

  const handleAcceptSession = async (sessionId: string) => {
    try {
      console.log('Accepting session:', sessionId);
      
      // Update session status to confirmed
      const { error: updateError } = await supabase
        .from('sessions')
        .update({ status: 'confirmed' })
        .eq('id', sessionId);

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
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: session.mentee_id,
            type: 'session_booked',
            title: 'Session Confirmed!',
            message: `Your session "${session.title}" has been confirmed by your mentor.`,
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
      await loadSessions();
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
        .eq('id', sessionId);

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
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: session.mentee_id,
            type: 'system_update',
            title: 'Session Declined',
            message: `Your session "${session.title}" was declined by the mentor.`,
            is_read: false
          });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        }
      }

      // Reload sessions
      await loadSessions();

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
          id: 'test-session-1',
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
          id: 'test-session-2',
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
            users:user_id (
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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "requested") {
      loadSessions();
    } else if (tab === "sessions") {
      loadAcceptedSessions();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-sunshine-yellow mx-auto mb-4"></div>
          <p className="text-gray-600">Loading mentor dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !isMentor) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Integrated Navigation */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <Logo size="lg" variant="gradient" />
              <Badge variant="secondary" className="bg-brand-sunshine-yellow text-brand-charcoal px-3 py-1">
                Mentor
              </Badge>
            </div>
            
            {/* Center - Navigation Buttons */}
            <div className="flex items-center space-x-1">
              <Button 
                variant={activeTab === "overview" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => handleTabChange("overview")}
                className={activeTab === "overview" ? "bg-brand-sunshine-yellow text-brand-charcoal" : "text-brand-dark-grey hover:text-brand-charcoal"}
              >
                Overview
              </Button>
              <Button 
                variant={activeTab === "sessions" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => handleTabChange("sessions")}
                className={activeTab === "sessions" ? "bg-brand-sunshine-yellow text-brand-charcoal" : "text-brand-dark-grey hover:text-brand-charcoal"}
              >
                Sessions
              </Button>
              <Button 
                variant={activeTab === "requested" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => handleTabChange("requested")}
                className={activeTab === "requested" ? "bg-brand-sunshine-yellow text-brand-charcoal" : "text-brand-dark-grey hover:text-brand-charcoal"}
              >
                Requests
              </Button>
              <Button 
                variant={activeTab === "seminars" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => handleTabChange("seminars")}
                className={activeTab === "seminars" ? "bg-brand-sunshine-yellow text-brand-charcoal" : "text-brand-dark-grey hover:text-brand-charcoal"}
              >
                Public Seminars
              </Button>
              <Button 
                variant={activeTab === "ideas" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => handleTabChange("ideas")}
                className={activeTab === "ideas" ? "bg-brand-sunshine-yellow text-brand-charcoal" : "text-brand-dark-grey hover:text-brand-charcoal"}
              >
                Business Ideas
              </Button>
            </div>
            
            {/* Right side - User Info */}
            <div className="flex items-center space-x-4">
              <NotificationBell />
              {userProfile && (
                <Avatar className="h-8 w-8 cursor-pointer" onClick={() => setShowProfileEdit(true)}>
                  <AvatarImage src={userProfile.profile_image} />
                  <AvatarFallback className="bg-gray-200 text-gray-700">
                    {userProfile.first_name[0]}{userProfile.last_name[0]}
                  </AvatarFallback>
                </Avatar>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-brand-dark-grey hover:text-brand-charcoal">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-8">
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Welcome Section */}
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {userProfile?.first_name}!</h1>
                <p className="text-gray-600 text-base">Here's what's happening with your mentoring business today.</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{stats.totalSessions}</div>
                <div className="text-gray-600 text-sm">Total sessions</div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white border border-brand-dark-grey shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-brand-sunshine-yellow rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-brand-charcoal" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-brand-charcoal mb-1">{stats.totalSessions}</div>
                  <p className="text-sm text-brand-dark-grey">Total sessions</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-brand-dark-grey shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-brand-sunshine-yellow rounded-lg flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-brand-charcoal" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-brand-charcoal mb-1">${stats.totalEarnings}</div>
                  <p className="text-sm text-brand-dark-grey">Total earnings</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-brand-dark-grey shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-brand-sunshine-yellow rounded-lg flex items-center justify-center">
                      <Star className="h-5 w-5 text-brand-charcoal" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-brand-charcoal mb-1">{stats.averageRating.toFixed(1)}</div>
                  <p className="text-sm text-brand-dark-grey">Average rating</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-brand-dark-grey shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-brand-sunshine-yellow rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-brand-charcoal" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-brand-charcoal mb-1">{stats.responseRate.toFixed(1)}%</div>
                  <p className="text-sm text-brand-dark-grey">Response rate</p>
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
                  <Button className="w-full justify-start bg-brand-charcoal hover:bg-gray-800 text-white">
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
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    console.log('Refreshing sessions...');
                    loadAcceptedSessions();
                    toast({
                      title: "Refreshing sessions",
                      description: "Loading latest session data...",
                    });
                  }}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button className="bg-brand-charcoal hover:bg-gray-800">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Session
                </Button>
              </div>
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
                        key={session.id} 
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
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
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

        {activeTab === "seminars" && (
          <div className="space-y-6">
            <ManageSeminarsList className="card-elevated" />
          </div>
        )}

        {activeTab === "ideas" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Business Ideas Marketplace</h1>
                <p className="text-gray-600 text-base">Discover and invest in innovative business ideas from mentees</p>
              </div>
            </div>
            
            <Tabs defaultValue="browse" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="browse">Browse Ideas</TabsTrigger>
                <TabsTrigger value="contacts">My Contacts</TabsTrigger>
              </TabsList>
              <TabsContent value="browse" className="mt-6">
                <IdeasList isMentee={false} />
              </TabsContent>
              <TabsContent value="contacts" className="mt-6">
                <MentorIdeaContacts />
              </TabsContent>
            </Tabs>
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
                      key={session.id} 
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
                              onClick={() => handleAcceptSession(session.id)}
                            >
                              Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => handleDeclineSession(session.id)}
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
