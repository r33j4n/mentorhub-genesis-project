import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  Award, 
  MessageCircle, 
  Calendar, 
  CheckCircle, 
  Phone, 
  MessageSquare, 
  Briefcase,
  Heart,
  Linkedin,
  ArrowLeft,
  Zap,
  Users,
  BookOpen,
  Target,
  TrendingUp,
  Globe,
  Github,
  ExternalLink,
  CalendarDays,
  Clock3,
  ThumbsUp,
  MessageSquareText,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BookSessionModal } from '@/components/BookSessionModal';

interface MentorProfileData {
  mentor_id: string;
  hourly_rate: number;
  experience_years: number;
  rating: number;
  reviews_count: number;
  is_approved: boolean;
  average_response_time: number | null;
  response_rate: number | null;
  total_sessions_completed: number | null;
  total_earnings: number | null;
  github_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  video_intro_url: string | null;
  currency: string | null;
  users: {
    first_name: string;
    last_name: string;
    bio: string;
    profile_image: string;
    timezone: string;
    email: string;
    language_preference: string | null;
  };
  mentor_expertise: Array<{
    expertise_areas: {
      name: string;
      category: string;
    };
    proficiency_level: string;
    years_experience: number | null;
  }>;
}

interface Review {
  review_id: string;
  overall_rating: number;
  communication_rating: number | null;
  expertise_rating: number | null;
  helpfulness_rating: number | null;
  punctuality_rating: number | null;
  feedback: string | null;
  created_at: string | null;
  mentee: {
    first_name: string;
    last_name: string;
    profile_image: string | null;
  };
}

