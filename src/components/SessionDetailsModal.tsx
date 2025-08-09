import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { 
  Calendar, 
  Clock, 
  Video, 
  MessageCircle, 
  User, 
  DollarSign, 
  MapPin, 
  FileText,
  X,
  AlertCircle
} from 'lucide-react';

interface SessionDetailsModalProps {
  session: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function SessionDetailsModal({ session, isOpen, onClose }: SessionDetailsModalProps) {
  const [remainingTime, setRemainingTime] = useState<string>('');
  const [isSessionStarted, setIsSessionStarted] = useState(false);

  useEffect(() => {
    if (!session || !isOpen) return;

    const calculateRemainingTime = () => {
      const now = new Date();
      const sessionStart = new Date(session.scheduled_start);
      const sessionEnd = new Date(sessionStart.getTime() + (session.duration_minutes * 60 * 1000));
      
      // Check if session has started
      if (now >= sessionStart) {
        setIsSessionStarted(true);
        
        // Check if session has ended
        if (now >= sessionEnd) {
          setRemainingTime('Session ended');
          return;
        }
        
        // Calculate remaining time during session
        const remaining = sessionEnd.getTime() - now.getTime();
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        
        setRemainingTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setIsSessionStarted(false);
        // Calculate time until session starts
        const timeUntilStart = sessionStart.getTime() - now.getTime();
        const days = Math.floor(timeUntilStart / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeUntilStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilStart % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
          setRemainingTime(`${days} day${days > 1 ? 's' : ''} ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setRemainingTime(`${hours}h ${minutes}m`);
        } else {
          setRemainingTime(`${minutes}m`);
        }
      }
    };

    calculateRemainingTime();
    const interval = setInterval(calculateRemainingTime, 1000);

    return () => clearInterval(interval);
  }, [session, isOpen]);

  if (!session) return null;

  const sessionStart = new Date(session.scheduled_start);
  const sessionEnd = new Date(sessionStart.getTime() + (session.duration_minutes * 60 * 1000));
  const isUpcoming = new Date() < sessionStart;
  const isCompleted = session.status === 'completed';
  const isCancelled = session.status === 'cancelled';

  const getStatusColor = () => {
    if (isCancelled) return 'destructive';
    if (isCompleted) return 'default';
    if (isSessionStarted) return 'secondary';
    return 'outline';
  };

  const getStatusText = () => {
    if (isCancelled) return 'Cancelled';
    if (isCompleted) return 'Completed';
    if (isSessionStarted) return 'In Progress';
    return 'Confirmed';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Session Details</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Header */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {session.title || 'Mentoring Session'}
                  </h2>
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant={getStatusColor()} className="text-sm">
                      {getStatusText()}
                    </Badge>
                    <span className="text-lg font-semibold text-green-600">
                      ${session.final_price}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    {session.description || 'No description provided'}
                  </p>
                </div>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Video className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Remaining Time / Status */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-sm text-blue-600 mb-1">Remaining Time</div>
                <div className="text-3xl font-bold text-blue-800">
                  {remainingTime}
                </div>
                <div className="text-sm text-blue-600 mt-1">
                  {isSessionStarted ? 'Session in progress' : 'Until session starts'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date & Time */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">Date & Time</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Start:</span>
                    <span className="ml-2 font-medium">
                      {sessionStart.toLocaleDateString()} at {sessionStart.toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">End:</span>
                    <span className="ml-2 font-medium">
                      {sessionEnd.toLocaleDateString()} at {sessionEnd.toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <span className="ml-2 font-medium">{session.duration_minutes} minutes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session Details */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">Session Details</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium">
                      {session.call_session_type || 'Video Call'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={getStatusColor()} className="ml-2">
                      {getStatusText()}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Price:</span>
                    <span className="ml-2 font-medium text-green-600">
                      ${session.final_price}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Participant Information */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <User className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">Participant Information</h3>
              </div>
              
              {session.mentees ? (
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {session.mentees.users?.first_name} {session.mentees.users?.last_name}
                    </h4>
                    <p className="text-sm text-gray-600">{session.mentees.users?.email}</p>
                    {session.mentees.users?.bio && (
                      <p className="text-sm text-gray-500 mt-1">{session.mentees.users.bio}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No participant information available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {!isCompleted && !isCancelled && (
              <>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Video className="h-4 w-4 mr-2" />
                  {isSessionStarted ? 'Join Session' : 'Join Session'}
                </Button>
                <Button variant="outline" className="flex-1">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </>
            )}
            
            {isCompleted && (
              <Button variant="outline" className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                View Session Notes
              </Button>
            )}
            
            {isCancelled && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg w-full">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">This session was cancelled</span>
              </div>
            )}
          </div>

          {/* Additional Notes */}
          {session.notes && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Session Notes</h3>
                <p className="text-gray-600 text-sm">{session.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 