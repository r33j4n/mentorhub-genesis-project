import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, Users, DollarSign, Video, BookOpen, Heart, User, Building2, ExternalLink, CheckCircle } from 'lucide-react';
import { MentorFollowService, PublicSeminar } from '@/services/mentorFollowService';
import { toast } from '@/components/ui/use-toast';
import { FollowMentorButton } from './FollowMentorButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PublicSeminarsListProps {
  showFollowedOnly?: boolean;
  title?: string;
  className?: string;
}

export const PublicSeminarsList: React.FC<PublicSeminarsListProps> = ({
  showFollowedOnly = false,
  title = "Public Seminars",
  className = ""
}) => {
  const { user } = useAuth();
  const [seminars, setSeminars] = useState<PublicSeminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [participatingSeminars, setParticipatingSeminars] = useState<Set<string>>(new Set());
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);

  useEffect(() => {
    loadSeminars();
    
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
    }, 8000); // Reduced to 8 second timeout

    return () => clearTimeout(timeoutId);
  }, [showFollowedOnly]);

  const loadSeminars = async () => {
    // Simple caching: don't reload if last load was less than 30 seconds ago
    const now = Date.now();
    if (now - lastLoadTime < 30000 && seminars.length > 0) {
      console.log('Using cached seminars data');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('Loading seminars...', { showFollowedOnly });
      
      let seminarsData: PublicSeminar[];
      
      if (showFollowedOnly) {
        seminarsData = await MentorFollowService.getFollowedMentorsSeminars();
      } else {
        seminarsData = await MentorFollowService.getAllPublicSeminars();
      }
      
      console.log(`Loaded ${seminarsData.length} seminars`);
      setSeminars(seminarsData);
      setLastLoadTime(now);
      
      // Optimized: Get all participation status in a single query
      if (user?.id && seminarsData.length > 0) {
        const seminarIds = seminarsData.map(s => s.id);
        const { data: participationData, error } = await supabase
          .from('seminar_participants')
          .select('seminar_id')
          .eq('mentee_id', user.id)
          .in('seminar_id', seminarIds);
        
        if (!error && participationData) {
          const participating = new Set(participationData.map(p => p.seminar_id));
          setParticipatingSeminars(participating);
        }
      }
    } catch (error) {
      console.error('Error loading seminars:', error);
      toast({
        title: "Error",
        description: "Failed to load seminars. Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSeminar = async (seminar: PublicSeminar) => {
    try {
      const result = await MentorFollowService.joinSeminar(seminar.id);
      if (result.success) {
        setParticipatingSeminars(prev => new Set(prev).add(seminar.id));
        // Reload seminars to update participant count
        await loadSeminars();
        toast({
          title: "Seat Reserved! 🎉",
          description: result.message || `Your seat has been reserved for "${seminar.title}"`,
        });
      } else {
        toast({
          title: "Reservation Failed",
          description: result.message || "Failed to reserve seat",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error joining seminar:', error);
      toast({
        title: "Error",
        description: "Failed to reserve seat. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleLeaveSeminar = async (seminar: PublicSeminar) => {
    try {
      const result = await MentorFollowService.leaveSeminar(seminar.id);
      if (result.success) {
        setParticipatingSeminars(prev => {
          const newSet = new Set(prev);
          newSet.delete(seminar.id);
          return newSet;
        });
        // Reload seminars to update participant count
        await loadSeminars();
        toast({
          title: "Reservation Cancelled",
          description: result.message || `Your seat reservation for "${seminar.title}" has been cancelled`,
        });
      } else {
        toast({
          title: "Cancellation Failed",
          description: result.message || "Failed to cancel seat reservation",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error leaving seminar:', error);
      toast({
        title: "Error",
        description: "Failed to cancel seat reservation. Please try again.",
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
      minute: '2-digit'
    });
  };

  const getStatusBadge = (seminar: PublicSeminar) => {
    const now = new Date();
    const seminarDate = new Date(seminar.seminar_date);
    
    if (seminar.status === 'cancelled') {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    
    if (seminar.status === 'completed') {
      return <Badge variant="secondary">Completed</Badge>;
    }
    
    if (seminar.status === 'in_progress') {
      return <Badge className="bg-green-100 text-green-800">Live Now</Badge>;
    }
    
    if (seminarDate < now) {
      return <Badge variant="secondary">Past</Badge>;
    }
    
    return <Badge className="bg-brand-sunshine-yellow/20 text-brand-charcoal border border-brand-sunshine-yellow/30">Upcoming</Badge>;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-sunshine-yellow"></div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Loading skeleton */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="bg-gray-200 h-6 rounded mb-2 w-3/4"></div>
                    <div className="bg-gray-200 h-4 rounded w-full mb-3"></div>
                    <div className="flex gap-4">
                      <div className="bg-gray-200 h-4 w-24 rounded"></div>
                      <div className="bg-gray-200 h-4 w-20 rounded"></div>
                      <div className="bg-gray-200 h-4 w-16 rounded"></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="bg-gray-200 h-6 w-16 rounded"></div>
                    <div className="bg-gray-200 h-6 w-12 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (seminars.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">
              {showFollowedOnly 
                ? "No seminars from mentors you follow" 
                : "No public seminars available"
              }
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {showFollowedOnly 
                ? "Follow some mentors to see their public seminars here" 
                : "Check back later for upcoming seminars"
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-brand-sunshine-yellow" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {seminars.map((seminar) => (
            <Card key={seminar.id} className="border border-gray-200 hover:border-brand-sunshine-yellow/50 transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg mb-1">
                          {seminar.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {seminar.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {getStatusBadge(seminar)}
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

                    {/* Speaker Information */}
                    {seminar.speaker_name && (
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-brand-sunshine-yellow" />
                        <div className="flex items-center gap-2">
                          {seminar.speaker_image && (
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={seminar.speaker_image} />
                              <AvatarFallback className="bg-brand-sunshine-yellow text-brand-charcoal text-xs">
                                {seminar.speaker_name[0]}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {seminar.speaker_name}
                          </span>
                          {seminar.speaker_title && (
                            <span className="text-sm text-gray-600">
                              • {seminar.speaker_title}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Company Information */}
                    {seminar.company_name && (
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-4 w-4 text-brand-sunshine-yellow" />
                        <div className="flex items-center gap-2">
                          {seminar.company_logo && (
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={seminar.company_logo} />
                              <AvatarFallback className="bg-blue-500 text-white text-xs">
                                {seminar.company_name[0]}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {seminar.company_name}
                          </span>
                          {seminar.is_company_sponsored && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              Sponsored
                            </Badge>
                          )}
                          {seminar.company_website && (
                            <a
                              href={seminar.company_website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-sunshine-yellow hover:text-brand-marigold-yellow"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Speaker Bio */}
                    {seminar.speaker_bio && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {seminar.speaker_bio}
                        </p>
                      </div>
                    )}

                    {/* Mentor Information */}
                    {seminar.mentor && (
                      <div className="flex items-center gap-2 mb-3">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={seminar.mentor.users.profile_image} />
                          <AvatarFallback className="bg-brand-sunshine-yellow text-brand-charcoal text-xs">
                            {seminar.mentor.users.first_name?.[0]}{seminar.mentor.users.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-600">
                          by {seminar.mentor.users.first_name} {seminar.mentor.users.last_name}
                        </span>
                        <FollowMentorButton
                          mentorId={seminar.mentor_id}
                          mentorName={`${seminar.mentor.users.first_name} ${seminar.mentor.users.last_name}`}
                          variant="ghost"
                          size="sm"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {participatingSeminars.has(seminar.id) ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1 text-sm text-green-600 mb-1">
                          <CheckCircle className="h-4 w-4" />
                          <span>Seat Reserved</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLeaveSeminar(seminar)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Cancel Reservation
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {/* Seat availability indicator */}
                        <div className="text-xs text-gray-500 mb-1">
                          {seminar.max_participants ? (
                            <span>
                              {seminar.current_participants}/{seminar.max_participants} seats taken
                            </span>
                          ) : (
                            <span>Unlimited seats</span>
                          )}
                        </div>
                        
                        {/* Check if seminar is full */}
                        {(() => {
                          const isFull = seminar.max_participants && seminar.current_participants >= seminar.max_participants;
                          
                          if (isFull) {
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="border-gray-300 text-gray-500 cursor-not-allowed"
                              >
                                <BookOpen className="h-4 w-4 mr-1" />
                                Full
                              </Button>
                            );
                          }
                          
                          return (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  className="bg-black hover:bg-gray-800 text-white font-semibold"
                                  disabled={seminar.status === 'cancelled' || seminar.status === 'completed'}
                                >
                                  <BookOpen className="h-4 w-4 mr-1" />
                                  Reserve Seat
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirm Seat Reservation</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to reserve a seat for <strong>"{seminar.title}"</strong>?
                                    <br /><br />
                                    <strong>Details:</strong>
                                    <br />• Date: {formatDate(seminar.seminar_date)}
                                    <br />• Time: {formatTime(seminar.seminar_date)} ({seminar.duration_minutes} min)
                                    <br />• {seminar.is_free ? 'Free Seminar' : `Price: $${seminar.price}`}
                                    {seminar.max_participants ? (
                                      <>
                                        <br />• Available seats: {seminar.max_participants - seminar.current_participants}
                                      </>
                                    ) : null}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleJoinSeminar(seminar)}
                                    className="bg-black hover:bg-gray-800 text-white font-semibold"
                                  >
                                    Reserve My Seat
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          );
                        })()}
                      </div>
                    )}
                    
                    {seminar.zoom_meeting_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-black text-black hover:bg-gray-100"
                      >
                        <Video className="h-4 w-4 mr-1" />
                        Meeting
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}; 