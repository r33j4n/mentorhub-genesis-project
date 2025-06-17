
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MapPin, Clock, DollarSign } from 'lucide-react';

interface MentorCardProps {
  mentor: {
    mentor_id: string;
    hourly_rate: number;
    experience_years: number;
    rating: number;
    reviews_count: number;
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
  const { users: user, mentor_expertise } = mentor;
  
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.profile_image} />
            <AvatarFallback>
              {user.first_name[0]}{user.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">
              {user.first_name} {user.last_name}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                <span>{mentor.rating.toFixed(1)}</span>
                <span className="ml-1">({mentor.reviews_count})</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{mentor.experience_years}+ years</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center text-lg font-semibold text-green-600">
              <DollarSign className="h-4 w-4" />
              {mentor.hourly_rate}/hr
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600 text-sm line-clamp-3">
          {user.bio}
        </p>
        
        <div className="flex flex-wrap gap-1">
          {mentor_expertise.slice(0, 3).map((expertise, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {expertise.expertise_areas.name}
            </Badge>
          ))}
          {mentor_expertise.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{mentor_expertise.length - 3} more
            </Badge>
          )}
        </div>
        
        <div className="flex items-center text-sm text-gray-500">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{user.timezone}</span>
        </div>
        
        <Button 
          onClick={() => onBookSession(mentor.mentor_id)} 
          className="w-full"
        >
          Book Session
        </Button>
      </CardContent>
    </Card>
  );
};
