
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Users, Calendar, Search, LogOut, BookOpen, Target, TrendingUp, Star, Clock, DollarSign, ArrowUpRight, MessageCircle, CheckCircle, Video, XCircle, Eye, BookOpen as BookOpenIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { MentorDiscovery } from '@/components/MentorDiscovery';
import { UserProfileModal } from '@/components/UserProfileModal';
import { MentorAvailabilityViewer } from '@/components/MentorAvailabilityViewer';
import { ZoomMeeting } from '@/components/ZoomMeeting';
import { Logo } from '@/components/ui/logo';
import { NotificationBell } from '@/components/NotificationBell';
import { MentorProfileModal } from '@/components/MentorProfileModal';
import SessionDetailsModal from '@/components/SessionDetailsModal';
import { PublicSeminarsList } from '@/components/PublicSeminarsList';
import { ReservedSeminarsList } from '@/components/ReservedSeminarsList';
import { SeminarsSidebarLayout } from '@/components/SeminarsSidebarLayout';
import { SessionsSidebarLayout } from '@/components/SessionsSidebarLayout';
import { FloatingMentorChatbot } from '@/components/FloatingMentorChatbot';
import { IdeasList } from '@/components/IdeasList';
import { IdeaContactsManager } from '@/components/IdeaContactsManager';


interface UserProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  profile_image: string;
}

interface Mentor {
  mentor_id: string;
  hourly_rate: number;
  rating: number;
  total_sessions_completed: number;
  experience_years?: number;
  reviews_count?: number;
  is_approved: boolean;
  created_at: string;
  users: {
    first_name: string;
    last_name: string;
    email: string;
    profile_image: string;
    bio?: string;
    timezone?: string;
  } | null;
  mentor_expertise: Array<{
    area_id: string;
    expertise_areas: {
      id: string;
      name: string;
      description: string;
    };
  }>;
}

