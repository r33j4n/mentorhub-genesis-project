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
import { Search, Filter, Users, Star, MapPin, Clock, DollarSign, Award, X, ChevronDown, ChevronUp, Stethoscope, Briefcase, GraduationCap, Heart, Scale, Palette, Dumbbell, Calculator, Home, Megaphone, Users2, Wrench, Music, HandHeart, Leaf, Building2, Globe, Newspaper, Shield } from 'lucide-react';

interface ExpertiseArea {
  area_id: string;
  name: string;
  category: string;
  domain_id?: string;
}

interface ProfessionalDomain {
  id: string;
  name: string;
  description: string;
  display_order: number;
}

interface Mentor {
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
      domain_id?: string;
    };
  }>;
}

export const MentorDiscovery = () => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
  const [expertiseAreas, setExpertiseAreas] = useState<ExpertiseArea[]>([]);
  const [professionalDomains, setProfessionalDomains] = useState<ProfessionalDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  
  // Advanced Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [experienceRange, setExperienceRange] = useState([0, 20]);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [sortBy, setSortBy] = useState('rating');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [consultationType, setConsultationType] = useState('');
  const [licensedOnly, setLicensedOnly] = useState(false);
  const [acceptsInsurance, setAcceptsInsurance] = useState(false);

  useEffect(() => {
    loadMentors();
    loadExpertiseAreas();
    loadProfessionalDomains();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [mentors, searchTerm, selectedExpertise, selectedDomain, priceRange, experienceRange, ratingFilter, sortBy, selectedCategories, consultationType, licensedOnly, acceptsInsurance]);

  const loadMentors = async () => {
    console.log('Starting to load mentors...');
    setLoading(true);
    
    try {
      // Enhanced query to include professional fields
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
          ),
          mentor_expertise (
            expertise_areas (
              name,
              category,
              domain_id
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
        console.log('No mentors found');
        setMentors([]);
        setFilteredMentors([]);
        setLoading(false);
        return;
      }

      console.log('Loaded mentors:', mentorsData.length);
      setMentors(mentorsData);
      setFilteredMentors(mentorsData);
    } catch (error) {
      console.error('Error loading mentors:', error);
      toast({
        title: "Error loading mentors",
        description: "Please try again later.",
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
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading expertise areas:', error);
        return;
      }

      setExpertiseAreas(data || []);
    } catch (error) {
      console.error('Error loading expertise areas:', error);
    }
  };

  const loadProfessionalDomains = async () => {
    try {
      const { data, error } = await supabase
        .from('professional_domains')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error loading professional domains:', error);
        return;
      }

      setProfessionalDomains(data || []);
    } catch (error) {
      console.error('Error loading professional domains:', error);
    }
  };

  const getDomainIcon = (domainName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'Healthcare & Medicine': <Stethoscope className="h-4 w-4" />,
      'Mental Health & Counseling': <Heart className="h-4 w-4" />,
      'Business & Professional Development': <Briefcase className="h-4 w-4" />,
      'Legal & Professional Services': <Scale className="h-4 w-4" />,
      'Education & Training': <GraduationCap className="h-4 w-4" />,
      'Technology & IT': <Wrench className="h-4 w-4" />,
      'Creative & Media': <Palette className="h-4 w-4" />,
      'Fitness & Wellness': <Dumbbell className="h-4 w-4" />,
      'Finance & Investment': <Calculator className="h-4 w-4" />,
      'Real Estate': <Home className="h-4 w-4" />,
      'Marketing & Sales': <Megaphone className="h-4 w-4" />,
      'Human Resources': <Users2 className="h-4 w-4" />,
      'Engineering': <Wrench className="h-4 w-4" />,
      'Science & Research': <Wrench className="h-4 w-4" />,
      'Arts & Entertainment': <Music className="h-4 w-4" />,
      'Social Services': <HandHeart className="h-4 w-4" />,
      'Environmental & Sustainability': <Leaf className="h-4 w-4" />,
      'Government & Public Policy': <Building2 className="h-4 w-4" />,
      'Nonprofit & Social Impact': <Globe className="h-4 w-4" />,
      'Other': <Shield className="h-4 w-4" />
    };
    return iconMap[domainName] || <Users className="h-4 w-4" />;
  };

  const applyFilters = () => {
    let filtered = [...mentors];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(mentor => {
        const fullName = `${mentor.users.first_name} ${mentor.users.last_name}`.toLowerCase();
        const bio = mentor.users.bio?.toLowerCase() || '';
        const title = mentor.professional_title?.toLowerCase() || '';
        const expertise = mentor.mentor_expertise
          .map(e => e.expertise_areas.name.toLowerCase())
          .join(' ');
        
        return fullName.includes(searchLower) || 
               bio.includes(searchLower) || 
               title.includes(searchLower) ||
               expertise.includes(searchLower);
      });
    }

    // Domain filter
    if (selectedDomain) {
      filtered = filtered.filter(mentor => 
        mentor.mentor_expertise.some(expertise => 
          expertise.expertise_areas.domain_id === selectedDomain
        )
      );
    }

    // Expertise filter
    if (selectedExpertise) {
      filtered = filtered.filter(mentor => 
        mentor.mentor_expertise.some(expertise => 
          expertise.expertise_areas.name === selectedExpertise
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

    // Consultation type filter
    if (consultationType) {
      filtered = filtered.filter(mentor => mentor.consultation_type === consultationType);
    }

    // Licensed only filter
    if (licensedOnly) {
      filtered = filtered.filter(mentor => mentor.is_licensed && mentor.license_verified);
    }

    // Accepts insurance filter
    if (acceptsInsurance) {
      filtered = filtered.filter(mentor => mentor.accepts_insurance);
    }

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'experience':
          return b.experience_years - a.experience_years;
        case 'price_low':
          return a.hourly_rate - b.hourly_rate;
        case 'price_high':
          return b.hourly_rate - a.hourly_rate;
        case 'name':
          return `${a.users.first_name} ${a.users.last_name}`.localeCompare(`${b.users.first_name} ${b.users.last_name}`);
        default:
          return 0;
      }
    });

    setFilteredMentors(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedExpertise('');
    setSelectedDomain('');
    setPriceRange([0, 500]);
    setExperienceRange([0, 20]);
    setRatingFilter(0);
    setSortBy('rating');
    setSelectedCategories([]);
    setConsultationType('');
    setLicensedOnly(false);
    setAcceptsInsurance(false);
  };

  const getDomainMentorCount = (domainId: string) => {
    return mentors.filter(mentor => 
      mentor.mentor_expertise.some(expertise => 
        expertise.expertise_areas.domain_id === domainId
      )
    ).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Your Perfect Professional
          </h1>
          <p className="text-xl text-gray-600">
            Connect with experienced professionals across healthcare, legal, business, technology, and more for personalized guidance and support
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Search for any skill, title, or professional
                  </label>
                  <Input
                    placeholder="e.g., Cardiologist, React, Business Strategy"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Mentor Count */}
                <div className="text-sm text-gray-600">
                  {filteredMentors.length} professionals found
                </div>

                {/* Professional Domains */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Professional Domains</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {professionalDomains.map((domain) => (
                      <div key={domain.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`domain-${domain.id}`}
                          checked={selectedDomain === domain.id}
                          onCheckedChange={(checked) => 
                            setSelectedDomain(checked ? domain.id : '')
                          }
                        />
                        <label 
                          htmlFor={`domain-${domain.id}`}
                          className="text-sm text-gray-700 flex items-center gap-2 cursor-pointer"
                        >
                          {getDomainIcon(domain.name)}
                          {domain.name}
                          <Badge variant="secondary" className="ml-auto">
                            {getDomainMentorCount(domain.id)}
                          </Badge>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advanced Filters Toggle */}
                <Button
                  variant="outline"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="w-full"
                >
                  {showAdvancedFilters ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                  Advanced Filters
                </Button>

                {showAdvancedFilters && (
                  <div className="space-y-4">
                    {/* Consultation Type */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Consultation Type
                      </label>
                      <Select value={consultationType} onValueChange={setConsultationType}>
                        <SelectTrigger>
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All types</SelectItem>
                          <SelectItem value="video">Video Consultation</SelectItem>
                          <SelectItem value="phone">Phone Consultation</SelectItem>
                          <SelectItem value="in_person">In-Person</SelectItem>
                          <SelectItem value="chat">Chat Consultation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Professional Filters */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="licensed-only"
                          checked={licensedOnly}
                          onCheckedChange={(checked) => setLicensedOnly(checked as boolean)}
                        />
                        <label htmlFor="licensed-only" className="text-sm text-gray-700">
                          Licensed Professionals Only
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="accepts-insurance"
                          checked={acceptsInsurance}
                          onCheckedChange={(checked) => setAcceptsInsurance(checked as boolean)}
                        />
                        <label htmlFor="accepts-insurance" className="text-sm text-gray-700">
                          Accepts Insurance
                        </label>
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Price Range (per hour)
                      </label>
                      <div className="px-2">
                        <Slider
                          value={priceRange}
                          onValueChange={setPriceRange}
                          max={500}
                          min={0}
                          step={10}
                          className="w-full"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>${priceRange[0]}</span>
                        <span>${priceRange[1]}</span>
                      </div>
                    </div>

                    {/* Experience Range */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Years of Experience
                      </label>
                      <div className="px-2">
                        <Slider
                          value={experienceRange}
                          onValueChange={setExperienceRange}
                          max={20}
                          min={0}
                          step={1}
                          className="w-full"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{experienceRange[0]}+ years</span>
                        <span>{experienceRange[1]}+ years</span>
                      </div>
                    </div>

                    {/* Rating Filter */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Minimum Rating
                      </label>
                      <Select value={ratingFilter.toString()} onValueChange={(value) => setRatingFilter(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Any rating</SelectItem>
                          <SelectItem value="4">4+ stars</SelectItem>
                          <SelectItem value="4.5">4.5+ stars</SelectItem>
                          <SelectItem value="5">5 stars only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sort By */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Sort By
                      </label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rating">Highest Rated</SelectItem>
                          <SelectItem value="experience">Most Experienced</SelectItem>
                          <SelectItem value="price_low">Price: Low to High</SelectItem>
                          <SelectItem value="price_high">Price: High to Low</SelectItem>
                          <SelectItem value="name">Name: A to Z</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Clear Filters */}
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredMentors.length === 0 ? (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="text-center py-16">
                  <div className="space-y-4">
                    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                      <Users className="h-12 w-12 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No professionals found</h3>
                      <p className="text-gray-600 mb-6">
                        {mentors.length === 0 
                          ? "We're working on adding more professionals to our platform. Please check back soon!"
                          : `No professionals match your current search criteria. There are ${mentors.length} total professionals available. Try adjusting your filters or click "Clear All Filters" to see everyone.`
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
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mt-8">
                <CardContent className="py-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                    <div>
                      <div className="text-3xl font-bold text-blue-600 mb-2">{mentors.length}</div>
                      <div className="text-gray-600">Expert Professionals</div>
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
                        {professionalDomains.length}+
                      </div>
                      <div className="text-gray-600">Professional Domains</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-orange-600 mb-2">
                        {mentors.length > 0 ? Math.round(mentors.reduce((acc, m) => acc + m.experience_years, 0) / mentors.length) : 0}
                      </div>
                      <div className="text-gray-600">Avg. Experience</div>
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
      </div>
    </div>
  );
};
