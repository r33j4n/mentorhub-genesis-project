import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const TestSeminarCreation: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);

  const createTestSeminar = async () => {
    setIsCreating(true);
    try {
      // Create a test seminar for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0); // 2 PM

      const { data, error } = await supabase
        .from('public_seminars')
        .insert({
          title: 'Test Seminar: Introduction to React',
          description: 'This is a test seminar to verify the database functionality. Learn the basics of React development.',
          seminar_date: tomorrow.toISOString(),
          duration_minutes: 60,
          max_participants: 20,
          is_free: true,
          price: 0,
          zoom_meeting_id: '123456789',
          zoom_password: 'test123'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Test Seminar Created!",
        description: `Successfully created test seminar: ${data.title}`,
      });

      console.log('Test seminar created:', data);
    } catch (error) {
      console.error('Error creating test seminar:', error);
      toast({
        title: "Error",
        description: "Failed to create test seminar. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Test Seminar Creation</CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          onClick={createTestSeminar}
          disabled={isCreating}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {isCreating ? 'Creating...' : 'Create Test Seminar'}
        </Button>
        <p className="text-sm text-gray-600 mt-2">
          This will create a test seminar for tomorrow at 2 PM to verify the database functionality.
        </p>
      </CardContent>
    </Card>
  );
}; 