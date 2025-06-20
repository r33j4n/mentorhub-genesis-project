
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Save, X } from 'lucide-react';

interface Mentee {
  mentee_id: string;
  career_stage: string;
  goals: string;
  budget_range: string;
  users: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface EditMenteeModalProps {
  mentee: Mentee | null;
  isOpen: boolean;
  onClose: () => void;
  onMenteeUpdated: () => void;
}

const CAREER_STAGES = [
  { value: 'student', label: 'Student' },
  { value: 'entry_level', label: 'Entry Level' },
  { value: 'mid_level', label: 'Mid Level' },
  { value: 'senior_level', label: 'Senior Level' },
  { value: 'executive', label: 'Executive' }
];

const BUDGET_RANGES = [
  { value: '$0-50', label: '$0-50 per hour' },
  { value: '$50-100', label: '$50-100 per hour' },
  { value: '$100-200', label: '$100-200 per hour' },
  { value: '$200+', label: '$200+ per hour' }
];

export const EditMenteeModal = ({ mentee, isOpen, onClose, onMenteeUpdated }: EditMenteeModalProps) => {
  const [formData, setFormData] = useState({
    career_stage: '' as 'student' | 'entry_level' | 'mid_level' | 'senior_level' | 'executive' | '',
    goals: '',
    budget_range: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mentee) {
      setFormData({
        career_stage: mentee.career_stage as 'student' | 'entry_level' | 'mid_level' | 'senior_level' | 'executive' | '',
        goals: mentee.goals || '',
        budget_range: mentee.budget_range || ''
      });
    }
  }, [mentee]);

  const handleSave = async () => {
    if (!mentee) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('mentees')
        .update({
          career_stage: formData.career_stage,
          goals: formData.goals,
          budget_range: formData.budget_range,
          updated_at: new Date().toISOString()
        })
        .eq('mentee_id', mentee.mentee_id);

      if (error) throw error;

      toast({
        title: "Mentee updated successfully",
        description: "The mentee profile has been updated."
      });

      onMenteeUpdated();
    } catch (error: any) {
      console.error('Error updating mentee:', error);
      toast({
        title: "Error updating mentee",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!mentee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Edit Mentee: {mentee.users?.first_name} {mentee.users?.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="career_stage">Career Stage</Label>
            <Select value={formData.career_stage} onValueChange={(value) => setFormData(prev => ({ ...prev, career_stage: value as typeof formData.career_stage }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select career stage" />
              </SelectTrigger>
              <SelectContent>
                {CAREER_STAGES.map(stage => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="budget_range">Budget Range</Label>
            <Select value={formData.budget_range} onValueChange={(value) => setFormData(prev => ({ ...prev, budget_range: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select budget range" />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_RANGES.map(range => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="goals">Goals</Label>
            <Textarea
              id="goals"
              value={formData.goals}
              onChange={(e) => setFormData(prev => ({ ...prev, goals: e.target.value }))}
              rows={4}
              placeholder="What are the mentee's learning goals?"
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-sm text-gray-600">
              <p><strong>Email:</strong> {mentee.users?.email}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
