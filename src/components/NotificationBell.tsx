import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, X, BookOpen, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { MentorFollowService, SeminarNotification } from '@/services/mentorFollowService';
import { formatDistanceToNow } from 'date-fns';

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [seminarNotifications, setSeminarNotifications] = useState<SeminarNotification[]>([]);
  const [seminarUnreadCount, setSeminarUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadSeminarNotifications();
  }, []);

  const loadSeminarNotifications = async () => {
    try {
      const notifications = await MentorFollowService.getSeminarNotifications();
      setSeminarNotifications(notifications);
      const unreadCount = await MentorFollowService.getUnreadNotificationCount();
      setSeminarUnreadCount(unreadCount);
    } catch (error) {
      console.error('Error loading seminar notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleDelete = async (notificationId: string) => {
    await deleteNotification(notificationId);
  };

  const handleMarkSeminarAsRead = async (notificationId: string) => {
    try {
      const success = await MentorFollowService.markNotificationAsRead(notificationId);
      if (success) {
        setSeminarNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setSeminarUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking seminar notification as read:', error);
    }
  };

  const handleMarkAllSeminarAsRead = async () => {
    try {
      const success = await MentorFollowService.markAllNotificationsAsRead();
      if (success) {
        setSeminarNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true }))
        );
        setSeminarUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all seminar notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'session_request':
        return '📅';
      case 'session_accepted':
        return '✅';
      case 'session_rejected':
        return '❌';
      case 'session_reminder':
        return '⏰';
      case 'system':
        return '🔔';
      default:
        return '📢';
    }
  };

  const getSeminarNotificationIcon = (type: SeminarNotification['notification_type']) => {
    switch (type) {
      case 'new_seminar':
        return <BookOpen className="h-4 w-4 text-purple-600" />;
      case 'seminar_reminder':
        return <Bell className="h-4 w-4 text-yellow-600" />;
      case 'seminar_starting':
        return <BookOpen className="h-4 w-4 text-green-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'session_accepted':
        return 'text-green-600 bg-green-50';
      case 'session_rejected':
        return 'text-red-600 bg-red-50';
      case 'session_reminder':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const totalUnreadCount = unreadCount + seminarUnreadCount;
  const allNotifications = [
    ...seminarNotifications.map(n => ({
      id: n.id,
      type: 'seminar' as const,
      title: n.title,
      message: n.message,
      is_read: n.is_read,
      created_at: n.created_at,
      seminar: n.seminar,
      mentor: n.mentor
    })),
    ...notifications
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {totalUnreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 z-50">
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notifications</CardTitle>
                <div className="flex items-center gap-2">
                  {totalUnreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        markAllAsRead();
                        handleMarkAllSeminarAsRead();
                      }}
                      className="text-xs"
                    >
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-80">
                {allNotifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {allNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          !notification.is_read ? 'bg-purple-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {notification.type === 'seminar' ? (
                              getSeminarNotificationIcon(notification.notification_type)
                            ) : (
                              <span className="text-lg">
                                {getNotificationIcon(notification.type)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${
                                  !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                                }`}>
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                {!notification.is_read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (notification.type === 'seminar') {
                                        handleMarkSeminarAsRead(notification.id);
                                      } else {
                                        handleMarkAsRead(notification.id);
                                      }
                                    }}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(notification.id)}
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}; 