const MentorProfile = () => {
  const { mentorId } = useParams<{ mentorId: string }>();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState<MentorProfileData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookSessionModal, setShowBookSessionModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (mentorId) {
      loadMentorProfile();
      loadReviews();
    }
  }, [mentorId]);

  const loadMentorProfile = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('mentors')
        .select(`
          mentor_id,
          hourly_rate,
          experience_years,
          rating,
          reviews_count,
          is_approved,
          average_response_time,
          response_rate,
          total_sessions_completed,
          total_earnings,
          github_url,
          linkedin_url,
          portfolio_url,
          video_intro_url,
          currency,
          users (
            first_name,
            last_name,
            bio,
            profile_image,
            timezone,
            email,
            language_preference
          ),
          mentor_expertise (
            expertise_areas (
              name,
              category
            ),
            proficiency_level,
            years_experience
          )
        `)
        .eq('mentor_id', mentorId)
        .eq('is_approved', true)
        .single();

      if (error) throw error;
      setMentor(data);
    } catch (error) {
      console.error('Error loading mentor profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          review_id,
          overall_rating,
          communication_rating,
          expertise_rating,
          helpfulness_rating,
          punctuality_rating,
          feedback,
          created_at,
          mentee:mentees!reviews_mentee_id_fkey (
            first_name,
            last_name,
            profile_image
          )
        `)
        .eq('mentor_id', mentorId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const handleBookSession = () => {
    setShowBookSessionModal(true);
  };

  const handleMessage = () => {
    // TODO: Implement messaging functionality
    console.log('Message mentor:', mentor?.mentor_id);
  };

  const handleSave = () => {
    // TODO: Implement save/favorite functionality
    console.log('Save mentor:', mentor?.mentor_id);
  };

  const formatResponseTime = (minutes: number | null) => {
    if (!minutes) return 'Unknown';
    if (minutes < 60) return `${minutes} minutes`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hours`;
    return `${Math.floor(minutes / 1440)} days`;
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading mentor profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Mentor Not Found</h1>
            <p className="text-gray-600 mb-6">The mentor you're looking for doesn't exist or isn't available.</p>
            <Button onClick={() => navigate('/mentors')} className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Mentors
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { users: user, mentor_expertise } = mentor;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/mentors')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Mentors
            </Button>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleSave}>
                <Heart className="h-4 w-4 mr-2" />
                Save
              </Button>
              {mentor.linkedin_url && (
                <Button variant="outline" asChild>
                  <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="px-4 py-3 bg-blue-900 text-white">
        <div className="text-sm">
          <span className="hover:text-blue-200 cursor-pointer" onClick={() => navigate('/')}>Home</span>
          <span className="mx-2">›</span>
          <span className="hover:text-blue-200 cursor-pointer" onClick={() => navigate('/mentors')}>Find a Mentor</span>
          <span className="mx-2">›</span>
          <span>{user.first_name} {user.last_name}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Mentor Profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <Card className="bg-gradient-to-br from-blue-900 to-blue-800 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-start space-x-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                      <AvatarImage src={user.profile_image || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-2xl font-semibold">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-6 h-6 border-2 border-white flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">
                        <Star className="h-3 w-3 mr-1" />
                        Top Mentor
                      </Badge>
                      {mentor.total_sessions_completed && mentor.total_sessions_completed > 50 && (
                        <Badge className="bg-purple-500 hover:bg-purple-600 text-white border-0">
                          <Award className="h-3 w-3 mr-1" />
                          Experienced
                        </Badge>
                      )}
                    </div>
                    
                    <h1 className="text-3xl font-bold mb-2">
                      {user.first_name} {user.last_name}
                    </h1>
                    
                    <p className="text-xl text-blue-100 mb-4">
                      {mentor.experience_years}+ Years Experience • {user.timezone}
                    </p>
                    
                    <div className="bg-green-600 text-white px-4 py-2 rounded-lg inline-block mb-4">
                      <span className="font-semibold">Free 30 min intro call</span>
                      <span className="text-green-100 ml-2">in 7-Day Trial Period</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-blue-300" />
                        <span>{user.timezone}</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-2 text-yellow-400" />
                        <span>{mentor.rating.toFixed(1)} ({mentor.reviews_count} reviews)</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-green-400" />
                        <span>Active today</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                        <span>Usually responds in {formatResponseTime(mentor.average_response_time)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs Navigation */}
            <Card>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-gray-50">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-white">Overview</TabsTrigger>
                    <TabsTrigger value="expertise" className="data-[state=active]:bg-white">Expertise</TabsTrigger>
                    <TabsTrigger value="reviews" className="data-[state=active]:bg-white">Reviews</TabsTrigger>
                    <TabsTrigger value="availability" className="data-[state=active]:bg-white">Availability</TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="p-6">
                    <div className="space-y-6">
                      {/* About Section */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                        <p className="text-gray-700 leading-relaxed">
                          {user.bio || "Experienced professional passionate about helping others grow in their careers. With years of industry experience and a proven track record of success, I'm committed to sharing knowledge and guiding mentees toward their goals. Let's work together to achieve your career objectives!"}
                        </p>
                      </div>

                      {/* Experience & Stats */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Experience & Performance</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center bg-blue-50 rounded-lg p-4">
                            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-blue-700">{mentor.experience_years}+</div>
                            <div className="text-sm text-blue-600">Years Experience</div>
                          </div>
                          <div className="text-center bg-green-50 rounded-lg p-4">
                            <BookOpen className="h-8 w-8 text-green-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-green-700">{mentor.total_sessions_completed || 0}+</div>
                            <div className="text-sm text-green-600">Sessions Completed</div>
                          </div>
                          <div className="text-center bg-purple-50 rounded-lg p-4">
                            <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-purple-700">{mentor.response_rate || 0}%</div>
                            <div className="text-sm text-purple-600">Response Rate</div>
                          </div>
                          <div className="text-center bg-orange-50 rounded-lg p-4">
                            <Clock3 className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-orange-700">{formatResponseTime(mentor.average_response_time)}</div>
                            <div className="text-sm text-orange-600">Avg Response</div>
                          </div>
                        </div>
                      </div>

                      {/* Portfolio Links */}
                      {(mentor.github_url || mentor.portfolio_url || mentor.video_intro_url) && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Portfolio & Links</h3>
                          <div className="flex flex-wrap gap-3">
                            {mentor.github_url && (
                              <Button variant="outline" asChild className="border-gray-300">
                                <a href={mentor.github_url} target="_blank" rel="noopener noreferrer">
                                  <Github className="h-4 w-4 mr-2" />
                                  GitHub
                                  <ExternalLink className="h-3 w-3 ml-2" />
                                </a>
                              </Button>
                            )}
                            {mentor.portfolio_url && (
                              <Button variant="outline" asChild className="border-gray-300">
                                <a href={mentor.portfolio_url} target="_blank" rel="noopener noreferrer">
                                  <Globe className="h-4 w-4 mr-2" />
                                  Portfolio
                                  <ExternalLink className="h-3 w-3 ml-2" />
                                </a>
                              </Button>
                            )}
                            {mentor.video_intro_url && (
                              <Button variant="outline" asChild className="border-gray-300">
                                <a href={mentor.video_intro_url} target="_blank" rel="noopener noreferrer">
                                  <MessageSquareText className="h-4 w-4 mr-2" />
                                  Video Intro
                                  <ExternalLink className="h-3 w-3 ml-2" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Expertise Tab */}
                  <TabsContent value="expertise" className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills & Expertise</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {mentor_expertise.map((expertise, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900">{expertise.expertise_areas.name}</h4>
                                <Badge variant="secondary" className="text-xs">
                                  {expertise.proficiency_level}
                                </Badge>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock className="h-3 w-3 mr-1" />
                                {expertise.years_experience || 0} years experience
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Category: {expertise.expertise_areas.category}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Reviews Tab */}
                  <TabsContent value="reviews" className="p-6">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Reviews & Feedback</h3>
                        <div className="text-sm text-gray-600">
                          {reviews.length} reviews • {mentor.rating.toFixed(1)} average rating
                        </div>
                      </div>
                      
                      {reviews.length > 0 ? (
                        <div className="space-y-4">
                          {reviews.map((review) => (
                            <div key={review.review_id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={review.mentee.profile_image || undefined} />
                                    <AvatarFallback className="text-xs">
                                      {review.mentee.first_name?.[0]}{review.mentee.last_name?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {review.mentee.first_name} {review.mentee.last_name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'Recently'}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                                  <span className="font-medium">{review.overall_rating}</span>
                                </div>
                              </div>
                              
                              {review.feedback && (
                                <p className="text-gray-700 mb-3">{review.feedback}</p>
                              )}
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                {review.communication_rating && (
                                  <div className="flex items-center">
                                    <MessageSquareText className="h-3 w-3 mr-1 text-blue-500" />
                                    <span>Communication: {review.communication_rating}</span>
                                  </div>
                                )}
                                {review.expertise_rating && (
                                  <div className="flex items-center">
                                    <Target className="h-3 w-3 mr-1 text-green-500" />
                                    <span>Expertise: {review.expertise_rating}</span>
                                  </div>
                                )}
                                {review.helpfulness_rating && (
                                  <div className="flex items-center">
                                    <ThumbsUp className="h-3 w-3 mr-1 text-purple-500" />
                                    <span>Helpfulness: {review.helpfulness_rating}</span>
                                  </div>
                                )}
                                {review.punctuality_rating && (
                                  <div className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1 text-orange-500" />
                                    <span>Punctuality: {review.punctuality_rating}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <MessageSquareText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>No reviews yet. Be the first to review this mentor!</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Availability Tab */}
                  <TabsContent value="availability" className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability & Response</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                              <span className="font-medium text-green-800">Available Today</span>
                            </div>
                            <p className="text-sm text-green-700">
                              This mentor is currently available for sessions and responds quickly to inquiries.
                            </p>
                          </div>
                          
                          <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <Clock className="h-5 w-5 text-blue-600 mr-2" />
                              <span className="font-medium text-blue-800">Response Time</span>
                            </div>
                            <p className="text-sm text-blue-700">
                              Usually responds within {formatResponseTime(mentor.average_response_time)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <h4 className="font-medium text-gray-900 mb-3">Typical Availability</h4>
                          <div className="grid grid-cols-7 gap-2 text-center text-sm">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                              <div key={day} className="p-2 bg-gray-100 rounded">
                                <div className="font-medium text-gray-700">{day}</div>
                                <div className="text-green-600">✓</div>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Available during business hours in {user.timezone}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Pricing & Booking */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <Card className="border-blue-200 shadow-lg">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    ${mentor.hourly_rate}/hr
                  </div>
                  <p className="text-gray-600">
                    The most popular way to get mentored, let's work towards your goals!
                  </p>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-blue-600 mr-3" />
                    <span>2 calls per month (60min/call)</span>
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="h-5 w-5 text-blue-600 mr-3" />
                    <span>Unlimited Q&A via chat</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-blue-600 mr-3" />
                    <span>Expect responses in {formatResponseTime(mentor.average_response_time)}</span>
                  </div>
                  <div className="flex items-center">
                    <Briefcase className="h-5 w-5 text-blue-600 mr-3" />
                    <span>Hands-on support</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleBookSession}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-lg"
                >
                  Apply now
                </Button>
                
                <div className="text-center mt-3">
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <Zap className="h-4 w-4 mr-1 text-yellow-500" />
                    Only 1 spot left!
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trial Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center text-blue-800">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="font-semibold">7-day free trial</span>
                </div>
                <p className="text-blue-700 text-sm mt-1">
                  Cancel anytime. What's included?
                </p>
              </CardContent>
            </Card>

            {/* Contact Options */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Get in Touch</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleMessage}
                  variant="outline" 
                  className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button 
                  onClick={handleBookSession}
                  variant="outline" 
                  className="w-full border-green-200 text-green-600 hover:bg-green-50"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Call
                </Button>
              </CardContent>
            </Card>

            {/* Mentor Stats */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Mentor Stats</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Response Rate</span>
                  <span className="font-medium">{mentor.response_rate || 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Response Time</span>
                  <span className="font-medium">{formatResponseTime(mentor.average_response_time)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Sessions Completed</span>
                  <span className="font-medium">{mentor.total_sessions_completed || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Languages</span>
                  <span className="font-medium">{user.language_preference || 'English'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Book Session Modal */}
      {showBookSessionModal && mentor && (
        <BookSessionModal
          mentorId={mentor.mentor_id}
          mentorName={`${user.first_name} ${user.last_name}`}
          isOpen={showBookSessionModal}
          onClose={() => setShowBookSessionModal(false)}
        />
      )}
    </div>
  );
};

export default MentorProfile; 