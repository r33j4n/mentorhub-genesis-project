
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MapPin, Clock, DollarSign, Award } from 'lucide-react';

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
  
  if (!user) {
    return null;
  }

  return (
    <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm group">
      <CardHeader className="pb-4">
        <div className="flex items-start space-x-4">
          <div className="relative">
            <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
              <AvatarImage src={user.profile_image || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
                {user.first_name?.[0]}{user.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-6 h-6 border-2 border-white flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-xl text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {user.first_name} {user.last_name}
            </h3>
            
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center">
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
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {mentor.rating.toFixed(1)}
                </span>
                <span className="ml-1 text-sm text-gray-500">
                  ({mentor.reviews_count})
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center">
                <Award className="h-4 w-4 mr-1 text-blue-500" />
                <span>{mentor.experience_years}+ years</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1 text-green-500" />
                <span>{user.timezone}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 rounded-lg">
              <div className="flex items-center text-lg font-bold">
                <DollarSign className="h-5 w-5" />
                {mentor.hourly_rate}/hr
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed">
            {user.bio || "No bio available"}
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-900">Expertise</div>
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
        
        <Button 
          onClick={() => onBookSession(mentor.mentor_id)} 
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
        >
          Book Session
        </Button>
      </CardContent>
    </Card>
  );
};
