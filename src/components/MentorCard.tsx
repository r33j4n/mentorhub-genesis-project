
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MapPin, Clock, DollarSign, Award, MessageCircle, Calendar, CheckCircle, Eye, Shield } from 'lucide-react';
import { MentorProfileModal } from './MentorProfileModal';
import { FollowMentorButton } from './FollowMentorButton';

interface MentorCardProps {
  mentor: {
    mentor_id: string;
    hourly_rate: number;
    experience_years: number;
    rating: number;
    reviews_count: number;
    professional_title?: string;
    years_of_practice?: number;
    is_licensed?: boolean;
    license_verified?: boolean;
    consultation_fee?: number;
    accepts_insurance?: boolean;
    languages_spoken?: string[];
    consultation_type?: string;
    users: {
      first_name: string;
      last_name: string;
      bio: string;
      profile_image: string;
      timezone: string;
    };
    mentor_expertise: Array<{
      expertise_areas: {
        name: string;
        category: string;
      };
    }>;
  };
  onBookSession: (mentorId: string) => void;
}

export const MentorCard = ({ mentor, onBookSession }: MentorCardProps) => {
  const navigate = useNavigate();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { users: user, mentor_expertise } = mentor;
  
  if (!user) {
    return null;
  }

  const getAvailabilityStatus = () => {
    // Mock availability - in real app this would come from mentor's calendar
    const isAvailable = Math.random() > 0.3;
    return {
      available: isAvailable,
      text: isAvailable ? 'Available today' : 'Available this week',
      color: isAvailable ? 'text-green-600' : 'text-orange-600'
    };
  };

  const availability = getAvailabilityStatus();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/mentor/${mentor.mentor_id}`);
  };

  const handleBookSessionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBookSession(mentor.mentor_id);
  };

  const handleMessageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement messaging functionality
    console.log('Message mentor:', mentor.mentor_id);
  };

  const handleViewProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsProfileModalOpen(true);
  };

  return (
    <>
      <Card 
        className="h-full hover:shadow-xl transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm group overflow-hidden cursor-pointer"
        onClick={handleCardClick}
      >
        <CardHeader className="pb-4 relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-50"></div>
          
          <div className="relative">
            <div className="flex items-start space-x-4">
              <div className="relative">
                <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                  <AvatarImage src={user.profile_image || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-semibold">
                    {user.first_name?.[0]}{user.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-6 h-6 border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                                      <h3 className="font-bold text-xl text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {user.first_name} {user.last_name}
                  </h3>
                  {mentor.professional_title && (
                    <p className="text-sm text-gray-600 font-medium">
                      {mentor.professional_title}
                    </p>
                  )}
                    
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(mentor.rating) 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {mentor.rating.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({mentor.reviews_count} reviews)
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg shadow-md">
                      <div className="flex items-center text-lg font-bold">
                        <DollarSign className="h-5 w-5 mr-1" />
                        {mentor.hourly_rate}/hr
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Award className="h-4 w-4 mr-1 text-blue-500" />
                    <span>{mentor.experience_years}+ years</span>
                  </div>
                  {mentor.is_licensed && mentor.license_verified && (
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-1 text-green-500" />
                      <span className="text-xs text-green-600">Licensed</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-green-500" />
                    <span>Available</span>
                  </div>
                  {mentor.accepts_insurance && (
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-blue-500" />
                      <span className="text-xs text-blue-600">Accepts Insurance</span>
                    </div>
                  )}
                  <div className={`flex items-center ${availability.color}`}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span className="text-xs">{availability.text}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Bio */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed">
              Experienced professional passionate about helping others grow in their careers. Let's work together to achieve your goals!
            </p>
          </div>
          
          {/* Expertise */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-900">Expertise</div>
              <Badge variant="outline" className="text-xs">
                {mentor_expertise.length} specialties
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {mentor_expertise.slice(0, 3).map((expertise, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200">
                  {expertise.expertise_areas.name}
                </Badge>
              ))}
              {mentor_expertise.length > 3 && (
                <Badge variant="outline" className="text-xs border-blue-200 text-blue-600">
                  +{mentor_expertise.length - 3} more
                </Badge>
              )}
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="text-xs text-blue-600 font-medium">Experience</div>
              <div className="text-lg font-bold text-blue-700">{mentor.experience_years}+ yrs</div>
            </div>
            <div className="bg-green-50 rounded-lg p-2">
              <div className="text-xs text-green-600 font-medium">Success Rate</div>
              <div className="text-lg font-bold text-green-700">95%</div>
            </div>
            <div className="bg-brand-sunshine-yellow/20 rounded-lg p-2">
              <div className="text-xs text-brand-charcoal font-medium">Response</div>
              <div className="text-lg font-bold text-brand-charcoal">2h</div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={handleBookSessionClick} 
              className="flex-1 bg-black hover:bg-gray-800 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Book Session
            </Button>
            <div className="flex gap-2">
              <FollowMentorButton
                mentorId={mentor.mentor_id}
                mentorName={`${mentor.users.first_name} ${mentor.users.last_name}`}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
              />
              <Button 
                variant="outline" 
                onClick={handleViewProfileClick}
                className="flex-1 sm:flex-none px-3 border-black text-black hover:bg-gray-100 text-sm"
              >
                <Eye className="h-4 w-4 mr-1" />
                View Profile
              </Button>
              <Button 
                variant="outline" 
                onClick={handleMessageClick}
                className="flex-1 sm:flex-none px-3 border-black text-black hover:bg-gray-100 text-sm"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Message
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mentor Profile Modal */}
      <MentorProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        mentor={mentor}
        onBookSession={onBookSession}
      />
    </>
  );
};
