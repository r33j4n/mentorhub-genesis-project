import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Mail } from 'lucide-react';
import { MentorFollowService } from '@/services/mentorFollowService';
import { toast } from '@/components/ui/use-toast';

interface SeminarParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  seminarId: string;
  seminarTitle: string;
}

interface Participant {
  id: string;
  mentee_id: string;
  seminar_id: string;
  created_at: string;
  mentee: {
    users: {
      first_name: string;
      last_name: string;
      email: string;
      profile_image: string;
    };
  };
}

export const SeminarParticipantsModal: React.FC<SeminarParticipantsModalProps> = ({
  isOpen,
  onClose,
  seminarId,
  seminarTitle
}) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && seminarId) {
      loadParticipants();
    }
  }, [isOpen, seminarId]);

  const loadParticipants = async () => {
    setLoading(true);
    try {
      console.log('Loading participants for seminar:', seminarId);
      const data = await MentorFollowService.getSeminarParticipants(seminarId);
      console.log('Participants data:', data);
      setParticipants(data);
    } catch (error) {
      console.error('Error loading participants:', error);
      toast({
        title: "Error",
        description: "Failed to load participants",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="h-5 w-5 text-purple-600" />
            Seminar Participants
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            "{seminarTitle}" - {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mr-4"></div>
            <span className="text-gray-600">Loading participants...</span>
          </div>
        ) : participants.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No participants yet</p>
            <p className="text-sm text-gray-500 mt-1">
              No one has reserved a seat for this seminar yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {participants.map((participant, index) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                  
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={participant.mentee.users.profile_image} />
                    <AvatarFallback className="bg-purple-500 text-white">
                      {participant.mentee.users.first_name?.[0]}{participant.mentee.users.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">
                      {participant.mentee.users.first_name} {participant.mentee.users.last_name}
                    </span>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Mail className="h-3 w-3" />
                      <span>{participant.mentee.users.email}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span>Reserved {formatDate(participant.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}; 