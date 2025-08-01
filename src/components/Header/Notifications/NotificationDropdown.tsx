import React, { useState, useEffect, useCallback } from "react";
import NotificationItem from "./NotificationItem";
import NotificationPreferences from "./NotificationPreferences";
import { Settings, Check } from "lucide-react";
import { useNotification } from "@/hooks/useNotification";

interface NotificationDropdownProps {
  onClose: () => void;
  onMarkAllAsRead: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onClose,
  onMarkAllAsRead,
}) => {
  const {
    notifications,
    error,
    isLoading,
    createTestNotification,
    addNotification,
  } = useNotification();
  const [showPreferences, setShowPreferences] = useState(false);

  const handleTestNotification = useCallback(() => {
    createTestNotification();
  }, [createTestNotification]);


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const dropdown = document.querySelector(".notification-dropdown");
      
      // Check if the click was outside the dropdown and not on any Dialog element
      const isDialogClick = (event.target as Element)?.closest('[role="dialog"]');
      
      if (
        dropdown &&
        !dropdown.contains(event.target as Node) &&
        !isDialogClick
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [onClose]);

  const handleOpenPreferences = useCallback(() => {
    setShowPreferences(true);
  }, []);

  const handleClosePreferences = useCallback(() => {
    setShowPreferences(false);
  }, []);

  // Render a message when no notifications are available
  const renderEmptyState = useCallback(
    () => (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-gray-500 text-center">
        <div className="text-4xl mb-4 text-gray-300">🔔</div>
        <p className="font-medium mb-1">No notifications yet</p>
        <p className="text-sm">
          You'll see notifications here when there's activity on your account
        </p>
      </div>
    ),
    []
  );

  return (
    <>
      <div className="notification-dropdown absolute right-0 top-full mt-2 w-80 bg-white rounded-md shadow-lg z-50 border border-gray-200">
        <div className="flex justify-between items-center p-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Notifications</h3>
          <div className="flex space-x-2">
            <div
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 cursor-pointer px-2 py-1 rounded hover:bg-gray-100"
              onClick={onMarkAllAsRead}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              <span>Mark all as read</span>
            </div>
            <div
              className="p-1.5 rounded hover:bg-gray-100 cursor-pointer text-gray-600 hover:text-gray-900"
              onClick={handleOpenPreferences}
              title="Notification settings"
            >
              <Settings className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
              <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-blue-600 rounded-full mb-2"></div>
              <p>Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-6 text-gray-500">
              <p className="mb-2">Could not load notifications</p>
              <button
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          ) : notifications.length === 0 ? (
            renderEmptyState()
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))
          )}
        </div>

        <div className="p-3 border-t border-gray-200 flex flex-col gap-2">
          <button
            className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded transition-colors"
            onClick={handleTestNotification}
          >
            Send Test Notification
          </button>
        </div>
      </div>

      <NotificationPreferences
        show={showPreferences}
        handleClose={handleClosePreferences}
      />
    </>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default NotificationDropdown
