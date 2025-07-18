import React, { useMemo } from "react";
import { Bell } from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { useNotification } from "@/hooks/useNotification";

// TypeScript version of NotificationBell component
const NotificationBell: React.FC = () => {
  const { 
    unreadCount, 
    isDropdownOpen, 
    toggleDropdown, 
    markAllAsRead 
  } = useNotification();
    console.log("🚀 ~ isDropdownOpen:", isDropdownOpen)

  // Type the event parameter for the event handler
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
      className="relative flex items-center mr-4 cursor-pointer"
      onClick={handleToggleDropdown}
    >
      <TooltipPrimitive.Provider>
        <TooltipPrimitive.Root>
          <TooltipPrimitive.Trigger asChild>
            <Bell className="h-5 w-5 text-gray-400" />
          </TooltipPrimitive.Trigger>
          <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
              className="bg-gray-800 text-white px-2 py-1 rounded text-xs"
              sideOffset={5}
            >
              Notifications
              <TooltipPrimitive.Arrow className="fill-gray-800" />
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
      </TooltipPrimitive.Provider>

      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-bold border-2 border-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </div>
      )}

      {NotificationDropDown}
    </div>
  );
};

export default React.memo(NotificationBell);
