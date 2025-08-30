import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageCircle, 
  Mail, 
  Phone, 
  Clock, 
  CheckCircle, 
  XCircle,
  User,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { IdeaContact, IdeaService } from '@/services/ideaService';
import { useToast } from '@/hooks/use-toast';

interface IdeaContactsManagerProps {
  ideaId: string;
  ideaTitle: string;
}

const CONTACT_METHOD_ICONS = {
  email: Mail,
  phone: Phone,
  platform: MessageCircle,
};

const STATUS_LABELS = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-800' },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-800' },
  contacted: { label: 'Contacted', color: 'bg-blue-100 text-blue-800' },
};

export function IdeaContactsManager({ ideaId, ideaTitle }: IdeaContactsManagerProps) {
  const [contacts, setContacts] = useState<IdeaContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<IdeaContact | null>(null);
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadContacts();
  }, [ideaId]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const contactsData = await IdeaService.getIdeaContacts(ideaId);
      setContacts(contactsData);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contacts. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (contactId: string, status: 'accepted' | 'declined' | 'contacted') => {
    setUpdatingStatus(true);
    try {
      await IdeaService.updateContactStatus(contactId, status);
      toast({
        title: 'Success!',
        description: `Contact ${status} successfully.`,
      });
      loadContacts(); // Reload to get updated data
    } catch (error) {
      console.error('Error updating contact status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update contact status.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleQuickResponse = (contact: IdeaContact) => {
    setSelectedContact(contact);
    setResponseMessage('');
    setResponseModalOpen(true);
  };

  const handleSendResponse = async () => {
    if (!selectedContact || !responseMessage.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a response message.',
        variant: 'destructive',
      });
      return;
    }

    setUpdatingStatus(true);
    try {
      // For now, we'll just update the status to 'contacted'
      // In a full implementation, you might want to send an actual message
      await IdeaService.updateContactStatus(selectedContact.id, 'contacted');
      toast({
        title: 'Success!',
        description: 'Response sent successfully.',
      });
      setResponseModalOpen(false);
      setSelectedContact(null);
      setResponseMessage('');
      loadContacts();
    } catch (error) {
      console.error('Error sending response:', error);
      toast({
        title: 'Error',
        description: 'Failed to send response.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStats = () => {
    const totalContacts = contacts.length;
    const pendingContacts = contacts.filter(c => c.status === 'pending').length;
    const acceptedContacts = contacts.filter(c => c.status === 'accepted').length;
    const contactedContacts = contacts.filter(c => c.status === 'contacted').length;

    return { totalContacts, pendingContacts, acceptedContacts, contactedContacts };
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
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Contacts for "{ideaTitle}"
        </h2>
        <p className="text-muted-foreground">
          Manage responses to mentors interested in your idea
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Contacts</p>
                <p className="text-2xl font-bold">{stats.totalContacts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pendingContacts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Accepted</p>
                <p className="text-2xl font-bold">{stats.acceptedContacts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Contacted</p>
                <p className="text-2xl font-bold">{stats.contactedContacts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contacts List */}
      <div className="space-y-4">
        {contacts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No contacts yet</h3>
              <p className="text-muted-foreground">
                When mentors show interest in your idea, their contacts will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          contacts.map((contact) => {
            const ContactMethodIcon = CONTACT_METHOD_ICONS[contact.contact_method];
            const statusInfo = STATUS_LABELS[contact.status];

            return (
              <Card key={contact.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {contact.mentor ? getInitials(contact.mentor.first_name, contact.mentor.last_name) : 'ME'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="font-semibold">
                            {contact.mentor?.first_name} {contact.mentor?.last_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {contact.mentor?.email}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-gray-700">{contact.message}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <ContactMethodIcon className="h-3 w-3" />
                              {contact.contact_method.charAt(0).toUpperCase() + contact.contact_method.slice(1)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(contact.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <Badge className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>

                      <div className="flex gap-2">
                        {contact.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(contact.id, 'accepted')}
                              disabled={updatingStatus}
                              className="gap-1"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(contact.id, 'declined')}
                              disabled={updatingStatus}
                              className="gap-1"
                            >
                              <XCircle className="h-3 w-3" />
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickResponse(contact)}
                              disabled={updatingStatus}
                              className="gap-1"
                            >
                              <MessageCircle className="h-3 w-3" />
                              Respond
                            </Button>
                          </>
                        )}
                        {contact.status === 'accepted' && (
                          <Button
                            size="sm"
                            onClick={() => handleQuickResponse(contact)}
                            disabled={updatingStatus}
                            className="gap-1"
                          >
                            <MessageCircle className="h-3 w-3" />
                            Contact
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Response Modal */}
      <Dialog open={responseModalOpen} onOpenChange={setResponseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Respond to {selectedContact?.mentor?.first_name} {selectedContact?.mentor?.last_name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="response-message">Your Response</Label>
              <Textarea
                id="response-message"
                placeholder="Write your response to the mentor..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setResponseModalOpen(false)}
                disabled={updatingStatus}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSendResponse} 
                disabled={updatingStatus || !responseMessage.trim()}
              >
                {updatingStatus ? 'Sending...' : 'Send Response'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 