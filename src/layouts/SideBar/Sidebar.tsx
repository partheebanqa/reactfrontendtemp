import React from 'react';
import SidebarItem from './SidebarItem';
import { 
  Home, 
  Settings,
  Pencil,
  ChevronRight,
  ChevronLeft,
  Folder,
  Database,
  Calendar,
  PieChart,
  Send
} from 'lucide-react';
import { FaChartBar } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

interface SidebarProps {
  isExpanded: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isExpanded, toggleSidebar }) => {
  const location = useLocation();
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
          className="absolute -right-3 top-4 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      )}
      {isExpanded && (
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-4 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
      )}
      <div>


        {/* Menu items */}
        <div className="overflow-y-auto">
          <SidebarItem 
              icon={Home} 
              label="Dashboard" 
              path="/dashboard"
              isExpanded={isExpanded} 
              active={location.pathname === '/dashboard'}
            />
          <SidebarItem 
            icon={Send} 
            label="Api Test" 
            isExpanded={isExpanded} 
            path="/api-test"
            active={location.pathname === '/api-test'}
          />
          <SidebarItem 
            icon={Folder} 
            label="Request Chain" 
            isExpanded={isExpanded}
            path="/request-chain"
            active={location.pathname === '/request-chain'}
          />
          <SidebarItem 
            icon={Database} 
            label="Data Source" 
            isExpanded={isExpanded} 
          />
          <SidebarItem 
            icon={Calendar} 
            label="Schedules" 
            isExpanded={isExpanded} 
          />
          <SidebarItem 
            icon={FaChartBar} 
            label="Reports" 
            isExpanded={isExpanded} 
          />
           <SidebarItem 
            icon={PieChart} 
            label="Coverage" 
            isExpanded={isExpanded} 
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