interface MenteeStats {
  totalSessions: number;
  completedSessions: number;
  activeMentors: number;
  goalProgress: number;
  totalSpent: number;
  averageRating: number;
  upcomingSessions: number;
  pendingSessions: number;
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
    goalProgress: 0,
    totalSpent: 0,
    averageRating: 0,
    upcomingSessions: 0,
    pendingSessions: 0
  });
  const [sessions, setSessions] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [acceptedSessions, setAcceptedSessions] = useState([]);
  const [rejectedSessions, setRejectedSessions] = useState([]);
  const [pendingSessions, setPendingSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isZoomMeetingOpen, setIsZoomMeetingOpen] = useState(false);
  const [expertiseAreas, setExpertiseAreas] = useState<Array<{id: string, name: string, description: string}>>([]);
  const [showMentorProfileModal, setShowMentorProfileModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);

  useEffect(() => {
    if (user) {
      // Add a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (loading) {
          console.log('MenteeDashboard loading timeout reached, forcing completion...');
          setLoading(false);
          toast({
            title: "Loading timeout",
            description: "Please refresh the page and try again.",
            variant: "destructive"
          });
        }
      }, 8000); // 8 second timeout (reduced from 10)

      loadUserData();
      loadExpertiseAreas();
      loadMenteeSessions();

      return () => clearTimeout(timeoutId);
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      console.log('Loading mentee data for user:', user.id);
      
      // Simplified role check - just check if user exists in mentees table
      const { data: menteeData, error: menteeError } = await supabase
        .from('mentees')
        .select('mentee_id')
        .eq('mentee_id', user.id)
        .single();

      console.log('Mentee data check:', { menteeData, menteeError });

      if (menteeError && menteeError.code !== 'PGRST116') {
        // Create mentee record if it doesn't exist
        console.log('Creating mentee record...');
        const { error: createMenteeError } = await supabase
          .from('mentees')
          .insert({
            mentee_id: user.id,
            career_stage: 'entry_level',
            goals: 'Learn and grow'
          });

        if (createMenteeError) {
          console.error('Error creating mentee record:', createMenteeError);
          throw createMenteeError;
        } else {
          console.log('Mentee record created successfully');
        }
      }

      setIsMentee(true);

      // Load user profile (simplified)
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('user_id, first_name, last_name, profile_image')
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
            first_name: 'Mentee',
            last_name: 'User',
            email: user.email || 'mentee@example.com',
            profile_image: ''
          });
        
        if (!createProfileError) {
          setUserProfile({
            user_id: user.id,
            first_name: 'Mentee',
            last_name: 'User',
            profile_image: ''
          });
        }
      } else {
        setUserProfile(profile);
      }

      // Set basic stats (simplified)
      setStats({
        totalSessions: 0,
        completedSessions: 0,
        activeMentors: 0,
        goalProgress: 0,
        totalSpent: 0,
        averageRating: 0,
        upcomingSessions: 0,
        pendingSessions: 0
      });

      // Load sessions (simplified query)
      await loadUserSessions();

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

  const loadExpertiseAreas = async () => {
    try {
      const { data, error } = await supabase
        .from('expertise_areas')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading expertise areas:', error);
        return;
      }

      setExpertiseAreas(data || []);
    } catch (error) {
      console.error('Error in loadExpertiseAreas:', error);
    }
  };

  const loadUserSessions = async () => {
    try {
      console.log('Loading user sessions...');
      
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          id,
          title,
          description,
          scheduled_start,
          status,
          final_price,
          mentor_id
        `)
        .eq('mentee_id', user?.id)
        .order('scheduled_start', { ascending: false })
        .limit(10);

      console.log('Sessions data:', { sessionsData, sessionsError });

      if (!sessionsError && sessionsData) {
        setSessions(sessionsData);
        
        // Calculate basic stats
        const totalSessions = sessionsData.length;
        const completedSessions = sessionsData.filter(s => s.status === 'completed').length;
        const uniqueMentors = new Set(sessionsData.map(s => s.mentor_id)).size;
        const totalSpent = sessionsData.reduce((acc, s) => acc + (s.final_price || 0), 0);
        const upcomingSessions = sessionsData.filter(s => (s.status === 'confirmed' || s.status === 'requested') && new Date(s.scheduled_start) > new Date()).length;
        
        setStats({
          totalSessions,
          completedSessions,
          activeMentors: uniqueMentors,
          goalProgress: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
          totalSpent,
          averageRating: 4.5, // Mock rating
          upcomingSessions,
          pendingSessions: sessionsData.filter(s => s.status === 'requested').length
        });

        // Set recent activity (same as sessions for now)
        setRecentActivity(sessionsData.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadMentors = async () => {
    setLoadingMentors(true);
    try {
      const { data, error } = await supabase
        .from('mentors')
        .select(`
          *,
          users (
            first_name,
            last_name,
            email,
            profile_image
          ),
          mentor_expertise (
            expertise_areas (
              name,
              description
            )
          )
        `)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter out mentors with invalid user data and map to Mentor interface
      const validMentors = (data || []).filter(m => m.users && typeof m.users === 'object' && !('error' in (m.users as any))).map(mentor => ({
        mentor_id: mentor.mentor_id,
        hourly_rate: mentor.hourly_rate || 0,
        experience_years: mentor.experience_years || 0,
        rating: mentor.rating || 0,
        reviews_count: mentor.reviews_count || 0,
        total_sessions_completed: mentor.total_sessions_completed || 0,
        is_approved: mentor.is_approved || false,
        created_at: mentor.created_at || '',
        users: mentor.users as unknown as { first_name: string; last_name: string; email: string; profile_image: string; bio?: string; timezone?: string; },
        mentor_expertise: mentor.mentor_expertise || []
      }));
      
      setMentors(validMentors);
    } catch (error: any) {
      console.error('Error loading mentors:', error);
      toast({ title: "Error loading mentors", description: error.message, variant: "destructive" });
    } finally {
      setLoadingMentors(false);
    }
  };

  const loadMenteeSessions = async () => {
    console.log('=== loadMenteeSessions called ===');
    console.log('User ID:', user?.id);
    console.log('User object:', user);
    
    if (!user?.id) {
      console.log('No user ID, skipping session loading');
      setLoadingSessions(false);
      return;
    }
    
    setLoadingSessions(true);
    try {
      // First, check if user is a mentee
      const { data: menteeCheck, error: menteeCheckError } = await supabase
        .from('mentees')
        .select('mentee_id')
        .eq('mentee_id', user?.id)
        .single();
      
      console.log('Mentee check:', { menteeCheck, menteeCheckError });
      
      if (menteeCheckError) {
        console.log('User is not a mentee, creating mentee record...');
        const { error: createMenteeError } = await supabase
          .from('mentees')
          .insert({
            mentee_id: user?.id,
            goals: 'Learn and grow'
          });
        
        if (createMenteeError) {
          console.error('Error creating mentee record:', createMenteeError);
        } else {
          console.log('Mentee record created successfully');
        }
      }
      
      console.log('Loading accepted sessions for mentee_id:', user?.id);
      // Load accepted sessions
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
          mentor_id
        `)
        .eq('mentee_id', user?.id)
        .eq('status', 'confirmed')
        .order('scheduled_start', { ascending: false });

      if (acceptedError) {
        console.error('Error loading accepted sessions:', acceptedError);
        throw acceptedError;
      }
      console.log('Accepted sessions loaded:', acceptedData);
      setAcceptedSessions(acceptedData || []);

      // Debug: Check all sessions for this user
      const { data: debugAllSessions, error: debugAllSessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('mentee_id', user?.id);
      
      console.log('All sessions for user:', debugAllSessions, 'Error:', debugAllSessionsError);
      
      // If no sessions exist, create a test session for debugging
      if (!debugAllSessions || debugAllSessions.length === 0) {
        console.log('No sessions found, creating a test session...');
        
        // First, get a mentor ID (or create one if needed)
        const { data: mentors, error: mentorsError } = await supabase
          .from('mentors')
          .select('mentor_id')
          .limit(1);
        
        console.log('Available mentors:', mentors, 'Error:', mentorsError);
        
        if (mentors && mentors.length > 0) {
          const testSession = {
            mentor_id: mentors[0].mentor_id,
            mentee_id: user?.id,
            title: 'Test Session',
            description: 'This is a test session for debugging',
            scheduled_start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            scheduled_end: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
            duration_minutes: 60,
            final_price: 50.00,
            status: 'confirmed'
          };
          
          const { data: newSession, error: createSessionError } = await supabase
            .from('sessions')
            .insert(testSession)
            .select();
          
          console.log('Test session created:', newSession, 'Error:', createSessionError);
        } else {
          console.log('No mentors available to create test session');
        }
      }

      // Load pending sessions
      const { data: pendingData, error: pendingError } = await supabase
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
          mentor_id
        `)
        .eq('mentee_id', user?.id)
        .eq('status', 'requested')
        .order('scheduled_start', { ascending: false });

      if (pendingError) {
        console.error('Error loading pending sessions:', pendingError);
        throw pendingError;
      }
      console.log('Pending sessions loaded:', pendingData);
      setPendingSessions(pendingData || []);

      // Load rejected/cancelled sessions
      const { data: rejectedData, error: rejectedError } = await supabase
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
          mentor_id
        `)
        .eq('mentee_id', user?.id)
        .eq('status', 'cancelled')
        .order('scheduled_start', { ascending: false });

      if (rejectedError) {
        console.error('Error loading rejected sessions:', rejectedError);
        throw rejectedError;
      }
      console.log('Rejected sessions loaded:', rejectedData);
      setRejectedSessions(rejectedData || []);

      // Update stats with the new session data
      const allSessions = [...(acceptedData || []), ...(pendingData || []), ...(rejectedData || [])];
      const totalSessions = allSessions.length;
      const completedSessions = allSessions.filter(s => s.status === 'completed').length;
      const uniqueMentors = new Set(allSessions.map(s => s.mentor_id)).size;
      const totalSpent = allSessions.reduce((acc, s) => acc + (s.final_price || 0), 0);
      const upcomingSessions = allSessions.filter(s => (s.status === 'confirmed' || s.status === 'requested') && new Date(s.scheduled_start) > new Date()).length;
      const pendingSessions = allSessions.filter(s => s.status === 'requested').length;

      setStats(prev => ({
        ...prev,
        totalSessions,
        completedSessions,
        activeMentors: uniqueMentors,
        goalProgress: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
        totalSpent,
        upcomingSessions,
        pendingSessions
      }));

    } catch (error: any) {
      console.error('Error loading sessions:', error);
      toast({ title: "Error loading sessions", description: error.message, variant: "destructive" });
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleSignOut = async () => {
    try {
    await signOut();
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleJoinMeeting = (session: any) => {
    setSelectedSession(session);
    setIsZoomMeetingOpen(true);
  };

  const handleSessionEnd = () => {
    setIsZoomMeetingOpen(false);
    setSelectedSession(null);
    // Refresh sessions and stats
    loadMenteeSessions();
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "find-mentors" && mentors.length === 0) {
      loadMentors();
    }
    if (tab === "sessions" && acceptedSessions.length === 0 && rejectedSessions.length === 0 && pendingSessions.length === 0) {
      loadMenteeSessions();
    }
  };

  const handleSessionClick = (session: any) => {
    setSelectedSession(session);
    setShowSessionDetails(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-sunshine-yellow mx-auto mb-4"></div>
          <p className="text-gray-600">Loading mentee dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !isMentee) {
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
                Mentee
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
                variant={activeTab === "find-mentors" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => handleTabChange("find-mentors")}
                className={activeTab === "find-mentors" ? "bg-brand-sunshine-yellow text-brand-charcoal" : "text-brand-dark-grey hover:text-brand-charcoal"}
              >
                Find Mentors
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
                My Ideas
              </Button>
            </div>
            
            {/* Right side - User Info */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Button variant="ghost" size="sm" className="relative">
                  <MessageCircle className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    0
                  </span>
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-gray-600 hover:text-gray-900">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
              {userProfile && (
                <Avatar className="h-8 w-8 cursor-pointer" onClick={() => setShowProfileEdit(true)}>
                  <AvatarImage src={userProfile.profile_image} />
                  <AvatarFallback className="bg-gray-200 text-gray-700">
                    {userProfile.first_name[0]}{userProfile.last_name[0]}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-8">
        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {userProfile?.first_name}!</h1>
                <p className="text-gray-600 text-base">Ready to continue your learning journey?</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{stats.upcomingSessions}</div>
                <div className="text-gray-600 text-sm">Upcoming sessions</div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="bg-white border border-brand-dark-grey shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-brand-sunshine-yellow rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-brand-charcoal" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-brand-charcoal mb-1">{stats.totalSessions}</div>
                  <p className="text-sm text-brand-dark-grey">+1 from last month</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-brand-dark-grey shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-brand-marigold-yellow rounded-lg flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-brand-charcoal" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-brand-charcoal mb-1">{stats.completedSessions}</div>
                  <p className="text-sm text-brand-dark-grey">0% completion rate</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-brand-dark-grey shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-brand-sunshine-yellow rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-brand-charcoal" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-brand-charcoal mb-1">{stats.activeMentors}</div>
                  <p className="text-sm text-brand-dark-grey">Currently working with</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-brand-dark-grey shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-brand-marigold-yellow rounded-lg flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-brand-charcoal" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-brand-charcoal mb-1">${stats.totalSpent}</div>
                  <p className="text-sm text-brand-dark-grey">Investment in your growth</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-brand-dark-grey shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-brand-sunshine-yellow rounded-lg flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-brand-charcoal" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-brand-charcoal mb-1">{stats.pendingSessions}</div>
                  <p className="text-sm text-brand-dark-grey">Awaiting mentor approval</p>
                </CardContent>
              </Card>
            </div>

            {/* Progress and Goals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <Target className="h-4 w-4 text-blue-600" />
                    </div>
                    Learning Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">Session Completion</span>
                      <span className="text-gray-900 font-medium">0%</span>
                    </div>
                    <Progress value={0} className="h-2 bg-gray-200" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">Average Rating</span>
                      <span className="text-gray-900 font-medium">0.0/5</span>
                    </div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 text-gray-300"
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-green-600" />
                    </div>
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          You received feedback on 'Career Path Discussion' from Alice Smith.
                        </p>
                        <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Session 'Intro to Product Management' with John Doe completed.
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Yesterday</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Joined 'Effective Communication for Leaders' public seminar.
                        </p>
                        <p className="text-xs text-gray-500 mt-1">3 days ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          New session 'Interview Preparation' booked with Maria Garcia.
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Last week</p>
                      </div>
                    </div>
                  </div>
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
                    <Link to="/mentors">
                      <Button className="mt-4">
                        Find Mentors
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.slice(0, 5).map((session: any) => (
                      <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-blue-500 text-white">
                              M
                            </AvatarFallback>
                          </Avatar>
                        <div>
                          <h4 className="font-medium text-gray-900">{session.title || 'Mentoring Session'}</h4>
                            <p className="text-sm text-gray-600">
                              Mentor ID: {session.mentor_id?.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {new Date(session.scheduled_start).toLocaleDateString()}
                          </p>
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

            {/* Mentor Recommendations */}
                            <FloatingMentorChatbot />
          </div>
        )}

        {activeTab === "find-mentors" && (
          <div className="space-y-6">
            {/* Advanced Search and Filter Header */}
            <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-lg p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Sidebar - Filters */}
                <div className="lg:w-1/4 space-y-6">
                  {/* Main Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search for any skill, title or company
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="e.g., React, Product Manager, Google"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Mentor Count */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{mentors.length}</div>
                    <div className="text-sm text-gray-600">mentors found</div>
                  </div>

                  {/* Skills Filter */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills</h3>
                    <div className="space-y-2">
                      {expertiseAreas.slice(0, 5).map((area) => (
                        <div key={area.area_id} className="flex items-center">
                          <input 
                            type="checkbox" 
                            id={area.area_id} 
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                          />
                          <label htmlFor={area.area_id} className="ml-2 text-sm text-gray-700">
                            {area.name} ({mentors.filter(m => m.mentor_expertise?.some(e => e.expertise_areas.name === area.name)).length})
                          </label>
                        </div>
                      ))}
                      {expertiseAreas.length > 5 && (
                        <button className="text-blue-600 text-sm hover:text-blue-800">Show more</button>
                      )}
                    </div>
                  </div>

                  {/* Job Titles Filter */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Titles</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input type="checkbox" id="senior" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <label htmlFor="senior" className="ml-2 text-sm text-gray-700">Senior Developer (18)</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="lead" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <label htmlFor="lead" className="ml-2 text-sm text-gray-700">Tech Lead (12)</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="manager" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <label htmlFor="manager" className="ml-2 text-sm text-gray-700">Product Manager (15)</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="founder" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <label htmlFor="founder" className="ml-2 text-sm text-gray-700">Founder (8)</label>
                      </div>
                      <button className="text-blue-600 text-sm hover:text-blue-800">Show more</button>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Price Range</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input type="radio" name="price" id="all" className="text-blue-600 focus:ring-blue-500" />
                        <label htmlFor="all" className="ml-2 text-sm text-gray-700">All prices</label>
                      </div>
                      <div className="flex items-center">
                        <input type="radio" name="price" id="under50" className="text-blue-600 focus:ring-blue-500" />
                        <label htmlFor="under50" className="ml-2 text-sm text-gray-700">Under $50/hr</label>
                      </div>
                      <div className="flex items-center">
                        <input type="radio" name="price" id="50to100" className="text-blue-600 focus:ring-blue-500" />
                        <label htmlFor="50to100" className="ml-2 text-sm text-gray-700">$50 - $100/hr</label>
                      </div>
                      <div className="flex items-center">
                        <input type="radio" name="price" id="over100" className="text-blue-600 focus:ring-blue-500" />
                        <label htmlFor="over100" className="ml-2 text-sm text-gray-700">Over $100/hr</label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Mentor Cards */}
                <div className="lg:w-2/3">
                  {/* Loading State */}
                  {loadingMentors && (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
                      <span className="text-gray-600">Loading mentors...</span>
                    </div>
                  )}

                  {/* Mentor Cards Grid */}
                  {!loadingMentors && (
                    <div className="space-y-4">
                      {mentors.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Users className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900">No Mentors Available</h3>
                          <p className="text-gray-600 mt-2">
                            Currently there are no approved mentors available. Please check back later or contact support.
                          </p>
                        </div>
                      ) : (
                        mentors.map((mentor) => (
                          <Card key={mentor.mentor_id} className="bg-white border border-gray-200 hover:border-brand-sunshine-yellow/50 transition-all duration-300 hover:shadow-lg">
                            <CardContent className="p-6">
                              <div className="flex items-start space-x-4">
                                {/* Mentor Avatar */}
                                <Avatar className="h-16 w-16 flex-shrink-0">
                                  <AvatarImage src={mentor.users?.profile_image} />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg">
                                    {mentor.users?.first_name?.[0]}{mentor.users?.last_name?.[0]}
                                  </AvatarFallback>
                                </Avatar>

                                {/* Mentor Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-xl font-semibold text-gray-900">
                                          {mentor.users?.first_name} {mentor.users?.last_name}
                                        </h3>
                                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                                          Top Mentor
                                        </Badge>
                                      </div>
                                      
                                      {/* Rating and Reviews */}
                                      <div className="flex items-center gap-4 mb-3">
                                        <div className="flex items-center">
                                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                          <span className="ml-1 text-sm font-medium">{mentor.rating.toFixed(1)}</span>
                                          <span className="ml-1 text-sm text-gray-500">({mentor.reviews_count} reviews)</span>
                                        </div>
                                        <div className="flex items-center text-sm text-green-600">
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                          Available
                                        </div>
                                      </div>

                                      {/* Current Role */}
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-4 h-4 bg-gray-200 rounded flex items-center justify-center">
                                          <div className="w-2 h-2 bg-gray-600 rounded"></div>
                                        </div>
                                        <span className="text-sm text-gray-600">
                                          {mentor.experience_years}+ years experience
                                        </span>
                                      </div>

                                      {/* Languages */}
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                                          <div className="w-2 h-2 bg-blue-600 rounded"></div>
                                        </div>
                                        <span className="text-sm text-gray-600">Speaks English</span>
                                      </div>

                                      {/* Bio */}
                                      <p className="text-gray-700 text-sm leading-relaxed mb-4">
                                        {mentor.users?.bio || `Experienced professional with ${mentor.experience_years} years of expertise in software development and mentoring.`}
                                      </p>

                                      {/* Expertise Tags */}
                                      <div className="flex flex-wrap gap-2 mb-4">
                                        {mentor.mentor_expertise?.slice(0, 4).map((expertise, index) => (
                                          <Badge key={index} variant="outline" className="text-xs">
                                            {expertise.expertise_areas.name}
                                          </Badge>
                                        ))}
                                        {mentor.mentor_expertise && mentor.mentor_expertise.length > 4 && (
                                          <Badge variant="outline" className="text-xs">
                                            +{mentor.mentor_expertise.length - 4} more
                                          </Badge>
                                        )}
                                      </div>

                                      {/* Pricing */}
                                      <div className="text-lg font-semibold text-green-600">
                                        Starting from ${mentor.hourly_rate}/hr
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2 ml-4">
                                      <Button size="sm" variant="outline" className="border-gray-300">
                                        <MessageCircle className="h-4 w-4 mr-1" />
                                        Message
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="border-black text-black hover:bg-gray-100"
                                        onClick={() => {
                                          setSelectedMentor(mentor);
                                          setShowMentorProfileModal(true);
                                        }}
                                      >
                                        <Eye className="h-4 w-4 mr-1" />
                                        View Profile
                                      </Button>
                                      <MentorAvailabilityViewer mentor={mentor} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

                {activeTab === "seminars" && (
          <SeminarsSidebarLayout />
        )}

        {activeTab === "sessions" && (
          <SessionsSidebarLayout
            acceptedSessions={acceptedSessions}
            pendingSessions={pendingSessions}
            rejectedSessions={rejectedSessions}
            loadingSessions={loadingSessions}
            onSessionClick={handleSessionClick}
            onJoinMeeting={handleJoinMeeting}
          />
        )}

        {activeTab === "ideas" && (
          <IdeasList isMentee={true} menteeId={user?.id} />
        )}
      </div>

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <UserProfileModal
          userType="mentee"
          onClose={() => setShowProfileEdit(false)}
          onProfileUpdated={() => {
            loadUserData();
            setShowProfileEdit(false);
          }}
        />
      )}

      {/* Zoom Meeting Modal */}
      {selectedSession && (
        <ZoomMeeting
                          sessionId={selectedSession.id}
          meetingId={selectedSession.zoom_meeting_id || '123456789'}
          password={selectedSession.zoom_password}
          startTime={selectedSession.scheduled_start}
          endTime={selectedSession.scheduled_end}
          mentorName={`${selectedSession.mentors?.users?.first_name || 'Mentor'} ${selectedSession.mentors?.users?.last_name || ''}`}
          menteeName={`${userProfile?.first_name || 'User'} ${userProfile?.last_name || ''}`}
          sessionTitle={selectedSession.title || 'Mentoring Session'}
          isOpen={isZoomMeetingOpen}
          onClose={() => setIsZoomMeetingOpen(false)}
          onSessionEnd={handleSessionEnd}
        />
      )}

      {/* Mentor Profile Modal */}
      {showMentorProfileModal && selectedMentor && (
        <MentorProfileModal
          isOpen={showMentorProfileModal}
          mentor={selectedMentor}
          onClose={() => setShowMentorProfileModal(false)}
          onBookSession={() => {
            // TODO: Implement booking logic
            console.log('Book session with mentor:', selectedMentor.mentor_id);
            setShowMentorProfileModal(false);
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
      
      {/* Floating AI Chatbot */}
      <FloatingMentorChatbot />
    </div>
  );
}
