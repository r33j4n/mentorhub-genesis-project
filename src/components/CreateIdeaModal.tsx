import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Plus, DollarSign, Percent } from 'lucide-react';
import { IdeaService, CreateIdeaData } from '@/services/ideaService';
import { useToast } from '@/hooks/use-toast';

interface CreateIdeaModalProps {
  onIdeaCreated?: () => void;
}

const STAGES = [
  { value: 'idea', label: 'Just an Idea', description: 'Conceptual stage' },
  { value: 'prototype', label: 'Prototype', description: 'Working prototype' },
  { value: 'mvp', label: 'MVP', description: 'Minimum viable product' },
  { value: 'early_traction', label: 'Early Traction', description: 'Some users/customers' },
  { value: 'scaling', label: 'Scaling', description: 'Ready to scale' },
];

const INDUSTRIES = [
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

export function CreateIdeaModal({ onIdeaCreated }: CreateIdeaModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateIdeaData>({
    title: '',
    description: '',
    industry: '',
    stage: 'idea',
    funding_needed: undefined,
    equity_offered: undefined,
    contact_email: '',
    contact_phone: '',
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await IdeaService.createIdea(formData);
      toast({
        title: 'Success!',
        description: 'Your idea has been posted successfully.',
      });
      setOpen(false);
      setFormData({
        title: '',
        description: '',
        industry: '',
        stage: 'idea',
        funding_needed: undefined,
        equity_offered: undefined,
        contact_email: '',
        contact_phone: '',
      });
      onIdeaCreated?.();
    } catch (error) {
      console.error('Error creating idea:', error);
      toast({
        title: 'Error',
        description: 'Failed to post your idea. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateIdeaData, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Post New Idea
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Post Your Business Idea
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Idea Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter a catchy title for your idea"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your idea in detail. What problem does it solve? What's your vision?"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => handleInputChange('industry', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
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
                  <Label htmlFor="stage">Development Stage *</Label>
                  <Select
                    value={formData.stage}
                    onValueChange={(value) => handleInputChange('stage', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          <div className="flex flex-col">
                            <span>{stage.label}</span>
                            <span className="text-xs text-muted-foreground">{stage.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investment Details */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Investment Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="funding_needed">Funding Needed ($)</Label>
                  <Input
                    id="funding_needed"
                    type="number"
                    placeholder="e.g., 50000"
                    value={formData.funding_needed || ''}
                    onChange={(e) => handleInputChange('funding_needed', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="equity_offered">Equity Offered (%)</Label>
                  <Input
                    id="equity_offered"
                    type="number"
                    placeholder="e.g., 10"
                    min="0"
                    max="100"
                    value={formData.equity_offered || ''}
                    onChange={(e) => handleInputChange('equity_offered', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold">Contact Information</h3>
              <p className="text-sm text-muted-foreground">
                Provide contact details for mentors who are interested in your idea.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Phone</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for a Great Idea Post</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Be clear and concise about what problem your idea solves</li>
                <li>• Include market size and potential impact</li>
                <li>• Be realistic about funding needs and equity offered</li>
                <li>• Provide clear contact information for interested mentors</li>
              </ul>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title || !formData.description}>
              {loading ? 'Posting...' : 'Post Idea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 