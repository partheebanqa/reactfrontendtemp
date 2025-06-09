import React, { useEffect, useState } from 'react';
import { ChevronDown, Bell, Menu, Plus } from 'lucide-react';
import ProfileDropdown from './ProfileDropdown';
import { useWorkspace } from '../../context/WorkspaceContext';
import { WorkSpace, workspaceService } from '../../shared/services/workspaceService';
// import NotificationBell from '../../components/notifications/NotificationBell';
// import NotificationDropdown from './NotificationDropdown';

interface HeaderProps {
  isExpanded: boolean;
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ isExpanded, toggleSidebar }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
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
        <div className="ml-60 flex items-center">
          {/* <span className="text-sm">doorstepshop</span>
          <ChevronDown size={16} className="ml-1" /> */}
          {isExpanded ? (
           <div className="w-48">
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
        {/* <NotificationBell/> */}
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