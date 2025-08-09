import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  Users, 
  Calendar, 
  MessageCircle,
  CheckCircle,
  DollarSign,
  Clock,
  MapPin,
  BookOpen,
  Award,
  ArrowLeft
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';

interface ExpertiseArea {
  area_id: string;
  name: string;
  category: string;
}

interface Mentor {
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
}

export const Mentors = () => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
  const [expertiseAreas, setExpertiseAreas] = useState<ExpertiseArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [experienceRange, setExperienceRange] = useState([0, 20]);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);

  useEffect(() => {
    loadMentors();
    loadExpertiseAreas();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [mentors, searchTerm, selectedExpertise, priceRange, experienceRange, ratingFilter, sortBy, selectedCategories]);

  const loadMentors = async () => {
    console.log('Starting to load mentors...');
    setLoading(true);
    
    try {
      const { data: mentorsData, error: mentorsError } = await supabase
        .from('mentors')
        .select(`
          *,
          users:mentors_mentor_id_fkey (
            first_name,
            last_name,
            bio,
            profile_image,
            timezone
          )
        `)
        .order('created_at', { ascending: false });

      console.log('Mentors query result:', { mentorsData, mentorsError });

      if (mentorsError) {
        console.error('Error fetching mentors:', mentorsError);
        toast({
          title: "Error loading mentors",
          description: mentorsError.message,
          variant: "destructive"
        });
        return;
      }

      if (!mentorsData || mentorsData.length === 0) {
        console.log('No mentors found in database');
        setMentors([]);
        return;
      }

      const mentorsWithUserData = await Promise.all(
        mentorsData.map(async (mentor) => {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', mentor.mentor_id)
            .single();

          if (userError) {
            console.error('Error fetching user data:', userError);
            return null;
          }

          const { data: expertiseData, error: expertiseError } = await supabase
            .from('mentor_expertise')
            .select(`
              expertise_areas (
                name,
                category
              )
            `)
            .eq('mentor_id', mentor.mentor_id);

          if (expertiseError) {
            console.error('Error fetching expertise:', expertiseError);
          }

          return {
            ...mentor,
            users: userData,
            mentor_expertise: expertiseData || []
          };
        })
      );

      const validMentors = mentorsWithUserData.filter(mentor => mentor !== null);
      console.log('Final mentors data:', validMentors);
      console.log('Total mentors loaded:', validMentors.length);
      setMentors(validMentors);
    } catch (error: any) {
      console.error('Error in loadMentors:', error);
      toast({
        title: "Error loading mentors",
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
        .order('category');

      if (error) throw error;
      setExpertiseAreas(data || []);
    } catch (error: any) {
      console.error('Error loading expertise areas:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...mentors];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(mentor => {
        const fullName = `${mentor.users.first_name} ${mentor.users.last_name}`.toLowerCase();
        const bio = mentor.users.bio?.toLowerCase() || '';
        const expertise = mentor.mentor_expertise
          .map(e => e.expertise_areas.name.toLowerCase())
          .join(' ');
        
        return fullName.includes(searchLower) || 
               bio.includes(searchLower) || 
               expertise.includes(searchLower);
      });
    }

    // Expertise filter
    if (selectedExpertise && selectedExpertise !== 'all') {
      filtered = filtered.filter(mentor =>
        mentor.mentor_expertise.some(e => e.expertise_areas.name === selectedExpertise)
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(mentor =>
        mentor.mentor_expertise.some(e => 
          selectedCategories.includes(e.expertise_areas.category)
        )
      );
    }

    // Price range filter
    filtered = filtered.filter(mentor =>
      mentor.hourly_rate >= priceRange[0] && mentor.hourly_rate <= priceRange[1]
    );

    // Experience range filter
    filtered = filtered.filter(mentor =>
      mentor.experience_years >= experienceRange[0] && mentor.experience_years <= experienceRange[1]
    );

    // Rating filter
    if (ratingFilter > 0) {
      filtered = filtered.filter(mentor => mentor.rating >= ratingFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'price_low':
          return a.hourly_rate - b.hourly_rate;
        case 'price_high':
          return b.hourly_rate - a.hourly_rate;
        case 'experience':
          return b.experience_years - a.experience_years;
        default:
          return 0;
      }
    });

    setFilteredMentors(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedExpertise('');
    setPriceRange([0, 500]);
    setExperienceRange([0, 20]);
    setRatingFilter(0);
    setSortBy('rating');
    setSelectedCategories([]);
  };

  const getUniqueCategories = () => {
    const categories = new Set<string>();
    expertiseAreas.forEach(area => categories.add(area.category));
    return Array.from(categories);
  };

  const getAvailabilityStatus = (mentor: Mentor) => {
    // Mock availability - in real app this would come from database
    const isAvailable = Math.random() > 0.3;
    return {
      available: isAvailable,
      text: isAvailable ? 'Available' : 'Busy',
      color: isAvailable ? 'text-green-600' : 'text-orange-600'
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="px-4 py-12">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading amazing mentors for you...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Find Your Perfect Mentor</h1>
              <p className="text-xl text-gray-600">Connect with experienced professionals who can guide your career journey</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{mentors.length}</div>
            <div className="text-gray-600">Available Mentors</div>
          </div>
        </div>

        {/* Advanced Search and Filters */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              Advanced Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search by name, skills, or expertise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-lg border-2 border-gray-200 focus:border-blue-500 transition-colors"
                />
              </div>
              
              {/* Quick Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={selectedExpertise} onValueChange={setSelectedExpertise}>
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="Expertise Area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Areas</SelectItem>
                    {expertiseAreas.map(area => (
                      <SelectItem key={area.area_id} value={area.name}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                    <SelectItem value="experience">Most Experience</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="h-12 border-2 hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                  {showAdvancedFilters ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                </Button>
                
                <Button variant="outline" onClick={clearFilters} className="h-12 border-2 hover:bg-gray-50">
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price Range: ${priceRange[0]} - ${priceRange[1]}
                    </label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={500}
                      min={0}
                      step={10}
                      className="w-full"
                    />
                  </div>

                  {/* Experience Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience: {experienceRange[0]} - {experienceRange[1]} years
                    </label>
                    <Slider
                      value={experienceRange}
                      onValueChange={setExperienceRange}
                      max={20}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Rating: {ratingFilter}★
                    </label>
                    <Slider
                      value={[ratingFilter]}
                      onValueChange={(value) => setRatingFilter(value[0])}
                      max={5}
                      min={0}
                      step={0.5}
                      className="w-full"
                    />
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categories
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {getUniqueCategories().map(category => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={category}
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCategories([...selectedCategories, category]);
                              } else {
                                setSelectedCategories(selectedCategories.filter(c => c !== category));
                              }
                            }}
                          />
                          <label htmlFor={category} className="text-sm text-gray-700">
                            {category}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Available Mentors</h2>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              {mentors.length} total mentors
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {filteredMentors.length} mentor{filteredMentors.length !== 1 ? 's' : ''} found
            </Badge>
          </div>
        </div>

        {/* Results */}
        {filteredMentors.length === 0 ? (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="text-center py-16">
              <div className="space-y-4">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="h-12 w-12 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No mentors found</h3>
                  <p className="text-gray-600 mb-6">
                    {mentors.length === 0 
                      ? "We're working on adding more mentors to our platform. Please check back soon!"
                      : `No mentors match your current search criteria. There are ${mentors.length} total mentors available. Try adjusting your filters or click "Clear All" to see everyone.`
                    }
                  </p>
                  {mentors.length > 0 && (
                    <Button variant="outline" onClick={clearFilters} className="hover:bg-blue-50">
                      <Filter className="h-4 w-4 mr-2" />
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMentors.map(mentor => (
              <Card key={mentor.mentor_id} className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="relative pb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-50"></div>
                  <div className="relative flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={mentor.users.profile_image} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg">
                        {mentor.users.first_name[0]}{mentor.users.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {mentor.users.first_name} {mentor.users.last_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="ml-1 text-sm font-medium">{mentor.rating.toFixed(1)}</span>
                          <span className="ml-1 text-sm text-gray-500">({mentor.reviews_count} reviews)</span>
                        </div>
                        <div className={`flex items-center text-sm ${getAvailabilityStatus(mentor).color}`}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {getAvailabilityStatus(mentor).text}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Bio */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {mentor.users.bio || "Experienced professional with a passion for mentoring and helping others grow in their careers."}
                    </p>
                  </div>

                  {/* Expertise */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Expertise</span>
                      <Badge variant="secondary" className="text-xs">
                        {mentor.mentor_expertise.length} areas
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {mentor.mentor_expertise.slice(0, 3).map((expertise, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {expertise.expertise_areas.name}
                        </Badge>
                      ))}
                      {mentor.mentor_expertise.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{mentor.mentor_expertise.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{mentor.experience_years}</div>
                      <div className="text-xs text-gray-500">Years Exp.</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{Math.floor(Math.random() * 50) + 20}%</div>
                      <div className="text-xs text-gray-500">Success Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{Math.floor(Math.random() * 12) + 2}h</div>
                      <div className="text-xs text-gray-500">Response</div>
                    </div>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                      <span className="font-semibold text-green-600">${mentor.hourly_rate}/hr</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                      <Button size="sm">
                        <Calendar className="h-4 w-4 mr-1" />
                        Book Session
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Mentors; 