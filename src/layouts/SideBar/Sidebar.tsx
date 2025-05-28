import React, { useEffect, useState } from 'react';
import SidebarItem from './SidebarItem';
import { 
  Home, 
  Settings,
  Pencil,
  ChevronRight,
  Plus,
  DollarSign,
  Box,
  Monitor,
  Inbox,
  Users,
  Megaphone,
  BarChart,
  Zap,
  Layers
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { WorkSpace, workspaceService } from '../../shared/services/workspaceService';
import { useWorkspace } from '../../context/WorkspaceContext';

interface SidebarProps {
  isExpanded: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isExpanded, toggleSidebar }) => {
  const location = useLocation();
  const [workspaces, setWorkspaces] = useState<WorkSpace[]>([]);
  const { selectedWorkspaceId, createdWorkspace, setSelectedWorkspaceId } = useWorkspace(); 

  useEffect(() => {
  const fetchWorkspaces = async () => {
    const data = await workspaceService.getWorkspaces();
    setWorkspaces(data.workspaces);
    if (data.workspaces.length > 0) {
      setSelectedWorkspaceId(data.workspaces[0].Id);
    }
  };

    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (createdWorkspace) {
      setWorkspaces(prev => [...prev, createdWorkspace]);
    }
  }, [createdWorkspace]);


  return (
    <div 
      className={`
        bg-sidebar h-[calc(100vh-1.5rem)] flex flex-col justify-between transition-all duration-300 ease-in-out relative
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
            <select
              className="text-sm border border-gray-200 rounded px-3 py-1.5 bg-[var(--bg-primary)] text-[var(--text-primary)] w-full"
              value={selectedWorkspaceId}
              onChange={(e) => setSelectedWorkspaceId(e.target.value)}
            >
              {workspaces.map((workspace) => (
                <option key={workspace.Id} value={workspace.Id}>
                  {workspace.Name}
                </option>
              ))}
            </select>
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
              <span className="text-white text-sm">Let's set up your API Testing Plan</span>
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
            label="Dashboard" 
            isExpanded={isExpanded} 
            path="/dashboard"
            active={location.pathname === '/dashboard'}
          />
          <SidebarItem 
            icon={Box} 
            label="Collections" 
            isExpanded={isExpanded} 
            path="/api-test"
            active={location.pathname === '/api-test'}
          />
          <SidebarItem 
            icon={Monitor} 
            label="Request chain" 
            isExpanded={isExpanded} 
            path="/request-chain"
            active={location.pathname === '/request-chain'}
          />
          <SidebarItem 
            icon={Layers} 
            label="Test Suites" 
            isExpanded={isExpanded} 
            hasSubmenu={true} 
            path="/test-suites"
            active={location.pathname === '/test-suites'}
          />
          <SidebarItem 
            icon={Inbox} 
            label="Datasources" 
            isExpanded={isExpanded} 
          />
          <SidebarItem 
            icon={Users} 
            label="Schedules" 
            isExpanded={isExpanded} 
          />
          <SidebarItem 
            icon={Megaphone} 
            label="Reports" 
            isExpanded={isExpanded} 
          />
          <SidebarItem 
            icon={BarChart} 
            label="Coverage" 
            isExpanded={isExpanded} 
          />
          <SidebarItem 
            icon={Zap} 
            label="Data Management" 
            isExpanded={isExpanded} 
          />
          <SidebarItem 
            icon={Settings} 
            label="Settings" 
            isExpanded={isExpanded} 
            path="/setting"
            active={location.pathname === '/setting'}
          />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;