import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, MessageCircle, XCircle, Calendar, Clock, DollarSign, Video, Filter, ChevronRight, Users } from 'lucide-react';

interface SessionsSidebarLayoutProps {
  className?: string;
  acceptedSessions: any[];
  pendingSessions: any[];
  rejectedSessions: any[];
  loadingSessions: boolean;
  onSessionClick: (session: any) => void;
  onJoinMeeting: (session: any) => void;
}

export const SessionsSidebarLayout: React.FC<SessionsSidebarLayoutProps> = ({
  className = "",
  acceptedSessions,
  pendingSessions,
  rejectedSessions,
  loadingSessions,
  onSessionClick,
  onJoinMeeting
}) => {
  const [activeSection, setActiveSection] = useState('accepted');

  const sections = [
    {
      id: 'accepted',
      title: 'Accepted Sessions',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      count: acceptedSessions.length
    },
    {
      id: 'pending',
      title: 'Pending Sessions',
      icon: MessageCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      count: pendingSessions.length
    },
    {
      id: 'rejected',
      title: 'Rejected Sessions',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      count: rejectedSessions.length
    }
  ];

  const renderSessionList = (sessions: any[], type: string) => {
    if (sessions.length === 0) {
      const emptyStateIcons = {
        accepted: CheckCircle,
        pending: MessageCircle,
        rejected: XCircle
      };
      const emptyStateMessages = {
        accepted: {
          title: "No accepted sessions yet",
          subtitle: "Your accepted sessions will appear here."
        },
        pending: {
          title: "No pending session requests",
          subtitle: "Your pending session requests will appear here."
        },
        rejected: {
          title: "No rejected sessions",
          subtitle: "Rejected sessions will appear here."
        }
      };
      
      const Icon = emptyStateIcons[type as keyof typeof emptyStateIcons];
      const message = emptyStateMessages[type as keyof typeof emptyStateMessages];
      
      return (
        <div className="text-center py-12">
          <Icon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">{message.title}</p>
          <p className="text-sm text-gray-500 mt-1">{message.subtitle}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {sessions.map((session: any) => (
          <Card 
            key={session.id} 
            className={`border hover:shadow-md transition-all cursor-pointer ${
              type === 'accepted' ? 'border-green-200 hover:border-green-300' :
              type === 'pending' ? 'border-yellow-200 hover:border-yellow-300' :
              'border-red-200 hover:border-red-300'
            }`}
            onClick={() => onSessionClick(session)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {session.title || 'Mentoring Session'}
                    </h3>
                    <Badge 
                      variant="secondary" 
                      className={
                        type === 'accepted' ? 'bg-green-100 text-green-800' :
                        type === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }
                    >
                      {type === 'accepted' ? 'Confirmed' : type === 'pending' ? 'Pending' : 'Cancelled'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{session.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(session.scheduled_start).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(session.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      ${session.final_price}
                    </div>
                  </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="bg-blue-500 text-white text-xs">
                                        M
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm text-gray-600">
                                      Mentor ID: {session.mentor_id?.slice(0, 8)}...
                                    </span>
                                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {type === 'accepted' && (
                    <Button 
                      size="sm" 
                      className="bg-black hover:bg-gray-800 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        onJoinMeeting(session);
                      }}
                    >
                      <Video className="h-4 w-4 mr-1" />
                      Join
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="border-black text-black hover:bg-gray-100">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  {type !== 'accepted' && (
                    <Button size="sm" variant="outline" className="border-black text-black hover:bg-gray-100">
                      <Users className="h-4 w-4 mr-1" />
                      Book Again
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'accepted':
        return renderSessionList(acceptedSessions, 'accepted');
      case 'pending':
        return renderSessionList(pendingSessions, 'pending');
      case 'rejected':
        return renderSessionList(rejectedSessions, 'rejected');
      default:
        return renderSessionList(acceptedSessions, 'accepted');
    }
  };

  if (loadingSessions) {
    return (
      <div className={className}>
        <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white border-0 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Your Sessions</h2>
                <p className="text-gray-300">Track your accepted, pending, and rejected session requests</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{acceptedSessions.length + rejectedSessions.length + pendingSessions.length}</div>
                <div className="text-gray-300 text-sm">Total sessions</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mr-4"></div>
              <span className="text-gray-600">Loading sessions...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white border-0 shadow-lg mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Your Sessions</h2>
              <p className="text-gray-300">Track your accepted, pending, and rejected session requests</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{acceptedSessions.length + rejectedSessions.length + pendingSessions.length}</div>
              <div className="text-gray-300 text-sm">Total sessions</div>
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
                Session Categories
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
                        <div className="text-sm text-gray-500">
                          {section.count} session{section.count !== 1 ? 's' : ''}
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
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-xl text-foreground flex items-center gap-2">
                {sections.find(s => s.id === activeSection)?.icon && 
                  React.createElement(sections.find(s => s.id === activeSection)!.icon, {
                    className: `h-5 w-5 ${sections.find(s => s.id === activeSection)?.color}`
                  })
                }
                {sections.find(s => s.id === activeSection)?.title} 
                ({sections.find(s => s.id === activeSection)?.count})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}; 