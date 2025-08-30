import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Lightbulb, 
  Eye, 
  DollarSign, 
  Percent, 
  Calendar, 
  Building, 
  MessageCircle,
  Mail,
  Phone,
  ExternalLink
} from 'lucide-react';
import { Idea, IdeaService } from '@/services/ideaService';
import { useToast } from '@/hooks/use-toast';

interface IdeaCardProps {
  idea: Idea;
  isOwner?: boolean;
  onUpdate?: () => void;
}

const STAGE_LABELS = {
  idea: { label: 'Just an Idea', color: 'bg-gray-100 text-gray-800' },
  prototype: { label: 'Prototype', color: 'bg-blue-100 text-blue-800' },
  mvp: { label: 'MVP', color: 'bg-green-100 text-green-800' },
  early_traction: { label: 'Early Traction', color: 'bg-yellow-100 text-yellow-800' },
  scaling: { label: 'Scaling', color: 'bg-purple-100 text-purple-800' },
};

export function IdeaCard({ idea, isOwner = false, onUpdate }: IdeaCardProps) {
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [contactMethod, setContactMethod] = useState<'email' | 'phone' | 'platform'>('platform');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Record view when component mounts
    IdeaService.recordIdeaView(idea.id);
  }, [idea.id]);

  const handleContact = async () => {
    if (!contactMessage.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await IdeaService.contactIdea({
        idea_id: idea.id,
        message: contactMessage,
        contact_method: contactMethod,
      });
      
      toast({
        title: 'Success!',
        description: 'Your interest has been sent to the mentee.',
      });
      
      setContactModalOpen(false);
      setContactMessage('');
      setContactMethod('platform');
    } catch (error) {
      console.error('Error contacting idea:', error);
      toast({
        title: 'Error',
        description: 'Failed to send your interest. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      await IdeaService.toggleIdeaStatus(idea.id);
      toast({
        title: 'Success!',
        description: `Idea ${idea.is_active ? 'deactivated' : 'activated'} successfully.`,
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error toggling idea status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update idea status.',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {idea.mentee ? getInitials(idea.mentee.first_name, idea.mentee.last_name) : 'ME'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                {idea.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                by {idea.mentee?.first_name} {idea.mentee?.last_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={idea.is_active ? 'default' : 'secondary'}>
              {idea.is_active ? 'Active' : 'Inactive'}
            </Badge>
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleStatus}
              >
                {idea.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-gray-700 leading-relaxed">{idea.description}</p>

        {/* Tags and Info */}
        <div className="flex flex-wrap gap-2">
          {idea.industry && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Building className="h-3 w-3" />
              {idea.industry}
            </Badge>
          )}
          <Badge className={STAGE_LABELS[idea.stage].color}>
            {STAGE_LABELS[idea.stage].label}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {idea.views_count} views
          </Badge>
        </div>

        {/* Investment Details */}
        {(idea.funding_needed || idea.equity_offered) && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            {idea.funding_needed && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Funding Needed</p>
                  <p className="font-semibold">{formatCurrency(idea.funding_needed)}</p>
                </div>
              </div>
            )}
            {idea.equity_offered && (
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Equity Offered</p>
                  <p className="font-semibold">{idea.equity_offered}%</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contact Information */}
        {(idea.contact_email || idea.contact_phone) && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Contact Information:</h4>
            <div className="flex flex-wrap gap-2">
              {idea.contact_email && (
                <Button variant="outline" size="sm" className="gap-2">
                  <Mail className="h-3 w-3" />
                  {idea.contact_email}
                </Button>
              )}
              {idea.contact_phone && (
                <Button variant="outline" size="sm" className="gap-2">
                  <Phone className="h-3 w-3" />
                  {idea.contact_phone}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Posted {formatDate(idea.created_at)}
            </span>
          </div>

          {!isOwner && (
            <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Contact Mentee
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Contact {idea.mentee?.first_name} about "{idea.title}"</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-method">Preferred Contact Method</Label>
                    <Select value={contactMethod} onValueChange={(value: any) => setContactMethod(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="platform">Through Platform</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Your Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Introduce yourself and explain why you're interested in this idea..."
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setContactModalOpen(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleContact} disabled={loading || !contactMessage.trim()}>
                      {loading ? 'Sending...' : 'Send Interest'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 