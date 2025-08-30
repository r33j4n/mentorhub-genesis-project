import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, Users, BookOpen, CheckCircle, X, Video } from 'lucide-react';
import { MentorFollowService, PublicSeminar } from '@/services/mentorFollowService';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ReservedSeminarsListProps {
  className?: string;
}

export const ReservedSeminarsList: React.FC<ReservedSeminarsListProps> = ({
  className = ""
}) => {
  const { user } = useAuth();
  const [reservedSeminars, setReservedSeminars] = useState<PublicSeminar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReservedSeminars();
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        toast({
          title: "Loading timeout",
          description: "Please refresh the page to try again.",
          variant: "destructive"
        });
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeoutId);
  }, []);

  const loadReservedSeminars = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        setReservedSeminars([]);
        return;
      }

      // First, ensure user has a mentee record
      const { data: menteeCheck, error: menteeCheckError } = await supabase
        .from('mentees')
        .select('mentee_id')
        .eq('mentee_id', user.id)
        .single();
      
      if (menteeCheckError && menteeCheckError.code !== 'PGRST116') {
        const { error: createMenteeError } = await supabase
          .from('mentees')
          .insert({
            mentee_id: user.id,
            goals: 'Learn and grow'
          });
        
        if (createMenteeError) {
          console.error('Error creating mentee record:', createMenteeError);
        }
      }
      
      // Get all public seminars first
      const allSeminars = await MentorFollowService.getAllPublicSeminars();
      
      // Filter for seminars where user is participating
      const reserved: PublicSeminar[] = [];
      for (const seminar of allSeminars) {
        const isParticipating = await MentorFollowService.isParticipatingInSeminar(seminar.id);
        if (isParticipating) {
          reserved.push(seminar);
        }
      }
      
      setReservedSeminars(reserved);
    } catch (error) {
      console.error('Error loading reserved seminars:', error);
      toast({
        title: "Error",
        description: "Failed to load reserved seminars",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (seminar: PublicSeminar) => {
    try {
      const result = await MentorFollowService.leaveSeminar(seminar.id);
      if (result.success) {
        // Remove from reserved list
        setReservedSeminars(prev => prev.filter(s => s.id !== seminar.id));
        toast({
          title: "Reservation Cancelled",
          description: `Your reservation for "${seminar.title}" has been cancelled`,
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to cancel reservation",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast({
        title: "Error",
        description: "Failed to cancel reservation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            My Reserved Seminars
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Loading skeleton */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="bg-gray-200 h-6 rounded mb-2 w-3/4"></div>
                    <div className="bg-gray-200 h-4 rounded w-full"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="bg-gray-200 h-6 w-16 rounded"></div>
                    <div className="bg-gray-200 h-6 w-12 rounded"></div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-gray-200 h-4 w-24 rounded"></div>
                  <div className="bg-gray-200 h-4 w-20 rounded"></div>
                  <div className="bg-gray-200 h-4 w-16 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reservedSeminars.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            My Reserved Seminars
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium mb-2">No reserved seminars</p>
            <p className="text-sm text-gray-500 mb-4">
              You haven't reserved any seminars yet. Browse available seminars to get started!
            </p>
            <Button 
              onClick={() => window.location.href = '/mentee-dashboard?tab=seminars'} 
              className="bg-black hover:bg-gray-800 text-white"
            >
              Browse Public Seminars
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          My Reserved Seminars ({reservedSeminars.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reservedSeminars.map((seminar) => (
            <div key={seminar.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">
                        {seminar.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {seminar.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge className="bg-green-100 text-green-800">Reserved</Badge>
                      {seminar.is_free ? (
                        <Badge className="bg-green-100 text-green-800">Free</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          ${seminar.price}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(seminar.seminar_date)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatTime(seminar.seminar_date)} ({seminar.duration_minutes} min)
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {seminar.current_participants}
                      {seminar.max_participants && `/${seminar.max_participants}`}
                    </div>
                  </div>

                  {/* Mentor Information */}
                  {seminar.mentor && (
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={seminar.mentor.users.profile_image} />
                        <AvatarFallback className="bg-yellow-500 text-white text-xs">
                          {seminar.mentor.users.first_name?.[0]}{seminar.mentor.users.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-600">
                        by {seminar.mentor.users.first_name} {seminar.mentor.users.last_name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <div className="flex items-center gap-1 text-sm text-green-600 mb-1">
                    <CheckCircle className="h-4 w-4" />
                    <span>Seat Reserved</span>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancelReservation(seminar)}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  
                  {seminar.zoom_meeting_id && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-black text-black hover:bg-gray-100"
                    >
                      <Video className="h-4 w-4 mr-1" />
                      Join Meeting
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}; 