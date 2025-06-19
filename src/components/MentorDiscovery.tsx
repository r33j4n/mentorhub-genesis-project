
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MentorCard } from './MentorCard';
import { BookSessionModal } from './BookSessionModal';
import { toast } from '@/components/ui/use-toast';
import { Search, Filter, Users, Star } from 'lucide-react';

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

export const MentorDiscovery = () => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
  const [expertiseAreas, setExpertiseAreas] = useState<ExpertiseArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [sortBy, setSortBy] = useState('rating');

  useEffect(() => {
    loadMentors();
    loadExpertiseAreas();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [mentors, searchTerm, selectedExpertise, priceRange, sortBy]);

  const loadMentors = async () => {
    console.log('Loading mentors...');
    try {
      const { data, error } = await supabase
        .from('mentors')
        .select(`
          mentor_id,
          hourly_rate,
          experience_years,
          rating,
          reviews_count,
          users!mentors_mentor_id_fkey (
            first_name,
            last_name,
            bio,
            profile_image,
            timezone
          ),
          mentor_expertise (
            expertise_areas (
              name,
              category
            )
          )
        `)
        .eq('is_approved', true)
        .order('rating', { ascending: false });

      console.log('Mentors data:', data);
      console.log('Mentors error:', error);

      if (error) {
        console.error('Error fetching mentors:', error);
        toast({
          title: "Error loading mentors",
          description: error.message,
          variant: "destructive"
        });
      } else {
        // Filter out mentors without user data
        const validMentors = (data || []).filter(mentor => mentor.users);
        console.log('Valid mentors:', validMentors);
        setMentors(validMentors);
      }
    } catch (error: any) {
      console.error('Unexpected error:', error);
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
    const { data, error } = await supabase
      .from('expertise_areas')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (!error) {
      setExpertiseAreas(data || []);
    }
  };

  const applyFilters = () => {
    let filtered = [...mentors];

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(mentor => {
        const fullName = `${mentor.users.first_name} ${mentor.users.last_name}`.toLowerCase();
        const bio = mentor.users.bio?.toLowerCase() || '';
        const expertise = mentor.mentor_expertise.map(exp => exp.expertise_areas.name.toLowerCase()).join(' ');
        
        return fullName.includes(searchLower) || 
               bio.includes(searchLower) || 
               expertise.includes(searchLower);
      });
    }

    // Expertise filter
    if (selectedExpertise && selectedExpertise !== 'all') {
      filtered = filtered.filter(mentor =>
        mentor.mentor_expertise.some(exp => exp.expertise_areas.name === selectedExpertise)
      );
    }

    // Price range filter
    if (priceRange && priceRange !== 'any') {
      const [min, max] = priceRange.split('-').map(Number);
      filtered = filtered.filter(mentor => {
        if (max) {
          return mentor.hourly_rate >= min && mentor.hourly_rate <= max;
        } else {
          return mentor.hourly_rate >= min;
        }
      });
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
    setPriceRange('');
    setSortBy('rating');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Find Your Perfect Mentor</h1>
          <p className="text-xl text-gray-600">Connect with experienced professionals who can guide your career journey</p>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              Search & Filter Mentors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search by name, skills, or expertise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-lg border-2 border-gray-200 focus:border-blue-500 transition-colors"
                />
              </div>
              
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
                
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="Price Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Price</SelectItem>
                    <SelectItem value="0-50">$0 - $50/hr</SelectItem>
                    <SelectItem value="50-100">$50 - $100/hr</SelectItem>
                    <SelectItem value="100-200">$100 - $200/hr</SelectItem>
                    <SelectItem value="200-999">$200+/hr</SelectItem>
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
                
                <Button variant="outline" onClick={clearFilters} className="h-12 border-2 hover:bg-gray-50">
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Available Mentors</h2>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {filteredMentors.length} mentor{filteredMentors.length !== 1 ? 's' : ''} found
          </Badge>
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
                      : "No mentors match your current search criteria. Try adjusting your filters."
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">{mentors.length}</div>
                  <div className="text-gray-600">Expert Mentors</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {Math.round(mentors.reduce((acc, m) => acc + m.rating, 0) / mentors.length * 10) / 10}
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
