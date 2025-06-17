import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MentorCard } from './MentorCard';
import { BookSessionModal } from './BookSessionModal';
import { toast } from '@/components/ui/use-toast';
import { Search, Filter } from 'lucide-react';

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

      if (error) throw error;
      setMentors(data || []);
    } catch (error: any) {
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
    if (searchTerm) {
      filtered = filtered.filter(mentor =>
        `${mentor.users.first_name} ${mentor.users.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.users.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.mentor_expertise.some(exp => 
          exp.expertise_areas.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Expertise filter
    if (selectedExpertise) {
      filtered = filtered.filter(mentor =>
        mentor.mentor_expertise.some(exp => exp.expertise_areas.name === selectedExpertise)
      );
    }

    // Price range filter
    if (priceRange) {
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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search mentors by name, skills, or bio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Select value={selectedExpertise} onValueChange={setSelectedExpertise}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Expertise Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Areas</SelectItem>
                {expertiseAreas.map(area => (
                  <SelectItem key={area.area_id} value={area.name}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Price</SelectItem>
                <SelectItem value="0-50">$0 - $50/hr</SelectItem>
                <SelectItem value="50-100">$50 - $100/hr</SelectItem>
                <SelectItem value="100-200">$100 - $200/hr</SelectItem>
                <SelectItem value="200-999">$200+/hr</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="experience">Most Experience</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={clearFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Available Mentors</h2>
          <Badge variant="secondary">
            {filteredMentors.length} mentor{filteredMentors.length !== 1 ? 's' : ''} found
          </Badge>
        </div>

        {filteredMentors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No mentors found matching your criteria.</p>
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMentors.map(mentor => (
              <MentorCard
                key={mentor.mentor_id}
                mentor={mentor}
                onBookSession={(mentorId) => setSelectedMentor(mentorId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Book Session Modal */}
      <BookSessionModal
        mentorId={selectedMentor}
        isOpen={!!selectedMentor}
        onClose={() => setSelectedMentor(null)}
      />
    </div>
  );
};
