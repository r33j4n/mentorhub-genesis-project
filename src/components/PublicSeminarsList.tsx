import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, Users, DollarSign, Video, BookOpen, Heart, User, Building2, ExternalLink } from 'lucide-react';
import { MentorFollowService, PublicSeminar } from '@/services/mentorFollowService';
import { toast } from '@/components/ui/use-toast';
import { FollowMentorButton } from './FollowMentorButton';

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
  const [seminars, setSeminars] = useState<PublicSeminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [participatingSeminars, setParticipatingSeminars] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSeminars();
  }, [showFollowedOnly]);

  const loadSeminars = async () => {
    setLoading(true);
    try {
      let seminarsData: PublicSeminar[];
      
      if (showFollowedOnly) {
        seminarsData = await MentorFollowService.getFollowedMentorsSeminars();
      } else {
        seminarsData = await MentorFollowService.getAllPublicSeminars();
      }
      
      setSeminars(seminarsData);
      
      // Check participation status for each seminar
      const participating = new Set<string>();
      for (const seminar of seminarsData) {
        const isParticipating = await MentorFollowService.isParticipatingInSeminar(seminar.id);
        if (isParticipating) {
          participating.add(seminar.id);
        }
      }
      setParticipatingSeminars(participating);
    } catch (error) {
      console.error('Error loading seminars:', error);
      toast({
        title: "Error",
        description: "Failed to load seminars",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSeminar = async (seminar: PublicSeminar) => {
    try {
      const success = await MentorFollowService.joinSeminar(seminar.id);
      if (success) {
        setParticipatingSeminars(prev => new Set(prev).add(seminar.id));
        toast({
          title: "Joined Seminar",
          description: `You've joined "${seminar.title}"`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to join seminar",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error joining seminar:', error);
      toast({
        title: "Error",
        description: "Failed to join seminar",
        variant: "destructive"
      });
    }
  };

  const handleLeaveSeminar = async (seminar: PublicSeminar) => {
    try {
      const success = await MentorFollowService.leaveSeminar(seminar.id);
      if (success) {
        setParticipatingSeminars(prev => {
          const newSet = new Set(prev);
          newSet.delete(seminar.id);
          return newSet;
        });
        toast({
          title: "Left Seminar",
          description: `You've left "${seminar.title}"`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to leave seminar",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error leaving seminar:', error);
      toast({
        title: "Error",
        description: "Failed to leave seminar",
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
    
    return <Badge className="bg-purple-100 text-purple-800">Upcoming</Badge>;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mr-4"></div>
            <span className="text-gray-600">Loading seminars...</span>
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
          <BookOpen className="h-5 w-5 text-purple-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {seminars.map((seminar) => (
            <Card key={seminar.id} className="border border-gray-200 hover:border-purple-300 transition-all duration-200">
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
                        <User className="h-4 w-4 text-purple-600" />
                        <div className="flex items-center gap-2">
                          {seminar.speaker_image && (
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={seminar.speaker_image} />
                              <AvatarFallback className="bg-purple-500 text-white text-xs">
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
                        <Building2 className="h-4 w-4 text-purple-600" />
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
                              className="text-purple-600 hover:text-purple-800"
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
                          <AvatarFallback className="bg-purple-500 text-white text-xs">
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLeaveSeminar(seminar)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Leave
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleJoinSeminar(seminar)}
                        className="bg-purple-600 hover:bg-purple-700"
                        disabled={seminar.status === 'cancelled' || seminar.status === 'completed'}
                      >
                        <BookOpen className="h-4 w-4 mr-1" />
                        Join
                      </Button>
                    )}
                    
                    {seminar.zoom_meeting_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-purple-300 text-purple-600 hover:bg-purple-50"
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