import React, { useMemo } from "react";
import { Bell } from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";
import { useNotification } from "@/hooks/useNotification";
import TooltipContainer from "@/components/ui/tooltip-container";

// TypeScript version of NotificationBell component
const NotificationBell: React.FC = () => {
  const {
    unreadCount,
    isDropdownOpen,
    toggleDropdown,
    markAllAsRead,
    clearNotifications
  } = useNotification();

  const handleMarkAllAsRead = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ): void => {
    e.stopPropagation(); // Stop event from bubbling up
    markAllAsRead();
  };

  const handleToggleDropdown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
    e.stopPropagation(); // Stop event from bubbling up
    toggleDropdown();
  };

  const NotificationDropDown = useMemo(() => {
    return isDropdownOpen ? (
      <NotificationDropdown
        onClose={toggleDropdown}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    ) : null;
  }, [isDropdownOpen, toggleDropdown, handleMarkAllAsRead]);

  return (
    <div
      className="relative flex items-center cursor-pointer"
      onClick={handleToggleDropdown}
    >
      <TooltipContainer text="Notifications" children={
        <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
      } />

      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3 h-3 sm:w-4 sm:h-4 text-[8px] sm:text-[10px] flex items-center justify-center font-bold border border-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </div>
      )}

      {NotificationDropDown}
    </div>
  );
};

export default React.memo(NotificationBell);
