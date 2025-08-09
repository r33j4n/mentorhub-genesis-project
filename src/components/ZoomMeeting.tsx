import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Video, Phone, PhoneOff, Mic, MicOff, VideoOff, MessageCircle, X, Clock, Users, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ZoomMeetingProps {
  sessionId: string;
  meetingId: string;
  password?: string;
  startTime: string;
  endTime: string;
  mentorName: string;
  menteeName: string;
  sessionTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSessionEnd: () => void;
}

interface SessionStatus {
  isActive: boolean;
  isCancelled: boolean;
  startTime: Date;
  endTime: Date;
}

export const ZoomMeeting: React.FC<ZoomMeetingProps> = ({
  sessionId,
  meetingId,
  password,
  startTime,
  endTime,
  mentorName,
  menteeName,
  sessionTitle,
  isOpen,
  onClose,
  onSessionEnd
}) => {
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>({
    isActive: false,
    isCancelled: false,
    startTime: new Date(startTime),
    endTime: new Date(endTime)
  });
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [participants, setParticipants] = useState<string[]>([mentorName, menteeName]);
  
  const meetingRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isOpen) {
      // Initialize Zoom SDK
      initializeZoomMeeting();
      startTimeTracking();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOpen]);

  const initializeZoomMeeting = () => {
    // Initialize Zoom Web SDK
    if (window.ZoomMtg) {
      window.ZoomMtg.setZoomJSLib('https://source.zoom.us/2.18.0/lib', '/av');
      window.ZoomMtg.preLoadWasm();
      window.ZoomMtg.prepareWebSDK();
      
      // Set language
      window.ZoomMtg.i18n.load('en-US');
      window.ZoomMtg.i18n.reload('en-US');

      // Set up meeting options
      window.ZoomMtg.init({
        leaveUrl: window.location.origin,
        success: () => {
          console.log('Zoom meeting initialized');
        },
        error: (error: any) => {
          console.error('Zoom initialization error:', error);
          toast({
            title: "Zoom Error",
            description: "Failed to initialize Zoom meeting",
            variant: "destructive"
          });
        }
      });
    }
  };

  const startTimeTracking = () => {
    intervalRef.current = setInterval(() => {
      const now = new Date();
      const end = new Date(endTime);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        // Session time expired
        endSession();
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
  };

  const joinMeeting = async () => {
    try {
      if (!window.ZoomMtg) {
        toast({
          title: "Zoom Error",
          description: "Zoom SDK not loaded",
          variant: "destructive"
        });
        return;
      }

      // Update session status to in_progress
      await updateSessionStatus('in_progress');

      window.ZoomMtg.join({
        signature: generateSignature(meetingId), // You'll need to implement this
        meetingNumber: meetingId,
        userName: menteeName,
        passWord: password || '',
        success: () => {
          setIsJoined(true);
          setSessionStatus(prev => ({ ...prev, isActive: true }));
          toast({
            title: "Meeting Joined",
            description: "Successfully joined the Zoom meeting",
          });
        },
        error: (error: any) => {
          console.error('Join meeting error:', error);
          toast({
            title: "Join Error",
            description: "Failed to join the meeting",
            variant: "destructive"
          });
        }
      });
    } catch (error) {
      console.error('Error joining meeting:', error);
      toast({
        title: "Error",
        description: "Failed to join the meeting",
        variant: "destructive"
      });
    }
  };

  const leaveMeeting = async () => {
    try {
      if (window.ZoomMtg) {
        window.ZoomMtg.leaveMeeting();
      }
      
      setIsJoined(false);
      setSessionStatus(prev => ({ ...prev, isActive: false }));
      
      await updateSessionStatus('completed');
      onSessionEnd();
      
      toast({
        title: "Meeting Ended",
        description: "You have left the meeting",
      });
    } catch (error) {
      console.error('Error leaving meeting:', error);
    }
  };

  const cancelSession = async () => {
    try {
      await updateSessionStatus('cancelled');
      setSessionStatus(prev => ({ ...prev, isCancelled: true }));
      
      toast({
        title: "Session Cancelled",
        description: "The session has been cancelled",
      });
      
      onClose();
    } catch (error) {
      console.error('Error cancelling session:', error);
      toast({
        title: "Error",
        description: "Failed to cancel session",
        variant: "destructive"
      });
    }
  };

  const endSession = async () => {
    try {
      if (window.ZoomMtg) {
        window.ZoomMtg.leaveMeeting();
      }
      
      await updateSessionStatus('completed');
      setSessionStatus(prev => ({ ...prev, isActive: false }));
      
      toast({
        title: "Session Ended",
        description: "The session has ended",
      });
      
      onSessionEnd();
      onClose();
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const updateSessionStatus = async (status: 'in_progress' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating session status:', error);
      throw error;
    }
  };

  const generateSignature = (meetingId: string) => {
    // This is a placeholder - you'll need to implement proper signature generation
    // using your Zoom API credentials
    return 'signature_placeholder';
  };

  const toggleMute = () => {
    if (window.ZoomMtg) {
      if (isMuted) {
        window.ZoomMtg.mute();
      } else {
        window.ZoomMtg.unmute();
      }
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (window.ZoomMtg) {
      if (isVideoOn) {
        window.ZoomMtg.stopVideo();
      } else {
        window.ZoomMtg.startVideo();
      }
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleScreenShare = () => {
    if (window.ZoomMtg) {
      if (isScreenSharing) {
        window.ZoomMtg.stopShare();
      } else {
        window.ZoomMtg.startShare();
      }
      setIsScreenSharing(!isScreenSharing);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0">
        <DialogHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">{sessionTitle}</DialogTitle>
              <p className="text-gray-600">Meeting ID: {meetingId}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={sessionStatus.isCancelled ? "destructive" : "secondary"}>
                {sessionStatus.isCancelled ? "Cancelled" : "Active"}
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Meeting Controls */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">{timeRemaining}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="text-sm">{participants.length} participants</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {!isJoined ? (
                <Button onClick={joinMeeting} className="bg-green-600 hover:bg-green-700">
                  <Phone className="h-4 w-4 mr-2" />
                  Join Meeting
                </Button>
              ) : (
                <>
                  <Button
                    variant={isMuted ? "destructive" : "outline"}
                    size="sm"
                    onClick={toggleMute}
                  >
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant={!isVideoOn ? "destructive" : "outline"}
                    size="sm"
                    onClick={toggleVideo}
                  >
                    {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant={isScreenSharing ? "default" : "outline"}
                    size="sm"
                    onClick={toggleScreenShare}
                  >
                    Share Screen
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={leaveMeeting}
                  >
                    <PhoneOff className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Meeting Area */}
          <div className="flex-1 relative">
            <div 
              ref={meetingRef}
              className="w-full h-full bg-black"
              id="zmmtg-root"
            >
              {/* Zoom meeting will be rendered here */}
              {!isJoined && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-white">
                    <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">Ready to Join?</h3>
                    <p className="text-gray-300 mb-4">
                      Click "Join Meeting" to start your session with {mentorName}
                    </p>
                    <Button onClick={joinMeeting} size="lg">
                      <Phone className="h-4 w-4 mr-2" />
                      Join Meeting
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Session Actions */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Reschedule
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={cancelSession}
                  disabled={sessionStatus.isCancelled}
                >
                  Cancel Session
                </Button>
                {isJoined && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={endSession}
                  >
                    End Session
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Add Zoom SDK types
declare global {
  interface Window {
    ZoomMtg: {
      setZoomJSLib: (path: string, dir: string) => void;
      preLoadWasm: () => void;
      prepareWebSDK: () => void;
      i18n: {
        load: (lang: string) => void;
        reload: (lang: string) => void;
      };
      init: (options: any) => void;
      join: (options: any) => void;
      leaveMeeting: () => void;
      mute: () => void;
      unmute: () => void;
      startVideo: () => void;
      stopVideo: () => void;
      startShare: () => void;
      stopShare: () => void;
    };
  }
} 