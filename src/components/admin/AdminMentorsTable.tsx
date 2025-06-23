
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Edit, Check, X, Star, DollarSign } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { EditMentorModal } from './EditMentorModal';

interface Mentor {
  mentor_id: string;
  hourly_rate: number;
  experience_years: number;
  rating: number;
  reviews_count: number;
  is_approved: boolean;
  created_at: string;
  users: {
    first_name: string;
    last_name: string;
    email: string;
    profile_image: string;
  } | null;
}

interface AdminMentorsTableProps {
  onStatsChange: () => void;
}

export const AdminMentorsTable = ({ onStatsChange }: AdminMentorsTableProps) => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    loadMentors();
  }, []);

  useEffect(() => {
    filterMentors();
  }, [mentors, searchTerm]);

  const loadMentors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mentors')
        .select(`
          *,
          users (
            first_name,
            last_name,
            email,
            profile_image
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter out mentors with invalid user data and properly type the result
      const validMentors: Mentor[] = (data || [])
        .filter((mentor: any) => {
          // Check if users data exists and is valid
          return mentor.users && 
                 typeof mentor.users === 'object' && 
                 !('error' in mentor.users) &&
                 mentor.users.first_name &&
                 mentor.users.last_name &&
                 mentor.users.email;
        })
        .map((mentor: any) => ({
          ...mentor,
          users: mentor.users
        }));
      
      setMentors(validMentors);
    } catch (error: any) {
      console.error('Error loading mentors:', error);
      toast({
        title: "Error loading mentors",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterMentors = () => {
    if (!searchTerm.trim()) {
      setFilteredMentors(mentors);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = mentors.filter(mentor => {
      if (!mentor.users) return false;
      
      return mentor.users.first_name?.toLowerCase().includes(searchLower) ||
             mentor.users.last_name?.toLowerCase().includes(searchLower) ||
             mentor.users.email?.toLowerCase().includes(searchLower);
    });
    setFilteredMentors(filtered);
  };

  const handleApproveMentor = async (mentorId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('mentors')
        .update({ 
          is_approved: approved,
          approval_date: approved ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('mentor_id', mentorId);

      if (error) throw error;

      toast({
        title: approved ? "Mentor approved" : "Mentor unapproved",
        description: `The mentor has been ${approved ? 'approved' : 'unapproved'} successfully.`
      });

      loadMentors();
      onStatsChange();
    } catch (error: any) {
      console.error('Error updating mentor approval:', error);
      toast({
        title: "Error updating mentor",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEditMentor = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setIsEditModalOpen(true);
  };

  const handleMentorUpdated = () => {
    loadMentors();
    onStatsChange();
    setIsEditModalOpen(false);
    setSelectedMentor(null);
  };

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mr-4"></div>
            <span className="text-gray-600">Loading mentors...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-slate-600" />
              Mentor Management
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search mentors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mentor</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMentors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {searchTerm ? 'No mentors found matching your search.' : 'No mentors found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMentors.map((mentor) => (
                    <TableRow key={mentor.mentor_id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={mentor.users?.profile_image} />
                            <AvatarFallback>
                              {mentor.users?.first_name?.[0]}{mentor.users?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {mentor.users?.first_name} {mentor.users?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {mentor.users?.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {mentor.hourly_rate}/hr
                        </div>
                      </TableCell>
                      <TableCell>{mentor.experience_years} years</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          {mentor.rating.toFixed(1)} ({mentor.reviews_count})
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={mentor.is_approved ? 'default' : 'secondary'}>
                          {mentor.is_approved ? 'Approved' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(mentor.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditMentor(mentor)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          {mentor.is_approved ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveMentor(mentor.mentor_id, false)}
                              className="hover:bg-red-50 hover:text-red-600"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Revoke
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveMentor(mentor.mentor_id, true)}
                              className="hover:bg-green-50 hover:text-green-600"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EditMentorModal
        mentor={selectedMentor}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onMentorUpdated={handleMentorUpdated}
      />
    </>
  );
};
