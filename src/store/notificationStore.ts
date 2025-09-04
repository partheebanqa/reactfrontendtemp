import { Store, useStore } from "@tanstack/react-store";

// Define the notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: "info" | "success" | "warning" | "error";
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

export const defaultPreferences: NotificationPreference[] = [
  {
    type: "system",
    enabled: true,
    description: "System notifications about maintenance and updates",
  },
  {
    type: "activity",
    enabled: true,
    description: "Activity on your tests and collections",
  },
  {
    type: "mentions",
    enabled: true,
    description: "When someone mentions you in comments",
  },
  {
    type: "marketing",
    enabled: false,
    description: "Marketing and promotional messages",
  },
];

// Initial state for notifications
export const initialNotificationState: NotificationState = {
  notifications: [],
  isDropdownOpen: false,
  loading: false,
  error: null,
  preferences: defaultPreferences,
  unreadCount: 0,
};

// Create the store
export const notificationStore = new Store<NotificationState>(
  initialNotificationState
);

// Define actions to update the store
export const notificationActions = {
  setNotifications: async (notifications: Notification[]) => {
    notificationStore.setState((state) => ({
      ...state,
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }));
  },

  setPreferences: async (preferences: NotificationPreference[]) => {
    notificationStore.setState((state) => ({
      ...state,
      preferences,
    }));
  },

  toggleDropdown: () => {
    notificationStore.setState((state) => ({
      ...state,
      isDropdownOpen: !state.isDropdownOpen,
    }));
  },

  // Mark a notification as read
  markAsRead: async (id: string) => {
    notificationStore.setState((state) => {
      const updatedNotifications = state.notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      );
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter((n) => !n.read).length,
      };
    });
  },

  markAllAsRead: async () => {
    notificationStore.setState((state) => {
      const updatedNotifications = state.notifications.map((notification) => ({
        ...notification,
        read: true,
      }));
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: 0, // All notifications are read, so unread count is 0
      };
    });
  },

  createTestNotification: async () => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      title: "Test Notification",
      message:
        "This is a test notification created at " +
        new Date().toLocaleTimeString(),
      timestamp: new Date(),
      read: false,
      type: "info",
    };

    notificationStore.setState((state) => {
      const updatedNotifications = [newNotification, ...state.notifications];
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter((n) => !n.read).length,
      };
    });
  },

  // Add a new notification
  addNotification: async (
    notification: Omit<Notification, "id" | "timestamp" | "read">
  ) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
      ...notification,
    };

    notificationStore.setState((state) => {
      const updatedNotifications = [newNotification, ...state.notifications];
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter((n) => !n.read).length,
      };
    });
  },

  // Remove a notification
  removeNotification: async (id: string) => {
    notificationStore.setState((state) => {
      const updatedNotifications = state.notifications.filter(
        (notification) => notification.id !== id
      );
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter((n) => !n.read).length,
      };
    });
  },

  clearNotifications: async () => {
    notificationStore.setState((state) => ({
      ...state,
      notifications: [],
      unreadCount: 0,
    }));
  },

  updatePreferences: async (newPreferences: NotificationPreference[]) => {
    notificationStore.setState((state) => ({
      ...state,
      preferences: newPreferences,
    }));
  },
};

// Hook to use the notification store with derived values
export const useNotificationStore = () => {
  return useStore(notificationStore);
};
