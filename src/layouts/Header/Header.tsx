import React, { useState } from 'react';
import { ChevronDown, Bell, Menu } from 'lucide-react';
import ProfileDropdown from './ProfileDropdown';
import NotificationBell from '../../components/notifications/NotificationBell';
// import NotificationDropdown from './NotificationDropdown';

interface HeaderProps {
  isExpanded: boolean;
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ isExpanded, toggleSidebar }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  return (
    <div className="flex items-center justify-between h-14 px-4 header-theme border-b border-gray-200">
      <div className="flex items-center">
        {!isExpanded && (
          <button 
            onClick={toggleSidebar}
            className="mr-4 opacity-75 hover:opacity-100 transition-opacity"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="font-bold text-xl">WIX</div>
        <div className="ml-4 flex items-center">
          <span className="text-sm">doorstepshop</span>
          <ChevronDown size={16} className="ml-1" />
        </div>
      </div>
      <div className="flex items-center">
        {/* <div className="relative">
          <button
            onClick={() => {
              setIsNotificationOpen(!isNotificationOpen);
              setIsProfileOpen(false);
            }}
            className="relative mr-4 opacity-75 hover:opacity-100 transition-opacity"
          >
            <Bell size={20} />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
              3
            </div>
          </button> */}
          {/* <NotificationDropdown
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
          /> */}
        {/* </div> */}
        <NotificationBell/>
        <div className="relative">
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotificationOpen(false);
            }}
            className="flex items-center"
          >
            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-800">
              U
            </div>
            <ChevronDown size={16} className="ml-1 opacity-75" />
          </button>
          <ProfileDropdown
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default Header;