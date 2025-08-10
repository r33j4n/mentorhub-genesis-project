import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, HeartOff } from 'lucide-react';
import { MentorFollowService } from '@/services/mentorFollowService';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';


interface FollowMentorButtonProps {
  mentorId: string;
  mentorName: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export const FollowMentorButton: React.FC<FollowMentorButtonProps> = ({
  mentorId,
  mentorName,
  variant = 'outline',
  size = 'sm',
  className = ''
}) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkFollowStatus();
  }, [mentorId]);

  const checkFollowStatus = async () => {
    try {
      const following = await MentorFollowService.isFollowingMentor(mentorId);
      setIsFollowing(following);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (isLoading || !user) return;

    setIsLoading(true);
    try {
      console.log('Attempting to follow/unfollow mentor:', mentorId);
      console.log('Current follow status:', isFollowing);
      console.log('Current user ID:', user.id);
      
      let success: boolean;

      if (isFollowing) {
        console.log('Unfollowing mentor...');
        success = await MentorFollowService.unfollowMentor(mentorId);
        console.log('Unfollow result:', success);
        if (success) {
          setIsFollowing(false);
          toast({
            title: "Unfollowed",
            description: `You've unfollowed ${mentorName}`,
          });
        }
      } else {
        console.log('Following mentor...');
        success = await MentorFollowService.followMentor(mentorId);
        console.log('Follow result:', success);
        if (success) {
          setIsFollowing(true);
          toast({
            title: "Following",
            description: `You're now following ${mentorName}. You'll be notified of their public seminars!`,
          });
        }
      }

      if (!success) {
        console.error('Follow/unfollow operation failed');
        toast({
          title: "Error",
          description: `Failed to ${isFollowing ? 'unfollow' : 'follow'} ${mentorName}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: "Error",
        description: `Failed to ${isFollowing ? 'unfollow' : 'follow'} ${mentorName}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={`animate-pulse ${className}`}
      >
        <div className="w-4 h-4 bg-current rounded-full animate-spin mr-2"></div>
        Loading...
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleFollowToggle}
      disabled={isLoading}
      className={`transition-all duration-200 ${
        isFollowing 
          ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600' 
          : 'hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600'
      } ${className}`}
    >
      {isFollowing ? (
        <>
          <HeartOff className="h-4 w-4 mr-2" />
          Unfollow
        </>
      ) : (
        <>
          <Heart className="h-4 w-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  );
}; 