import React from 'react';
import SidebarItem from './SidebarItem';
import { 
  Home, 
  DollarSign, 
  Box, 
  Monitor, 
  Inbox, 
  Users, 
  Megaphone, 
  BarChart,
  Zap, 
  Settings,
  Pencil,
  Plus,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isExpanded: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isExpanded, toggleSidebar }) => {
  return (
    <div 
      className={`
        bg-sidebar h-[calc(100vh-4rem)] flex flex-col justify-between transition-all duration-300 ease-in-out relative
        ${isExpanded ? 'w-64' : 'w-16'}
      `}
    >
      {!isExpanded && (
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      )}
      <div>
        {/* Top buttons */}
        <div className="flex items-center px-4 py-3 border-b border-gray-800">
          {isExpanded ? (
            <div className="flex items-center justify-between w-full">
              <button className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-400">
                <Home size={16} />
              </button>
              <button 
                onClick={toggleSidebar}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <button className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-400">
                <Home size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Quick action button */}
        {isExpanded ? (
          <div className="p-4">
            <button className="bg-white text-black rounded px-4 py-2 w-full text-sm font-medium flex items-center justify-center">
              <span>Quick Actions</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="ml-2"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="py-4 flex justify-center">
            <button className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-400">
              <Plus size={16} />
            </button>
          </div>
        )}

        {/* Progress section */}
        {isExpanded && (
          <div className="px-4 py-3 border-y border-gray-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white text-sm">Let's set up your business</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="text-gray-400"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
            <div className="flex items-center">
              <span className="text-xs text-gray-400">0/4 completed</span>
              <div className="ml-2 bg-gray-700 h-1 flex-1 rounded-full">
                <div className="bg-blue-500 h-1 w-0 rounded-full"></div>
              </div>
            </div>
          </div>
        )}
        {!isExpanded && (
          <div className="py-3 border-y border-gray-800 flex flex-col items-center">
            <div className="text-xs text-gray-400">0/4</div>
            <div className="text-xs text-gray-400 mt-1">LS</div>
          </div>
        )}

        {/* Menu items */}
        <div className="overflow-y-auto">
          <SidebarItem 
            icon={DollarSign} 
            label="Sales" 
            isExpanded={isExpanded} 
            hasSubmenu={true} 
          />
          <SidebarItem 
            icon={Box} 
            label="Apps" 
            isExpanded={isExpanded} 
            hasSubmenu={true} 
          />
          <SidebarItem 
            icon={Monitor} 
            label="Site & Mobile App" 
            isExpanded={isExpanded} 
            hasSubmenu={true} 
          />
          <SidebarItem 
            icon={Inbox} 
            label="Inbox" 
            isExpanded={isExpanded} 
          />
          <SidebarItem 
            icon={Users} 
            label="Customers & Leads" 
            isExpanded={isExpanded} 
            hasSubmenu={true} 
          />
          <SidebarItem 
            icon={Megaphone} 
            label="Marketing" 
            isExpanded={isExpanded} 
            hasSubmenu={true} 
          />
          <SidebarItem 
            icon={BarChart} 
            label="Analytics" 
            isExpanded={isExpanded} 
            hasSubmenu={true} 
          />
          <SidebarItem 
            icon={Zap} 
            label="Automations" 
            isExpanded={isExpanded} 
            hasSubmenu={true} 
          />
          <SidebarItem 
            icon={Settings} 
            label="Settings" 
            isExpanded={isExpanded} 
          />
        </div>
      </div>

      {/* Design site button */}
      {isExpanded ? (
        <div className="px-4 py-3 bg-gray-900">
          <button className="w-full py-2 text-sm font-medium text-white flex items-center justify-center">
            <Pencil size={16} className="mr-2" />
            <span>Design Site</span>
          </button>
        </div>
      ) : (
        <div className="py-3 bg-gray-900 flex justify-center">
          <button className="text-white">
            <Pencil size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;