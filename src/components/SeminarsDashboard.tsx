import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, BookOpen, Users, Calendar, Clock, Star, Filter, Search } from 'lucide-react';
import { PublicSeminarsList } from './PublicSeminarsList';
import { ReservedSeminarsList } from './ReservedSeminarsList';

interface SeminarsDashboardProps {
  className?: string;
}

export const SeminarsDashboard: React.FC<SeminarsDashboardProps> = ({
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState('reserved');

  return (
    <div className={className}>
      {/* Header */}
      <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white border-0 shadow-lg mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Public Seminars</h2>
              <p className="text-gray-300">Discover and join free seminars from expert mentors</p>
            </div>
            <div className="text-right">
              <BookOpen className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm">
          <TabsTrigger 
            value="reserved" 
            className="data-[state=active]:bg-black data-[state=active]:text-white rounded-lg transition-all"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            My Reservations
          </TabsTrigger>
          <TabsTrigger 
            value="followed" 
            className="data-[state=active]:bg-black data-[state=active]:text-white rounded-lg transition-all"
          >
            <Users className="h-4 w-4 mr-2" />
            From Followed Mentors
          </TabsTrigger>
          <TabsTrigger 
            value="all" 
            className="data-[state=active]:bg-black data-[state=active]:text-white rounded-lg transition-all"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            All Seminars
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reserved" className="space-y-6">
          <ReservedSeminarsList className="card-elevated" />
        </TabsContent>

        <TabsContent value="followed" className="space-y-6">
          <PublicSeminarsList
            showFollowedOnly={true}
            title="Seminars from Followed Mentors"
            className="card-elevated"
          />
        </TabsContent>

        <TabsContent value="all" className="space-y-6">
          <PublicSeminarsList
            showFollowedOnly={false}
            title="All Public Seminars"
            className="card-elevated"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}; 