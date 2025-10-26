import { ReactElement } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { useWorkspace } from '@/hooks/useWorkspace';
import {
  ChevronDown,
  Edit,
  PlusCircle,
  Trash,
  CheckCircle,
  Settings,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLocation } from 'wouter';

interface WorkspaceDropdownProps {
  setWorkspaceModalState: (state: {
    isOpen: boolean;
    mode: 'add' | 'edit';
    workspace: any;
  }) => void;
  handleDeleteWorkspace: (workspaceId: string) => void;
}

export default function WorkspaceDropdown({
  setWorkspaceModalState,
  handleDeleteWorkspace,
}: WorkspaceDropdownProps): ReactElement {
  const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspace();
  const [_, setLocation] = useLocation();

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                className='flex items-center space-x-1 sm:space-x-2 max-w-[120px] xs:max-w-[150px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-[300px] h-9 px-2 py-1 border-blue-100 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200'
                size='sm'
                aria-label='Select workspace'
              >
                {/* <Building className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0' /> */}
                <span className='truncate text-xs sm:text-sm font-medium'>
                  {currentWorkspace?.name || 'Select Workspace'}
                </span>
                <ChevronDown className='h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-gray-500' />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side='bottom'>
            <p className='text-xs'>Switch between workspaces</p>
          </TooltipContent>

          <DropdownMenuContent className='w-64 sm:w-72 max-h-[60vh] overflow-y-auto custom-scrollbar p-2 shadow-md rounded-md border border-gray-200'>
            <div className='mb-3 pb-2 border-b border-gray-100'>
              <h3 className='text-sm text-gray-800 font-semibold mb-1'>
                Workspaces
              </h3>
              <p className='text-xs text-gray-500'>
                Manage your project workspaces
              </p>
            </div>

            <DropdownMenuSeparator className='my-2' />

            <DropdownMenuItem
              className='text-gray-600 font-medium text-xs sm:text-sm py-2 hover:bg-gray-50 rounded-md border border-gray-100 shadow-sm'
              onClick={() =>
                setLocation('/settings/account?tab=workspaces', {
                  replace: true,
                })
              }
            >
              <Settings className='mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4' />
              Manage Workspaces
            </DropdownMenuItem>
            <DropdownMenuSeparator className='my-2' />

            {workspaces.length === 0 ? (
              <p className='text-xs text-gray-500 p-2'>
                No workspaces available
              </p>
            ) : (
              <div className='space-y-1'>
                {workspaces.map((workspace) => {
                  const isSelected = currentWorkspace?.id === workspace.id;
                  return (
                    <DropdownMenuItem
                      key={workspace.id}
                      onClick={() => setCurrentWorkspace(workspace)}
                      className={`justify-between text-xs sm:text-sm py-2 rounded-md ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className='flex items-center'>
                        {/* <Building className='h-3.5 w-3.5 mr-2 text-gray-500' /> */}
                        <span className='font-medium truncate mr-2'>
                          {workspace.name}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </Tooltip>
    </TooltipProvider>
  );
}
