'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell } from 'lucide-react';

interface NotificationBadgeProps {
  userType: 'doctor' | 'patient';
  className?: string;
}

export function NotificationBadge({ userType, className = '' }: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    fetchUnreadCount();

    // Écouter les nouveaux messages en temps réel
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_notifications'
        },
        (payload) => {
          fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'message_notifications'
        },
        (payload) => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userType]);

  const fetchUnreadCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count, error } = await supabase
        .from('message_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Erreur récupération notifications:', error);
        return;
      }

      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  if (unreadCount === 0) {
    return (
      <div className={`relative ${className}`}>
        <Bell className="h-5 w-5 text-gray-500" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Bell className="h-5 w-5 text-gray-500" />
      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    </div>
  );
}

// Hook pour utiliser les notifications dans les composants
export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  const fetchUnreadCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count, error } = await supabase
        .from('message_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Erreur récupération notifications:', error);
        return;
      }

      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const markAsRead = async (messageIds?: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('message_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id);

      if (messageIds && messageIds.length > 0) {
        query = query.in('message_id', messageIds);
      }

      const { error } = await query;

      if (error) {
        console.error('Erreur marquage notifications:', error);
        return;
      }

      await fetchUnreadCount();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_notifications'
        },
        () => fetchUnreadCount()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'message_notifications'
        },
        () => fetchUnreadCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    unreadCount,
    fetchUnreadCount,
    markAsRead
  };
}