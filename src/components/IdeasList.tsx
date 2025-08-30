import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Lightbulb, 
  TrendingUp, 
  Clock,
  Building,
  DollarSign
} from 'lucide-react';
import { Idea, IdeaService } from '@/services/ideaService';
import { IdeaCard } from './IdeaCard';
import { CreateIdeaModal } from './CreateIdeaModal';
import { useToast } from '@/hooks/use-toast';

interface IdeasListProps {
  isMentee?: boolean;
  menteeId?: string;
}

const INDUSTRIES = [
  'All Industries',
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'E-commerce',
  'Food & Beverage',
  'Real Estate',
  'Transportation',
  'Entertainment',
  'Manufacturing',
  'Energy',
  'Other',
];

const STAGES = [
  'All Stages',
  'idea',
  'prototype',
  'mvp',
  'early_traction',
  'scaling',
];

const FUNDING_RANGES = [
  'Any Amount',
  'Under $10K',
  '$10K - $50K',
  '$50K - $100K',
  '$100K - $500K',
  '$500K+',
];

export function IdeasList({ isMentee = false, menteeId }: IdeasListProps) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All Industries');
  const [selectedStage, setSelectedStage] = useState('All Stages');
  const [selectedFunding, setSelectedFunding] = useState('Any Amount');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'views' | 'funding'>('newest');
  const { toast } = useToast();

  useEffect(() => {
    loadIdeas();
  }, [isMentee, menteeId]);

  useEffect(() => {
    filterAndSortIdeas();
  }, [ideas, searchTerm, selectedIndustry, selectedStage, selectedFunding, sortBy]);

  const loadIdeas = async () => {
    setLoading(true);
    try {
      let ideasData: Idea[];
      if (isMentee && menteeId) {
        ideasData = await IdeaService.getIdeasByMentee(menteeId);
      } else {
        ideasData = await IdeaService.getActiveIdeas();
      }
      setIdeas(ideasData);
    } catch (error) {
      console.error('Error loading ideas:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ideas. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortIdeas = () => {
    let filtered = [...ideas];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(idea =>
        idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.mentee?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.mentee?.last_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Industry filter
    if (selectedIndustry !== 'All Industries') {
      filtered = filtered.filter(idea => idea.industry === selectedIndustry);
    }

    // Stage filter
    if (selectedStage !== 'All Stages') {
      filtered = filtered.filter(idea => idea.stage === selectedStage);
    }

    // Funding filter
    if (selectedFunding !== 'Any Amount') {
      filtered = filtered.filter(idea => {
        if (!idea.funding_needed) return false;
        
        switch (selectedFunding) {
          case 'Under $10K':
            return idea.funding_needed < 10000;
          case '$10K - $50K':
            return idea.funding_needed >= 10000 && idea.funding_needed < 50000;
          case '$50K - $100K':
            return idea.funding_needed >= 50000 && idea.funding_needed < 100000;
          case '$100K - $500K':
            return idea.funding_needed >= 100000 && idea.funding_needed < 500000;
          case '$500K+':
            return idea.funding_needed >= 500000;
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'views':
          return b.views_count - a.views_count;
        case 'funding':
          return (b.funding_needed || 0) - (a.funding_needed || 0);
        default:
          return 0;
      }
    });

    setFilteredIdeas(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedIndustry('All Industries');
    setSelectedStage('All Stages');
    setSelectedFunding('Any Amount');
    setSortBy('newest');
  };

  const getStats = () => {
    const totalIdeas = ideas.length;
    const activeIdeas = ideas.filter(idea => idea.is_active).length;
    const totalViews = ideas.reduce((sum, idea) => sum + idea.views_count, 0);
    const totalFunding = ideas.reduce((sum, idea) => sum + (idea.funding_needed || 0), 0);

    return { totalIdeas, activeIdeas, totalViews, totalFunding };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-yellow-500" />
            {isMentee ? 'My Business Ideas' : 'Business Ideas Marketplace'}
          </h1>
          <p className="text-muted-foreground">
            {isMentee 
              ? 'Manage and track your posted business ideas'
              : 'Discover innovative business ideas from mentees'
            }
          </p>
        </div>
        {isMentee && <CreateIdeaModal onIdeaCreated={loadIdeas} />}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Ideas</p>
                <p className="text-2xl font-bold">{stats.totalIdeas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Ideas</p>
                <p className="text-2xl font-bold">{stats.activeIdeas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{stats.totalViews}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Funding</p>
                <p className="text-2xl font-bold">
                  ${(stats.totalFunding / 1000).toFixed(0)}K
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search ideas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Industry</label>
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Stage</label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage === 'All Stages' ? stage : stage.charAt(0).toUpperCase() + stage.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Funding Range</label>
              <Select value={selectedFunding} onValueChange={setSelectedFunding}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUNDING_RANGES.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Sort by:</label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="views">Most Views</SelectItem>
                  <SelectItem value="funding">Highest Funding</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredIdeas.length} of {ideas.length} ideas
          </p>
          {filteredIdeas.length > 0 && (
            <Badge variant="secondary">
              {filteredIdeas.length} result{filteredIdeas.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {filteredIdeas.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No ideas found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedIndustry !== 'All Industries' || selectedStage !== 'All Stages' || selectedFunding !== 'Any Amount'
                  ? 'Try adjusting your filters to see more results.'
                  : isMentee
                    ? 'You haven\'t posted any ideas yet. Create your first idea to get started!'
                    : 'No ideas are currently available. Check back later!'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                isOwner={isMentee && idea.mentee_id === menteeId}
                onUpdate={loadIdeas}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 