import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Notification {
  id: string;
  doctor_id: string;
  patient_id: string;
  type: 'message' | 'appointment' | 'other';
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchNotifications();
    setupRealtimeSubscription();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[useNotifications] No user found');
        setIsLoading(false);
        return;
      }

      console.log('[useNotifications] Fetching notifications for user:', user.id);

      // Filtrer directement sur user_id - c'est la colonne principale
      const { data, error } = await supabase
        .from('message_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useNotifications] Error fetching notifications:', error);
        setIsLoading(false);
        return;
      }

      console.log('[useNotifications] Notifications found:', data?.length || 0);
      setNotifications((data as Notification[]) || []);
      setUnreadCount(data?.filter((n: Notification) => !n.is_read).length || 0);
      setIsLoading(false);
    } catch (error) {
      console.error('[useNotifications] Error in fetchNotifications:', error);
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_notifications'
        },
        () => {
          fetchNotifications(); // Refresh notifications on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('message_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      // Update local state
      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return false;
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      console.log('[useNotifications] Marking all notifications as read for user:', user.id);

      const { error } = await supabase
        .from('message_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('[useNotifications] Error marking all notifications as read:', error);
        return false;
      }

      console.log('[useNotifications] All notifications marked as read');
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);

      return true;
    } catch (error) {
      console.error('[useNotifications] Error in markAllAsRead:', error);
      return false;
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  };
}