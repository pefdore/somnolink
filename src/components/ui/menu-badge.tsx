'use client';

import { useNotifications } from '@/hooks/useNotifications';

interface MenuBadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function MenuBadge({ children, className = '' }: MenuBadgeProps) {
  const { unreadCount } = useNotifications();

  return (
    <div className={`relative ${className}`}>
      {children}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium min-w-[20px]">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
}