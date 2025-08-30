import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, BookOpen, Users, Calendar, Clock, Star, Filter, Search, ChevronRight } from 'lucide-react';
import { PublicSeminarsList } from './PublicSeminarsList';
import { ReservedSeminarsList } from './ReservedSeminarsList';

interface SeminarsSidebarLayoutProps {
  className?: string;
}

export const SeminarsSidebarLayout: React.FC<SeminarsSidebarLayoutProps> = ({
  className = ""
}) => {
  const [activeSection, setActiveSection] = useState('reserved');

  const sections = [
    {
      id: 'reserved',
      title: 'My Reservations',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'followed',
      title: 'From Followed Mentors',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'all',
      title: 'All Public Seminars',
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'reserved':
        return <ReservedSeminarsList className="card-elevated" />;
      case 'followed':
        return (
          <PublicSeminarsList
            showFollowedOnly={true}
            title="Seminars from Followed Mentors"
            className="card-elevated"
          />
        );
      case 'all':
        return (
          <PublicSeminarsList
            showFollowedOnly={false}
            title="All Public Seminars"
            className="card-elevated"
          />
        );
      default:
        return <ReservedSeminarsList className="card-elevated" />;
    }
  };

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

      {/* Main Layout with Sidebar */}
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Seminar Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <Button
                    key={section.id}
                    variant="ghost"
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full justify-start p-4 h-auto ${
                      isActive 
                        ? `${section.bgColor} ${section.borderColor} border-l-4 ${section.color}` 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center w-full">
                      <Icon className={`h-5 w-5 mr-3 ${isActive ? section.color : 'text-gray-500'}`} />
                      <div className="flex-1 text-left">
                        <div className={`font-medium ${isActive ? section.color : 'text-gray-900'}`}>
                          {section.title}
                        </div>
                      </div>
                      {isActive && <ChevronRight className="h-4 w-4 text-gray-400" />}
                    </div>
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}; 