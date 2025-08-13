import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { MentorCard } from './MentorCard';
import { BookSessionModal } from './BookSessionModal';
import { toast } from '@/components/ui/use-toast';
import { Search, Filter, Users, Star, MapPin, Clock, DollarSign, Award, X, ChevronDown, ChevronUp } from 'lucide-react';

interface ExpertiseArea {
  id: string;
  name: string;
  description: string;
}

interface Mentor {
  mentor_id: string;
  hourly_rate: number;
  rating: number;
  total_sessions: number;
  is_approved: boolean;
  users: {
    first_name: string;
    last_name: string;
    profile_image: string;
  };
  mentor_expertise: Array<{
    expertise_areas: {
      name: string;
      description: string;
    };
  }>;
}

export const MentorDiscovery = () => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
  const [expertiseAreas, setExpertiseAreas] = useState<ExpertiseArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  
  // Advanced Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState('');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [experienceRange, setExperienceRange] = useState([0, 20]);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [sortBy, setSortBy] = useState('rating');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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
      // First, let's get all mentors (including unapproved for testing)
      const { data: mentorsData, error: mentorsError } = await supabase
        .from('mentors')
        .select(`
          *,
          users (
            first_name,
            last_name,
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

      console.log('Mentors loaded:', mentorsData.length);
      console.log('Mentors with user data:', mentorsData.map(m => ({
        id: m.mentor_id,
        name: `${m.users?.first_name} ${m.users?.last_name}`,
        approved: m.is_approved,
        expertise: m.mentor_expertise?.length || 0
      })));
      setMentors(mentorsData);
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

  const applyFilters = () => {
    let filtered = [...mentors];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(mentor => {
        const fullName = `${mentor.users.first_name} ${mentor.users.last_name}`.toLowerCase();
        const expertise = mentor.mentor_expertise
          .map(e => e.expertise_areas.name.toLowerCase())
          .join(' ');
        
        return fullName.includes(searchLower) || 
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
          selectedCategories.includes(e.expertise_areas.description)
        )
      );
    }

    // Price range filter
    filtered = filtered.filter(mentor =>
      mentor.hourly_rate >= priceRange[0] && mentor.hourly_rate <= priceRange[1]
    );

    // Experience range filter - removed since experience_years field doesn't exist
    // filtered = filtered.filter(mentor =>
    //   mentor.experience_years >= experienceRange[0] && mentor.experience_years <= experienceRange[1]
    // );

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
          return b.total_sessions - a.total_sessions; // Use total_sessions instead of experience_years
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
    expertiseAreas.forEach(area => categories.add(area.description));
    return Array.from(categories);
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Find Your Perfect Mentor</h1>
          <p className="text-xl text-gray-600 mb-4">Connect with experienced professionals who can guide your career journey</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800 font-medium">
                Browse all {mentors.length} available mentors in our platform
              </span>
            </div>
            <p className="text-blue-700 text-sm">
              Use the filters below to narrow down your search and find the perfect mentor for your needs
            </p>
          </div>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="py-4">
              <p className="text-sm text-yellow-800">
                Debug: Found {mentors.length} total mentors, {filteredMentors.length} after filters
              </p>
            </CardContent>
          </Card>
        )}

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
                                      <SelectItem key={area.id} value={area.name}>
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
                
                <Button 
                  variant="default" 
                  onClick={() => {
                    clearFilters();
                    setSearchTerm('');
                  }} 
                  className="h-12 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Show All Mentors
                </Button>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price Range: ${priceRange[0]} - ${priceRange[1]}/hr
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
            <h2 className="text-2xl font-bold text-gray-900">All Available Mentors</h2>
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
                      : `No mentors match your current search criteria. There are ${mentors.length} total mentors available. Try adjusting your filters or click "Show All Mentors" to see everyone.`
                    }
                  </p>
                  {mentors.length > 0 && (
                    <Button variant="outline" onClick={clearFilters} className="hover:bg-blue-50">
                      <Filter className="h-4 w-4 mr-2" />
                      Clear All Filters
                    </Button>
                  )}
                  <div className="mt-4 text-sm text-gray-500">
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        console.log('Reloading mentors...');
                        loadMentors();
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Try reloading
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMentors.map(mentor => (
              <div key={mentor.mentor_id} className="transform transition-transform hover:scale-105">
                <MentorCard
                  mentor={mentor}
                  onBookSession={(mentorId) => setSelectedMentor(mentorId)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Stats Section */}
        {mentors.length > 0 && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="py-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">{mentors.length}</div>
                  <div className="text-gray-600">Expert Mentors</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {mentors.length > 0 ? Math.round(mentors.reduce((acc, m) => acc + m.rating, 0) / mentors.length * 10) / 10 : 0}
                  </div>
                  <div className="text-gray-600 flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400" />
                    Average Rating
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {expertiseAreas.length}+
                  </div>
                  <div className="text-gray-600">Expertise Areas</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {mentors.length > 0 ? Math.round(mentors.reduce((acc, m) => acc + m.total_sessions, 0) / mentors.length) : 0}
                  </div>
                  <div className="text-gray-600">Avg. Sessions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Book Session Modal */}
        <BookSessionModal
          mentorId={selectedMentor}
          isOpen={!!selectedMentor}
          onClose={() => setSelectedMentor(null)}
        />
      </div>
    </div>
  );
};
