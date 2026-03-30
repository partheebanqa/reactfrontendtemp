import { useState } from 'react';
import {
  Settings,
  LogOut,
  Sun,
  Moon,
  Ghost,
  Palette,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useLocation } from 'wouter';
import WorkspaceModal from '../WorkspaceModal';
import WorkspaceDropdown from './WorkspaceDropdown';
import { useToast } from '@/hooks/useToast';
import { HelpModal } from '../HelpModal/HelpModal';
import EnvironmentDropdown from './EnvirementDropdown';
import { Environment } from '@/shared/types/datamanagement';
import { logoutClientSide } from '@/lib/logoutClientSide';
import NotificationBell from './Notifications/NotificationBell';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { useCurrentPlan } from '@/context/CurrentPlanContext';
import { Badge } from '../ui/badge';

interface HeaderProps {
  isDrawerOpen?: boolean;
  toggleDrawer?: () => void;
}

export default function Header({ isDrawerOpen, toggleDrawer }: HeaderProps) {
  const { user } = useAuth();

  const { currentPlan } = useCurrentPlan();

  console.log(user, 'user');

  const {
    currentWorkspace,
    workspaces,
    setCurrentWorkspace,
    refreshWorkspaces,
    createWorkspaceMutation,
    updateWorkspaceMutation,
    deleteWorkspaceMutation,
  } = useWorkspace();
  const [workspaceModalState, setWorkspaceModalState] = useState({
    isOpen: false,
    mode: 'add' as 'add' | 'edit',
    workspace: null as any,
  });
  const [setEnvironmentModalState] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit' | 'duplicate' | 'manage';
    environment: Environment | null;
  }>({
    isOpen: false,
    mode: 'add',
    environment: null,
  });
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [location, setLocation] = useLocation();
  const { success } = useToast();

  const handleLogout = async () => {
    await logoutClientSide();
  };

  const hiddenPaths = [
    '/request-chains/create',
    '/test-suites/create',
    '/executions',
    '/dashboard',
    '/test-suites',
    '/request-chains',
    '/data-management',
    '/scheduler',
    '/cicd-configuration',
    '/settings/account',
  ];

  const shouldHideEnvironment =
    hiddenPaths.includes(location) ||
    /^\/request-chains\/[^/]+\/edit$/.test(location) ||
    /^\/test-suites\/[^/]+\/edit$/.test(location);

  const getInitials = (firstName?: string) => {
    if (!firstName) return 'U';
    return `${firstName?.[0] || ''}`.toUpperCase();
  };

  const handleSaveWorkspace = async (workspaceData: any) => {
    try {
      if (workspaceModalState.mode === 'add') {
        createWorkspaceMutation.mutate(workspaceData, {
          onSuccess: (response) => {
            const currWorkspace = workspaces.find(
              (ws) => ws.id === response?.workspaceId,
            );
            if (currWorkspace) {
              setCurrentWorkspace(currWorkspace);
            }
            success('Workspace created successfully.');
          },
        });
      } else {
        updateWorkspaceMutation.mutate(workspaceData, {
          onSuccess: (data) => {
            const currWorkspace = workspaces.find(
              (ws) => ws.id === workspaceData.id,
            );
            setCurrentWorkspace(currWorkspace || null);
            success('Workspace updated successfully.');
          },
        });
      }
      setWorkspaceModalState({ ...workspaceModalState, isOpen: false });
      refreshWorkspaces();
      return true;
    } catch (error) {
      console.error(
        `Error ${
          workspaceModalState.mode === 'add' ? 'creating' : 'updating'
        } workspace:`,
        error,
      );
      throw error;
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!currentWorkspace) return;
    try {
      deleteWorkspaceMutation.mutate(currentWorkspace.id, {
        onSuccess: () => {
          if (workspaces.length > 0) {
            setCurrentWorkspace(workspaces[0]);
          } else {
            setCurrentWorkspace(null);
          }
        },
      });
    } catch (error) {
      console.error('Error deleting workspace:', error);
    }
  };

  const themes = [
    { id: 'light', icon: Sun, tooltip: 'Light Theme' },
    { id: 'dark', icon: Moon, tooltip: 'Dark Theme' },
    { id: 'neutral', icon: Ghost, tooltip: 'Neutral Blue Theme' },
    { id: 'custom', icon: Palette, tooltip: 'Purple Theme' },
  ];

  const handleRedirect = (path: string) => {
    setLocation(path);
  };

  const handleDeleteEnvironment = async () => {
    try {
      if (!currentWorkspace) return;
    } catch (error) {
      console.error('Error deleting environment:', error);
    }
  };

  const avatarColors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
  ];

  const getAvatarColor = (name?: string) => {
    if (!name) return 'bg-gray-500';

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return avatarColors[Math.abs(hash) % avatarColors.length];
  };

  const fullName = `${user?.firstName ?? ''}${user?.lastName ?? ''}`;
  const color = getAvatarColor(fullName);

  return (
    <header className='border-b bg-white dark:bg-gray-900 px-2 sm:px-3 pt-2 sm:pt-3 pb-3 sm:pb-3'>
      <div className='flex items-center justify-between gap-4 sm:gap-6  mx-auto'>
        <div className='md:hidden flex items-center'>
          <Button
            size='icon'
            variant='ghost'
            onClick={toggleDrawer}
            className='mr-2 bg-[#136fb0] text-white'
          >
            {isDrawerOpen ? (
              <ChevronsLeft size={20} />
            ) : (
              <ChevronsRight size={20} />
            )}
          </Button>
        </div>

        <div className='flex items-center gap-2 sm:gap-4'>
          <h5 className='hidden md:flex text-md font-medium text-gray-700 dark:text-gray-200'>
            Workspace :
          </h5>
          <WorkspaceDropdown
            setWorkspaceModalState={setWorkspaceModalState}
            handleDeleteWorkspace={handleDeleteWorkspace}
          />
        </div>

        <div className='flex items-center gap-1 sm:gap-4 min-w-0'>
          {!shouldHideEnvironment && (
            <div className='flex items-center gap-2 sm:gap-4'>
              <h5 className='hidden md:flex text-md font-medium text-gray-700 dark:text-gray-200'>
                Environment :
              </h5>
              <EnvironmentDropdown
                setEnvironmentModalState={setEnvironmentModalState}
                handleDeleteEnvironment={handleDeleteEnvironment}
              />
            </div>
          )}

          <div>
            <Badge
              style={{
                background: 'linear-gradient(90deg, #2563eb, #ec4899)',
                color: 'white',
                padding: '6px 14px',
                borderRadius: '30px',
                fontWeight: 500,
              }}
            >
              {currentPlan?.PlanName} {currentPlan?.IsTrial && <>Trial</>}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className='flex items-center cursor-pointer'>
                <Avatar className='h-10 w-10 cursor-pointer'>
                  <AvatarImage src={(user as any)?.profileImageUrl} />
                  <AvatarFallback
                    className={`${color} text-white font-semibold`}
                  >
                    {getInitials(user?.firstName)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-auto'>
              <div className='p-4'>
                <div className='flex items-center'>
                  <div className='w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center'>
                    <span className='text-blue-800 font-medium'>
                      {getInitials(user?.firstName)}
                    </span>
                  </div>
                  <div className='ml-3'>
                    <p className='text-sm font-medium text-gray-900'>
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className='text-xs text-gray-500'>{user?.email}</p>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleRedirect('/settings/account')}
              >
                <Settings className='mr-2 h-4 w-4' />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleLogout} className='text-red-600'>
                <LogOut className='mr-2 h-4 w-4' />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <WorkspaceModal
        isOpen={workspaceModalState.isOpen}
        onClose={() =>
          setWorkspaceModalState({ ...workspaceModalState, isOpen: false })
        }
        onSaveWorkspace={handleSaveWorkspace}
        workspace={workspaceModalState.workspace}
        mode={workspaceModalState.mode}
      />
      {showHelpModal && (
        <HelpModal
          isOpen={showHelpModal}
          onClose={() => setShowHelpModal(false)}
        />
      )}
    </header>
  );
}
