import React, { useEffect, useState } from 'react';
import { ChevronDown, Trash2, Pencil, Plus } from 'lucide-react';
import ProfileDropdown from './ProfileDropdown';
import { useWorkspace } from '../../context/WorkspaceContext';
import { WorkSpace, workspaceService } from '../../shared/services/workspaceService';
import { showSnackbar } from '../../shared/services/snackbarService';
import CreateWorkspaceModal from '../../components/workspace/CreateWorkspace';
// import NotificationBell from '../../components/notifications/NotificationBell';
// import NotificationDropdown from './NotificationDropdown';

interface HeaderProps {
  isExpanded: boolean;
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkSpace[]>([]);
  const { selectedWorkspaceId, createdWorkspace, setSelectedWorkspaceId } = useWorkspace();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<WorkSpace | null>(null);


  // Fetch workspaces on mount
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const data = await workspaceService.getWorkspaces();
        // Support both array and object response (adjust as per your API)
        const ws = Array.isArray(data) ? data : data.workspaces || [];
        setWorkspaces(ws);
        if (ws.length > 0) {
          setSelectedWorkspaceId(ws[0].Id);
        }
      } catch (error: any) {
        showSnackbar(error?.message || 'Failed to fetch workspaces', 'error');
      }
    };
    fetchWorkspaces();
    // eslint-disable-next-line
  }, []);

  // Add newly created workspace to the list
  useEffect(() => {
     if (createdWorkspace) {
      setWorkspaces(prev => {
        const existingIndex = prev.findIndex(ws => ws.Id === createdWorkspace.Id);

        if (existingIndex !== -1) {
          // Update name if workspace already exists
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            Name: createdWorkspace.Name,
          };
          return updated;
        }

      // Add new workspace if not found
      return [...prev, createdWorkspace];
    });
  }
  }, [createdWorkspace]);

  // Delete workspace handler
  const deleteWorkspace = async (workspaceId: string) => {
    try {
      const response = await workspaceService.deleteWorkspace(workspaceId);
      if (response.message) {
        setWorkspaces(prev => prev.filter(ws => ws.Id !== workspaceId));
        showSnackbar('Workspace deleted successfully', 'success');

        if (selectedWorkspaceId === workspaceId && workspaces.length > 1) {
          const fallback = workspaces.find(ws => ws.Id !== workspaceId);
          if (fallback) {
            setSelectedWorkspaceId(fallback.Id);
          }
        }
      } 
    } catch (err: any) {
      showSnackbar(err?.message || 'Error deleting workspace', 'error');
    }
  };

  return (
    <div className="flex items-center justify-between h-14 px-4 header-theme border-b border-gray-200">
      <div className="flex items-center">
        <div className="font-bold text-xl">Optraflow</div>
        <div className="ml-52 flex items-center">
          <div className="relative w-60">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="text-sm border border-gray-200 rounded px-3 py-1.5 bg-[var(--bg-primary)] text-[var(--text-primary)] w-full flex justify-between items-center"
            >
              {workspaces.find(ws => ws.Id === selectedWorkspaceId)?.Name || 'Select Workspace'}
              <ChevronDown size={16} />
            </button>

            {isDropdownOpen && (
              <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded shadow z-10 max-h-60 overflow-auto">
                {workspaces.map((workspace) => (
                  <div
                    key={workspace.Id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setSelectedWorkspaceId(workspace.Id);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <span className="text-sm flex-1 truncate">{workspace.Name}</span>
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setEditingWorkspace(workspace);
                          setModalOpen(true)
                        }}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          deleteWorkspace(workspace.Id);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button 
            className="bg-gray-100 ml-1 px-3 py-1 rounded-md flex items-center space-x-2"
            onClick={e =>{setModalOpen(true); 
              setEditingWorkspace(null)}}
          >
          <Plus size={16} />
          <span>Add</span>
        </button>

        <CreateWorkspaceModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          Workspace={editingWorkspace}
        />
      </div>
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
      <div className="flex items-center">
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
