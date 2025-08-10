import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, Users, DollarSign, Video, BookOpen, Edit, Trash2, Eye } from 'lucide-react';
import { MentorFollowService, PublicSeminar } from '@/services/mentorFollowService';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreateSeminarModal } from './CreateSeminarModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ManageSeminarsListProps {
  className?: string;
}

export const ManageSeminarsList: React.FC<ManageSeminarsListProps> = ({
  className = ""
}) => {
  const [seminars, setSeminars] = useState<PublicSeminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSeminar, setEditingSeminar] = useState<PublicSeminar | null>(null);

  useEffect(() => {
    loadMySeminars();
  }, []);

  const loadMySeminars = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('public_seminars')
        .select(`
          *,
          mentor:mentor_id (
            users:mentors_mentor_id_fkey (
              first_name,
              last_name,
              profile_image
            )
          )
        `)
        .order('seminar_date', { ascending: true });

      if (error) throw error;
      setSeminars(data || []);
    } catch (error) {
      console.error('Error loading seminars:', error);
      toast({
        title: "Error",
        description: "Failed to load your seminars",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSeminar = async (seminarId: string, seminarTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${seminarTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('public_seminars')
        .delete()
        .eq('id', seminarId);

      if (error) throw error;

      toast({
        title: "Seminar Deleted",
        description: `"${seminarTitle}" has been deleted successfully.`,
      });

      loadMySeminars();
    } catch (error) {
      console.error('Error deleting seminar:', error);
      toast({
        title: "Error",
        description: "Failed to delete seminar. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateSeminarStatus = async (seminarId: string, newStatus: string, seminarTitle: string) => {
    try {
      const { error } = await supabase
        .from('public_seminars')
        .update({ status: newStatus })
        .eq('id', seminarId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `"${seminarTitle}" status updated to ${newStatus}.`,
      });

      loadMySeminars();
    } catch (error) {
      console.error('Error updating seminar status:', error);
      toast({
        title: "Error",
        description: "Failed to update seminar status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (seminar: PublicSeminar) => {
    const now = new Date();
    const seminarDate = new Date(seminar.seminar_date);
    
    if (seminar.status === 'cancelled') {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    
    if (seminar.status === 'completed') {
      return <Badge variant="secondary">Completed</Badge>;
    }
    
    if (seminar.status === 'in_progress') {
      return <Badge className="bg-green-100 text-green-800">Live Now</Badge>;
    }
    
    if (seminarDate < now) {
      return <Badge variant="secondary">Past</Badge>;
    }
    
    return <Badge className="bg-purple-100 text-purple-800">Upcoming</Badge>;
  };

  const getStatusOptions = (seminar: PublicSeminar) => {
    const options = ['scheduled'];
    
    if (seminar.status === 'scheduled') {
      options.push('in_progress', 'cancelled');
    }
    
    if (seminar.status === 'in_progress') {
      options.push('completed');
    }
    
    return options;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              My Public Seminars
            </CardTitle>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Create Seminar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mr-4"></div>
            <span className="text-gray-600">Loading your seminars...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              My Public Seminars ({seminars.length})
            </CardTitle>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Create Seminar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {seminars.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No seminars created yet</p>
              <p className="text-sm text-gray-500 mt-1">Create your first public seminar to start sharing knowledge!</p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 bg-purple-600 hover:bg-purple-700"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Create Your First Seminar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {seminars.map((seminar) => (
                <Card key={seminar.id} className="border border-gray-200 hover:border-purple-300 transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg mb-1">
                              {seminar.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                              {seminar.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {getStatusBadge(seminar)}
                            {seminar.is_free ? (
                              <Badge className="bg-green-100 text-green-800">Free</Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                ${seminar.price}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(seminar.seminar_date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTime(seminar.seminar_date)} ({seminar.duration_minutes} min)
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {seminar.current_participants}
                            {seminar.max_participants && `/${seminar.max_participants}`}
                          </div>
                        </div>

                        {seminar.zoom_meeting_id && (
                          <div className="flex items-center gap-2 mb-3">
                            <Video className="h-4 w-4 text-purple-600" />
                            <span className="text-sm text-gray-600">
                              Zoom ID: {seminar.zoom_meeting_id}
                              {seminar.zoom_password && ` | Password: ${seminar.zoom_password}`}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingSeminar(seminar)}
                            className="border-purple-300 text-purple-600 hover:bg-purple-50"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteSeminar(seminar.id, seminar.title)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>

                        <Select
                          value={seminar.status}
                          onValueChange={(value) => handleUpdateSeminarStatus(seminar.id, value, seminar.title)}
                        >
                          <SelectTrigger className="w-full border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getStatusOptions(seminar).map((status) => (
                              <SelectItem key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateSeminarModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingSeminar(null);
        }}
        onSeminarCreated={loadMySeminars}
      />
    </>
  );
}; 