'use client';

import type { ReactElement } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { useWorkspace } from '@/hooks/useWorkspace';
import { ChevronDown, Settings, Loader2, Star } from 'lucide-react';
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
  const {
    currentWorkspace,
    workspaces,
    setCurrentWorkspace,
    updatePrimaryWorkspaceMutation,
    isLoading,
    refreshWorkspaces,
  } = useWorkspace();
  const [_, setLocation] = useLocation();

  const handleWorkspaceSelect = async (workspace: any) => {
    // First set the current workspace
    setCurrentWorkspace(workspace);

    // Then set it as primary if it's not already
    if (!workspace.isPrimary) {
      try {
        await updatePrimaryWorkspaceMutation.mutateAsync(workspace.id);
        await refreshWorkspaces();
      } catch (error) {
        console.error('Error setting primary workspace:', error);
      }
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                className='flex items-center space-x-1 sm:space-x-2 max-w-[120px] xs:max-w-[150px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-[300px] h-9 px-2 py-1 border-blue-100 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 bg-transparent'
                size='sm'
                aria-label='Select workspace'
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className='h-3.5 w-3.5 animate-spin' />
                    <span className='truncate text-xs sm:text-sm font-medium'>
                      Loading...
                    </span>
                  </>
                ) : (
                  <>
                    <span className='truncate text-xs sm:text-sm font-medium'>
                      {currentWorkspace?.name || 'Select Workspace'}
                    </span>
                    <ChevronDown className='h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-gray-500' />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side='bottom'>
            <p className='text-xs'>Switch between workspaces</p>
          </TooltipContent>

          <DropdownMenuContent className='w-64 sm:w-64 max-h-[60vh] overflow-y-auto scrollbar-thin custom-scrollbar p-2 shadow-md rounded-md border border-gray-200'>
            {isLoading ? (
              <div className='flex items-center justify-center py-4'>
                <Loader2 className='h-5 w-5 animate-spin text-gray-400' />
                <span className='ml-2 text-xs text-gray-500'>
                  Loading workspaces...
                </span>
              </div>
            ) : workspaces.length === 0 ? (
              <p className='text-xs text-gray-500 p-2'>
                No workspaces available
              </p>
            ) : (
              <div className='space-y-1'>
                {workspaces.map((workspace) => {
                  const isSelected = currentWorkspace?.id === workspace.id;
                  const isPrimary = workspace.isPrimary;
                  return (
                    <DropdownMenuItem
                      key={workspace.id}
                      onClick={() => handleWorkspaceSelect(workspace)}
                      className={`group justify-between text-xs sm:text-sm py-2 rounded-md ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                          : 'hover:bg-gray-50 border border-transparent hover:border-gray-100'
                      }`}
                    >
                      <div className='flex items-center gap-2'>
                        <span className='font-medium truncate text-gray-500 group-hover:text-gray-700'>
                          {workspace.name}
                        </span>

                        {isPrimary && (
                          <Star className='h-3 w-3 fill-yellow-500 text-yellow-500 flex-shrink-0' />
                        )}
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
