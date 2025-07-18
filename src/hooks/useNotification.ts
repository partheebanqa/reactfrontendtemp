import { useEffect, useRef, useMemo } from "react";
import { notificationActions, useNotificationStore } from "@/store/notificationStore";

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
    
    // Use a ref to ensure we only load notifications once
    const initialized = useRef(false);
    
    // Initialize notifications on first load
    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            notificationActions.loadNotifications();
            notificationActions.loadPreferences();
        }
    }, []);
    
    // Use useMemo to maintain a consistent reference to the returned object
    // This prevents unnecessary re-renders in components that use this hook
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