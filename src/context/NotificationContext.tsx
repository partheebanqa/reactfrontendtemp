import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { useToast } from './ToastContext';
import { useApi } from './ApiContext';
import websocketService from '../services/common/webSocketService';
// Types for notification preferences and notification objects
interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
}

export interface NotificationPreference {
  systemEnabled: boolean;
  executionEnabled: boolean;
  paymentEnabled: boolean;
  desktopNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  notificationDelay: number;
  doNotDisturbEnabled: boolean;
  doNotDisturbFrom: string;
  doNotDisturbTo: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  isDropdownOpen: boolean;
  preferences: NotificationPreference;
  toggleDropdown: () => void;
  closeDropdown: () => void;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (newPreferences: NotificationPreference) => Promise<void>;
  createTestNotification: () => Promise<void>;
  error:any;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// export const useNotification = useContext(NotificationContext);

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC = ({ children }:any) => {
  const { currentUser } = useApi();
  const { showToast } = useToast();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<NotificationPreference>({
    systemEnabled: true,
    executionEnabled: true,
    paymentEnabled: true,
    desktopNotificationsEnabled: true,
    emailNotificationsEnabled: false,
    notificationDelay: -1,
    doNotDisturbEnabled: false,
    doNotDisturbFrom: '22:00',
    doNotDisturbTo: '08:00',
  });

  // Toggle notification dropdown
  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  // Close notification dropdown
  const closeDropdown = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (): Promise<void> => {
    if (!currentUser?.id) return;

    setLoading(true);
    try {
      const response = await axios.get('/api/notifications');
      // setNotifications(response.data);
      setNotifications([]);
      setUnreadCount(response.data.filter((notif: Notification) => !notif.read).length);
    } catch (error:any) {
      if (error.response?.status === 404) {
        console.log('Notification system not available');
        setNotifications([]);
        setUnreadCount(0);
      } else {
        console.error('Error fetching notifications:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Fetch unread count only (lighter operation)
  const fetchUnreadCount = useCallback(async (): Promise<void> => {
    if (!currentUser?.id) return;

    try {
      const response = await axios.get('/api/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [currentUser]);

  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    try {
      await axios.post(`/api/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, read: true } : notification
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<void> => {
    try {
      await axios.post('/api/notifications/mark-all-read');
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  // Delete a notification
  const deleteNotification = useCallback(async (notificationId: string): Promise<void> => {
    try {
      await axios.delete(`/api/notifications/${notificationId}`);
      const updatedNotifications = notifications.filter((notification) => notification.id !== notificationId);
      setNotifications(updatedNotifications);
      const wasUnread = notifications.find((n) => n.id === notificationId)?.read === false;
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications]);

  // Fetch notification preferences
  const fetchPreferences = useCallback(async (): Promise<void> => {
    if (!currentUser?.id) return;

    try {
      const response = await axios.get('/api/notification-preferences');
      setPreferences(response.data);
    } catch (error : any) {
      if (error.response?.status === 404) {
        console.log('Notification preferences system not available');
      } else {
        console.error('Error fetching notification preferences:', error);
      }
    }
  }, [currentUser]);

  // Update notification preferences
  const updatePreferences = useCallback(async (newPreferences: NotificationPreference): Promise<void> => {
    try {
      const response = await axios.put('/api/notification-preferences', newPreferences);
      setPreferences(response.data);
      showToast({
        type: 'success',
        message: 'Notification preferences updated',
        id: 0
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      showToast({
        type: 'error',
        message: 'Failed to update notification preferences',
        id: 0
      });
    }
  }, [showToast]);

  // Initialize WebSocket connection for real-time notifications
  useEffect(() => {
    if (!currentUser?.id) return;

    websocketService.connect();
    websocketService.subscribe('notifications', { userId: currentUser.id });

    const handleWebSocketMessage = (event: MessageEvent): void => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          // setNotifications((prev) => [data.data, ...prev]);
          setUnreadCount((prev) => prev + 1);
          if (preferences.desktopNotificationsEnabled) {
            showToast({
              type: 'info',
              title: data.data.title,
              message: data.data.message,
              id: 0
            });
          }
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };

    websocketService.onMessage(handleWebSocketMessage);
    websocketService.sendMessage({
      type: 'register_for_notifications',
      userId: currentUser.id,
    });

    fetchNotifications();
    fetchPreferences();

    return () => {
      websocketService.unsubscribe('notifications');
    };
  }, [currentUser, fetchNotifications, fetchPreferences, preferences.desktopNotificationsEnabled, showToast]);

  // Create a test notification - used for development/testing
  const createTestNotification = useCallback(async (): Promise<void> => {
    try {
      await axios.post('/api/notifications/test');
      showToast({
        type: 'success',
        message: 'Test notification created',
        id: 0
      });
    } catch (error) {
      console.error('Error creating test notification:', error);
      showToast({
        type: 'error',
        message: 'Failed to create test notification',
        id: 0
      });
    }
  }, [showToast]);

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    isDropdownOpen,
    preferences,
    toggleDropdown,
    closeDropdown,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchPreferences,
    updatePreferences,
    createTestNotification,
    error:"error"
  };

  return <NotificationContext.Provider value={contextValue}>{children}</NotificationContext.Provider>;
};

export default NotificationContext;
