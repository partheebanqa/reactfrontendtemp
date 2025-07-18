import { useEffect, useRef, useMemo } from "react";
import { notificationActions, useNotificationStore } from "@/store/notificationStore";
import { useNotificationQuery } from "@/store/query/notificationQuery";

export function useNotification() {
    // Get state from notification store
    const { 
        notifications, 
        isDropdownOpen, 
        loading: isLoading, 
        error, 
        preferences,
        unreadCount
    } = useNotificationStore();
    
    // Setup queries and mutations
    //   const { refetch: refreshWorkspaces, isLoading: isRefetching } =
    //     useNotificationQuery(isAuthenticated && shouldFetchWorkspaces);
        


    return {
        // State
        notifications,
        isLoading,
        error,
        isDropdownOpen,
        preferences,
        unreadCount,
        
        // Actions
        loadNotifications: notificationActions.loadNotifications,
        markAsRead: notificationActions.markAsRead,
        markAllAsRead: notificationActions.markAllAsRead,
        toggleDropdown: notificationActions.toggleDropdown,
        createTestNotification: notificationActions.createTestNotification,
        updatePreferences: notificationActions.updatePreferences,
        clearNotifications: notificationActions.clearNotifications,
        addNotification: notificationActions.addNotification,
        removeNotification: notificationActions.removeNotification
    };
}