
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { Save, X } from 'lucide-react';

interface Mentor {
  mentor_id: string;
  hourly_rate: number;
  experience_years: number;
  rating: number;
  reviews_count: number;
  is_approved: boolean;
  users: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface EditMentorModalProps {
  mentor: Mentor | null;
  isOpen: boolean;
  onClose: () => void;
  onMentorUpdated: () => void;
}

export const EditMentorModal = ({ mentor, isOpen, onClose, onMentorUpdated }: EditMentorModalProps) => {
  const [formData, setFormData] = useState({
    hourly_rate: 0,
    experience_years: 0,
    is_approved: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mentor) {
      setFormData({
        hourly_rate: mentor.hourly_rate || 0,
        experience_years: mentor.experience_years || 0,
        is_approved: mentor.is_approved
      });
    }
  }, [mentor]);

  const handleSave = async () => {
    if (!mentor) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('mentors')
        .update({
          hourly_rate: formData.hourly_rate,
          experience_years: formData.experience_years,
          is_approved: formData.is_approved,
          approval_date: formData.is_approved ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('mentor_id', mentor.mentor_id);

      if (error) throw error;

      toast({
        title: "Mentor updated successfully",
        description: "The mentor profile has been updated."
      });

      onMentorUpdated();
    } catch (error: any) {
      console.error('Error updating mentor:', error);
      toast({
        title: "Error updating mentor",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!mentor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Edit Mentor: {mentor.users?.first_name} {mentor.users?.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
            <Input
              id="hourly_rate"
              type="number"
              min="0"
              step="0.01"
              value={formData.hourly_rate}
              onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 0 }))}
            />
          </div>

          <div>
            <Label htmlFor="experience_years">Years of Experience</Label>
            <Input
              id="experience_years"
              type="number"
              min="0"
              value={formData.experience_years}
              onChange={(e) => setFormData(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_approved">Approved Status</Label>
            <Switch
              id="is_approved"
              checked={formData.is_approved}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_approved: checked }))}
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-sm text-gray-600">
              <p><strong>Current Rating:</strong> {mentor.rating.toFixed(1)} ({mentor.reviews_count} reviews)</p>
              <p><strong>Email:</strong> {mentor.users?.email}</p>
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
