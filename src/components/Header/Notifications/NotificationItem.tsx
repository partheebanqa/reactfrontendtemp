import React, { useCallback } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  AlertOctagon
} from 'lucide-react';
import { Notification } from '../../../store/notificationStore';
import { useNotification } from '@/hooks/useNotification';

interface NotificationItemProps {
  notification: Notification;
}

// Component
const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const { markAsRead } = useNotification();

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.link) {
      // Use react-router navigation for internal links
      if (notification.link.startsWith('/')) {
        window.location.href = notification.link;
      } else {
        // For external links, open in new tab
        window.open(notification.link, '_blank', 'noopener,noreferrer');
      }
    }
  }, [notification.id, notification.read, notification.link, markAsRead]);

  const getIcon = useCallback(() => {
    switch (notification.type) {
      case 'info':
        return <Bell className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertOctagon className="h-4 w-4" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  }, [notification.type]);

  const getIconStyles = useCallback(() => {
    const baseClasses = "flex items-center justify-center min-w-[34px] h-[34px] rounded-full mr-3";
    
    switch (notification.type) {
      case 'info':
        return `${baseClasses} bg-blue-50 text-blue-600`;
      case 'success':
        return `${baseClasses} bg-green-50 text-green-600`;
      case 'warning':
        return `${baseClasses} bg-amber-50 text-amber-600`;
      case 'error':
        return `${baseClasses} bg-red-50 text-red-600`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-600`;
    }
  }, [notification.type]);

  const getTimeAgo = useCallback((date: Date | string): string => {
    try {
      const now = new Date();
      // Ensure the date is properly parsed regardless of its format
      const timestamp = date instanceof Date ? date : new Date(date);
      
      // Check if timestamp is valid
      if (isNaN(timestamp.getTime())) {
        console.error('Invalid timestamp:', date);
        return 'Unknown time';
      }
      
      const diffMs = now.getTime() - timestamp.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) {
        return 'just now';
      } else if (diffMins < 60) {
        return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`;
      } else if (diffHours < 24) {
        return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
      } else if (diffDays < 7) {
        return diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;
      } else {
        return timestamp.toLocaleDateString();
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Unknown time';
    }
  }, []);

  return (
    <div 
      className={`p-3 border-b border-gray-100 cursor-pointer flex items-start transition-colors ${
        notification.read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'
      }`}
      onClick={handleClick}
    >
      <div className={getIconStyles()}>
        {getIcon()}
      </div>
      <div className="flex-1">
        <div className={`mb-1 text-sm ${notification.read ? 'font-normal' : 'font-semibold'}`}>
          {notification.title}
        </div>
        <div className="text-gray-600 text-xs mb-2">
          {notification.message}
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>{getTimeAgo(notification.timestamp)}</span>
        </div>
      </div>
    </div>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(NotificationItem);
