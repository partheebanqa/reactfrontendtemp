import { ReactElement, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { ChevronDown, Settings, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Environment } from '@/shared/types/datamanagement';
import { useDataManagement } from '@/hooks/useDataManagement';
import { useLocation } from 'wouter';
import { useWorkspace } from '@/hooks/useWorkspace';

interface EnvironmentDropdownProps {
  setEnvironmentModalState: (state: {
    isOpen: boolean;
    mode: 'add' | 'edit' | 'duplicate' | 'manage';
    environment: Environment | null;
  }) => void;
  handleDeleteEnvironment: (environmentId: string) => void;
}

export default function EnvironmentDropdown({
  setEnvironmentModalState,
  handleDeleteEnvironment,
}: EnvironmentDropdownProps): ReactElement {
  const {
    environments,
    activeEnvironment,
    setActiveEnvironment,
    updatePrimaryEnvironmentMutation,
    isLoading,
    isEnvironmentsLoading,
  } = useDataManagement();

  const [_, setLocation] = useLocation();

  const { currentWorkspace } = useWorkspace();

  const getEnvironmentColor = (environment: Environment) => {
    const env = environment?.name?.toLowerCase();
    if (env?.includes('prod')) {
      return '#16a34a';
    } else if (env?.includes('dev')) {
      return '#2563eb';
    } else if (env?.includes('stage')) {
      return '#ca8a04';
    } else if (env?.includes('test')) {
      return '#9333ea';
    } else {
      return '#06090eff';
    }
  };

  const handleEnvironmentSelect = async (environment: Environment) => {
    setActiveEnvironment(environment);
    if (environment.isPrimary) return;

    try {
      await updatePrimaryEnvironmentMutation.mutateAsync({
        id: environment.id,
        ws: currentWorkspace?.id,
        setPrimary: true,
      });

      setActiveEnvironment({
        ...environment,
        isPrimary: true,
      });
    } catch (error) {
      console.error('Error setting primary environment:', error);
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
                className='flex items-center space-x-1 sm:space-x-2 max-w-[120px] xs:max-w-[150px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-[300px] h-9 px-2 py-1 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 rounded-md shadow-sm'
                size='sm'
                aria-label='Select environment'
                disabled={isEnvironmentsLoading}
              >
                {isEnvironmentsLoading ? (
                  <>
                    <Loader2 className='h-3.5 w-3.5 animate-spin' />
                    <span className='truncate text-xs sm:text-sm font-semibold'>
                      Loading...
                    </span>
                  </>
                ) : activeEnvironment ? (
                  <>
                    <div
                      className='h-3.5 w-3.5 rounded-full flex-shrink-0 ring-1 ring-opacity-25 ring-gray-400'
                      style={{
                        backgroundColor: getEnvironmentColor(activeEnvironment),
                      }}
                    />
                    <span className='truncate text-xs sm:text-sm font-semibold'>
                      {activeEnvironment?.name}
                    </span>
                  </>
                ) : (
                  <span className='truncate text-xs sm:text-sm font-semibold text-gray-400'>
                    No Environment
                  </span>
                )}
                <ChevronDown className='h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-gray-500' />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side='bottom'>
            <p className='text-xs'>Switch between environments</p>
          </TooltipContent>

          <DropdownMenuContent className='w-72 sm:w-64 max-h-[60vh] overflow-y-auto scrollbar-thin custom-scrollbar p-2 shadow-md rounded-md border border-gray-200'>
            <DropdownMenuSeparator className='my-2' />

            {isEnvironmentsLoading ? (
              <div className='flex items-center justify-center py-4'>
                <Loader2 className='h-5 w-5 animate-spin text-gray-400' />
                <span className='ml-2 text-xs text-gray-500'>
                  Loading environments...
                </span>
              </div>
            ) : environments.length === 0 ? (
              <p className='text-xs text-gray-500 p-2 italic'>
                No environments available
              </p>
            ) : (
              <div className='space-y-1'>
                {environments.map((environment) => {
                  const isSelected = activeEnvironment?.id === environment?.id;
                  return (
                    <DropdownMenuItem
                      key={environment?.id}
                      onClick={() => handleEnvironmentSelect(environment)}
                      className={`group justify-between text-xs sm:text-sm py-2 rounded-md ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                          : 'hover:bg-gray-50 border border-transparent hover:border-gray-100'
                      }`}
                    >
                      <div className='flex items-center gap-2'>
                        {' '}
                        <div
                          className='h-3 w-3 rounded-full mr-2 flex-shrink-0'
                          style={{
                            backgroundColor: getEnvironmentColor(environment),
                          }}
                        />
                        <span className='font-medium truncate text-gray-500 group-hover:text-gray-700'>
                          {' '}
                          {environment?.name}
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
