import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Edit, User, Target, DollarSign } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { EditMenteeModal } from './EditMenteeModal';

interface Mentee {
  mentee_id: string;
  career_stage: string;
  goals: string;
  budget_range: string;
  created_at: string;
  users: {
    first_name: string;
    last_name: string;
    email: string;
    profile_image: string;
  };
}

interface AdminMenteesTableProps {
  onStatsChange: () => void;
}

export const AdminMenteesTable = ({ onStatsChange }: AdminMenteesTableProps) => {
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [filteredMentees, setFilteredMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMentee, setSelectedMentee] = useState<Mentee | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    loadMentees();
  }, []);

  useEffect(() => {
    filterMentees();
  }, [mentees, searchTerm]);

  const loadMentees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mentees')
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
      setMentees(data || []);
    } catch (error: any) {
      console.error('Error loading mentees:', error);
      toast({
        title: "Error loading mentees",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterMentees = () => {
    if (!searchTerm.trim()) {
      setFilteredMentees(mentees);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = mentees.filter(mentee => 
      mentee.users?.first_name?.toLowerCase().includes(searchLower) ||
      mentee.users?.last_name?.toLowerCase().includes(searchLower) ||
      mentee.users?.email?.toLowerCase().includes(searchLower) ||
      mentee.career_stage?.toLowerCase().includes(searchLower)
    );
    setFilteredMentees(filtered);
  };

  const handleEditMentee = (mentee: Mentee) => {
    setSelectedMentee(mentee);
    setIsEditModalOpen(true);
  };

  const handleMenteeUpdated = () => {
    loadMentees();
    onStatsChange();
    setIsEditModalOpen(false);
    setSelectedMentee(null);
  };

  const getCareerStageColor = (stage: string) => {
    switch (stage?.toLowerCase()) {
      case 'student': return 'bg-blue-100 text-blue-800';
      case 'entry_level': return 'bg-green-100 text-green-800';
      case 'mid_level': return 'bg-yellow-100 text-yellow-800';
      case 'senior_level': return 'bg-purple-100 text-purple-800';
      case 'executive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mr-4"></div>
            <span className="text-gray-600">Loading mentees...</span>
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
              <User className="h-5 w-5 text-slate-600" />
              Mentee Management
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search mentees..."
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
                  <TableHead>Mentee</TableHead>
                  <TableHead>Career Stage</TableHead>
                  <TableHead>Budget Range</TableHead>
                  <TableHead>Goals</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMentees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      {searchTerm ? 'No mentees found matching your search.' : 'No mentees found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMentees.map((mentee) => (
                    <TableRow key={mentee.mentee_id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={mentee.users?.profile_image} />
                            <AvatarFallback>
                              {mentee.users?.first_name?.[0]}{mentee.users?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {mentee.users?.first_name} {mentee.users?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {mentee.users?.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCareerStageColor(mentee.career_stage)}>
                          {mentee.career_stage?.replace('_', ' ').toUpperCase() || 'Not set'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {mentee.budget_range || 'Not specified'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={mentee.goals}>
                          <Target className="h-4 w-4 inline mr-1" />
                          {mentee.goals || 'No goals set'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(mentee.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditMentee(mentee)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EditMenteeModal
        mentee={selectedMentee}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onMenteeUpdated={handleMenteeUpdated}
      />
    </>
  );
};
