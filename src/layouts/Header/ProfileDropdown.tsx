import React, { useRef } from 'react';
import { User, Settings, HelpCircle, LogOut, Sun, Moon, Ghost, Palette } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ isOpen, onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  useClickOutside(dropdownRef, onClose);
  const navigate = useNavigate();

  const logOut = () => {
    localStorage.clear();
    navigate('/');
  }
  
  const accountSettings = () => {
    navigate('/settings');
  }

  if (!isOpen) return null;

  const themes = [
    { id: 'light', icon: Sun, label: 'Light Theme' },
    { id: 'dark', icon: Moon, label: 'Dark Theme' },
    { id: 'neutral', icon: Ghost, label: 'Neutral Theme' },
    { id: 'custom', icon: Palette, label: 'Custom Brand Colors' },
  ];

  return (
    <div ref={dropdownRef} className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
            <span className="text-blue-800 font-medium">U</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">John Doe</p>
            <p className="text-xs text-gray-500">john.doe@example.com</p>
          </div>
        </div>
      </div>

      <div className="py-2 border-b border-gray-100">
        <div className="px-4 py-2">
          <p className="text-xs font-medium text-gray-500">THEMES</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {themes.map((themeOption) => (
              <button
                key={themeOption.id}
                onClick={() => setTheme(themeOption.id as any)}
                className={`flex items-center justify-center p-2 rounded-md hover:bg-gray-100 ${
                  theme === themeOption.id ? 'bg-gray-100 text-blue-600' : 'text-gray-700'
                }`}
              >
                <themeOption.icon size={16} className="mr-2" />
                <span className="text-xs">{themeOption.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="py-1">
        <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          <User size={16} className="mr-3" />
          Your Profile
        </button>
        <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={accountSettings}>
          <Settings size={16} className="mr-3" />
          Account Settings
        </button>
        <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          <HelpCircle size={16} className="mr-3" />
          Help & Support
        </button>
        <button className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            onClick={logOut}>
          <LogOut size={16} className="mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;