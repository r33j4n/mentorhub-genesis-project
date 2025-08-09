import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, MessageSquare, Clock, Briefcase, Star, MapPin, Calendar, CheckCircle, X, Heart, Linkedin } from 'lucide-react';
import { SubscriptionApplicationModal } from './SubscriptionApplicationModal';

interface MentorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const MentorProfileModal = ({ isOpen, onClose, mentor, onBookSession }: MentorProfileModalProps) => {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  const { users: user, mentor_expertise } = mentor;
  
  if (!user) {
    return null;
  }

  const handleBookSession = () => {
    onBookSession(mentor.mentor_id);
    onClose();
  };

  const handleMessage = () => {
    // TODO: Implement messaging functionality
    console.log('Message mentor:', mentor.mentor_id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-0">
          {/* Header with profile picture and navigation */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-6 relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
            
            {/* Breadcrumb navigation */}
            <div className="flex items-center text-sm text-blue-100 mb-4">
              <span className="mr-2">🏠</span>
              <span className="mr-2">Find a Mentor</span>
              <span className="text-white font-medium">{user.first_name} {user.last_name}</span>
            </div>
            
            <div className="flex items-start space-x-6">
              {/* Profile Picture */}
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                  <AvatarImage src={user.profile_image || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-semibold">
                    {user.first_name?.[0]}{user.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <Star className="h-4 w-4 mr-1" />
                  Top Mentor
                </div>
              </div>
              
              {/* Profile Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{user.first_name} {user.last_name}</h1>
                <p className="text-xl text-blue-100 mb-4">
                  Professional Mentor with {mentor.experience_years}+ years experience
                </p>
                
                {/* Trial Period */}
                <div className="bg-green-500 text-white px-4 py-2 rounded-lg inline-block mb-4">
                  Free 30 min intro call in 7-Day Trial Period
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-green-400" />
                    <span>{user.timezone}</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-2 text-green-400" />
                    <span>{mentor.rating.toFixed(1)} ({mentor.reviews_count} reviews)</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-green-400" />
                    <span>Active today</span>
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2 text-green-400" />
                    <span>Usually responds in half a day</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/20">
                    <Heart className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/20">
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Profile Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Skills Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {mentor_expertise.map((expertise, index) => (
                    <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                      {expertise.expertise_areas.name}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="border-gray-300 text-gray-600">
                    +{Math.max(0, 11 - mentor_expertise.length)} more
                  </Badge>
                </div>
              </div>
              
              {/* About Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                <div className="text-gray-700 space-y-4">
                  <p>
                    {user.bio || `I am a professional mentor with ${mentor.experience_years}+ years of experience. I'm passionate about helping others grow in their careers and achieve their goals.`}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Job Prep</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Interview Prep (resume, portfolio review, design challenges, behavioral/technical Qs)</li>
                        <li>• How to find a Job</li>
                        <li>• How to break into the FAANG</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Professional Skills</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Career Guidance</li>
                        <li>• Skill Development</li>
                        <li>• Industry Knowledge</li>
                        <li>• Networking Strategies</li>
                        <li>• Personal Branding</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column - Pricing */}
            <div className="space-y-4">
              {/* Main Pricing Box */}
              <div className="bg-gray-50 rounded-lg p-6 border">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    ${mentor.hourly_rate * 4}/month
                  </div>
                  <p className="text-gray-600 text-sm">
                    The most popular way to get mentored, let's work towards your goals!
                  </p>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-3 text-green-500" />
                    <span>2 calls per month (60min/call)</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <MessageSquare className="h-4 w-4 mr-3 text-green-500" />
                    <span>Unlimited Q&A via chat</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-3 text-green-500" />
                    <span>Expect responses in 2 days</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Briefcase className="h-4 w-4 mr-3 text-green-500" />
                    <span>Hands-on support</span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => setShowSubscriptionModal(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                >
                  Apply now
                </Button>
                
                <div className="flex items-center justify-center mt-3 text-sm text-gray-600">
                  <span className="mr-1">🔥</span>
                  Only 1 spot left!
                </div>
              </div>
              
              {/* Free Trial Box */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-center text-sm text-gray-700 mb-2">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  7-day free trial
                </div>
                <p className="text-sm text-gray-600 mb-2">Cancel anytime.</p>
                <button className="text-sm text-blue-600 hover:underline">
                  What's included?
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
      
      {/* Subscription Application Modal */}
      {showSubscriptionModal && (
        <SubscriptionApplicationModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          mentor={mentor}
        />
      )}
    </Dialog>
  );
}; 