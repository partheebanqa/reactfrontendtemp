import { Store, useStore } from '@tanstack/react-store';

// Define the notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

export interface NotificationPreference {
  type: string;
  enabled: boolean;
  description: string;
}

// Define the shape of our notification state
interface NotificationState {
  notifications: Notification[];
  isDropdownOpen: boolean;
  loading: boolean;
  error: string | null;
  preferences: NotificationPreference[];
  unreadCount: number;
}

const defaultPreferences: NotificationPreference[] = [
  { type: 'system', enabled: true, description: 'System notifications about maintenance and updates' },
  { type: 'activity', enabled: true, description: 'Activity on your tests and collections' },
  { type: 'mentions', enabled: true, description: 'When someone mentions you in comments' },
  { type: 'marketing', enabled: false, description: 'Marketing and promotional messages' }
];

// Initial state for notifications
export const initialNotificationState: NotificationState = {
  notifications: [],
  isDropdownOpen: false,
  loading: false,
  error: null,
  preferences: defaultPreferences,
  unreadCount: 0
};

// Create the store
export const notificationStore = new Store<NotificationState>(initialNotificationState);

// Mock API functions - in a real app, these would interact with your backend
const fetchNotifications = async (): Promise<Notification[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const now = new Date();
  
  // Mock data with more sample notifications
  return [
    {
      id: '1',
      title: 'System Update',
      message: 'The system will be undergoing maintenance tonight at 10PM UTC.',
      timestamp: new Date(now.getTime() - 3600000), // 1 hour ago
      read: false,
      type: 'info'
    },
    {
      id: '2',
      title: 'Test Run Completed',
      message: 'Your test suite "API Integration Tests" has completed successfully.',
      timestamp: new Date(now.getTime() - 86400000), // 1 day ago
      read: true,
      type: 'success',
      link: '/reports/latest'
    },
    {
      id: '3',
      title: 'New Feature Available',
      message: 'Check out our new reporting dashboard with enhanced visualizations.',
      timestamp: new Date(now.getTime() - 172800000), // 2 days ago
      read: false,
      type: 'info'
    },
    {
      id: '4',
      title: 'API Rate Limit Warning',
      message: 'You are approaching your API rate limit. Consider upgrading your plan.',
      timestamp: new Date(now.getTime() - 129600000), // 1.5 days ago
      read: false,
      type: 'warning'
    },
    {
      id: '5',
      title: 'Error in Test Execution',
      message: 'Test suite "Authentication Tests" failed due to connection timeout.',
      timestamp: new Date(now.getTime() - 43200000), // 12 hours ago
      read: false,
      type: 'error'
    },
    {
      id: '6',
      title: 'Collaboration Invite',
      message: 'John Doe has invited you to collaborate on project "E-commerce API".',
      timestamp: new Date(now.getTime() - 7200000), // 2 hours ago
      read: false,
      type: 'info',
      link: '/projects/123'
    },
    {
      id: '7',
      title: 'Security Alert',
      message: 'We detected a login from a new device. Please verify this was you.',
      timestamp: new Date(now.getTime() - 1800000), // 30 mins ago
      read: false,
      type: 'warning',
      link: '/security/devices'
    },
    {
      id: '8',
      title: 'Subscription Renewed',
      message: 'Your premium subscription has been automatically renewed.',
      timestamp: new Date(now.getTime() - 259200000), // 3 days ago
      read: true,
      type: 'success',
      link: '/billing'
    },
    {
      id: '9',
      title: 'Database Connection Issue',
      message: 'One of your database connections is experiencing latency issues.',
      timestamp: new Date(now.getTime() - 21600000), // 6 hours ago
      read: false,
      type: 'error'
    },
    {
      id: '10',
      title: 'Weekly Report Available',
      message: 'Your weekly performance report is now ready to view.',
      timestamp: new Date(now.getTime() - 345600000), // 4 days ago
      read: true,
      type: 'info',
      link: '/reports/weekly'
    }
  ];
};


// Define actions to update the store
export const notificationActions = {
  // Load notifications (would typically come from an API)
  loadNotifications: async () => {
    try {
      notificationStore.setState(state => ({
        ...state,
        loading: true,
        error: null
      }));
      
      const notifications = await fetchNotifications();
      const unreadCount = notifications.filter(n => !n.read).length;
      
      notificationStore.setState(state => ({
        ...state,
        notifications,
        loading: false,
        unreadCount
      }));
    } catch (error) {
      notificationStore.setState(state => ({
        ...state,
        error: 'Failed to fetch notifications',
        loading: false
      }));
    }
  },
  
  // Load preferences
  loadPreferences: async () => {
    try {
      const preferences = await fetchPreferences();
      
      notificationStore.setState(state => ({
        ...state,
        preferences
      }));
    } catch (error) {
      console.error('Failed to load notification preferences', error);
    }
  },

  // Toggle dropdown visibility
  toggleDropdown: () => {
    notificationStore.setState(state => ({
      ...state,
      isDropdownOpen: !state.isDropdownOpen
    }));
  },

  // Mark a notification as read
  markAsRead: async (id: string) => {
    // Optimistically update the UI
    notificationStore.setState(state => {
      const updatedNotifications = state.notifications.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      );
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.read).length
      };
    });
    
    // In a real app, you would make an API call here
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
      // You could roll back the optimistic update here if needed
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    // Optimistically update the UI
    notificationStore.setState(state => {
      const updatedNotifications = state.notifications.map(notification => ({
        ...notification,
        read: true
      }));
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: 0 // All notifications are read, so unread count is 0
      };
    });
    
    // In a real app, you would make an API call here
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
      // You could roll back the optimistic update here if needed
    }
  },

  // Create a test notification
  createTestNotification: async () => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      title: 'Test Notification',
      message: 'This is a test notification created at ' + new Date().toLocaleTimeString(),
      timestamp: new Date(),
      read: false,
      type: 'info'
    };
    
    notificationStore.setState(state => {
      const updatedNotifications = [newNotification, ...state.notifications];
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.read).length
      };
    });
    
    // In a real app, you might want to persist this notification to the server
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('Failed to create test notification', error);
    }
  },

  // Add a new notification
  addNotification: async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
      ...notification
    };
    
    notificationStore.setState(state => {
      const updatedNotifications = [newNotification, ...state.notifications];
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.read).length
      };
    });
    
    // In a real app, you would persist this to the server
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('Failed to add notification', error);
    }
  },
  
  // Remove a notification
  removeNotification: async (id: string) => {
    notificationStore.setState(state => {
      const updatedNotifications = state.notifications.filter(notification => notification.id !== id);
      return {
        ...state,
        notifications: updatedNotifications,
        // Update unread count to reflect removed notifications
        unreadCount: updatedNotifications.filter(n => !n.read).length
      };
    });
    
    // In a real app, you would make an API call here
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('Failed to remove notification', error);
    }
  },
  
  // Clear all notifications
  clearNotifications: async () => {
    notificationStore.setState(state => ({
      ...state,
      notifications: [],
      unreadCount: 0 // Reset unread count to 0 when clearing all notifications
    }));
    
    // In a real app, you would make an API call here
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('Failed to clear notifications', error);
    }
  },

  updatePreferences: async (newPreferences: NotificationPreference[]) => {
    notificationStore.setState(state => ({
      ...state,
      preferences: newPreferences
    }));
  }
};

// Hook to use the notification store with derived values
export const useNotificationStore = () => {
  return useStore(notificationStore);
};
