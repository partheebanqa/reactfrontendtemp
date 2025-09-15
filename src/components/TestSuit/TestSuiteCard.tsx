'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Edit,
  Copy,
  Trash2,
  Info,
  Workflow,
  Pencil,
  Pause,
  Link2,
  Layers,
  EllipsisVertical,
  Delete,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/utils/formatDate';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';

import { RequestChain } from '@/shared/types/requestChain.model';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

interface TestSuite {
  requests: boolean;
  id: string;
  name: string;
  description: string;
  createdAt: string;
  functionalTests: number;
  performanceTests: number;
  securityTests: number;
  environment?: {
    id: string;
    name: string;
  };
  status: 'Not Run' | 'Running' | 'Passed' | 'Failed';
}

interface TestSuiteCardProps {
  suite: TestSuite;
  onEdit: (suite: TestSuite) => void;
  onDelete: (id: string) => void;
  onExecute: (id: string) => void;
  onClone: (id: string) => void;
  onRefresh: () => void;
  refreshing?: boolean;
}

const TestSuiteCard: React.FC<TestSuiteCardProps> = ({
  suite,
  onEdit,
  onDelete,
  onExecute,
  onClone,
  onRefresh,
  refreshing,
}) => {
  const { error: showError, success: showSuccess, toast } = useToast();
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'generated':
        return (
          <Badge
            variant='secondary'
            className='text-orange-600 bg-orange-100 border-orange-200'
          >
            Generated
          </Badge>
        );
      case 'generating':
        return (
          <Badge
            variant='secondary'
            className='text-blue-600 bg-blue-100 border-blue-200'
          >
            Generating
          </Badge>
        );
      case 'Passed':
        return (
          <Badge
            variant='secondary'
            className='text-green-600 bg-green-100 border-green-200'
          >
            Passed
          </Badge>
        );
      case 'Failed':
        return (
          <Badge
            variant='secondary'
            className='text-red-600 bg-red-100 border-red-200'
          >
            Failed
          </Badge>
        );
      default:
        return <Badge variant='secondary'>Unknown</Badge>;
    }
  };

  const getStatusIcon = (chain: RequestChain) => {
    if (!chain.enabled) {
      return <Pause className='w-4 h-4 text-muted-foreground' />;
    }

    if (chain.successRate >= 90) {
      return (
        <Link2 className='bg-[#f9e3fc] p-2 rounded' color='#660275' size={40} />
      );
    } else if (chain.successRate >= 70) {
      return (
        <Link2 className='bg-[#f9e3fc] p-2 rounded' color='#660275' size={40} />
      );
    } else {
      return (
        <Layers
          className='bg-green-100 p-2 rounded'
          color='#0f766e'
          size={40}
        />
      );
    }
  };

  return (
    <div className='bg-white rounded-lg border mb-3 p-4'>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex-shrink-0'>
          <Layers
            className='bg-green-100 p-2 rounded'
            color='#0f766e'
            size={40}
          />
        </div>

        <div className='flex-1'>
          <div className='flex items-center space-x-3 mb-2'>
            <h3 className='font-semibold text-lg'>{suite.name}</h3>
            {getStatusBadge(suite.status)}
            <Badge
              variant='outline'
              className={`
    flex items-center gap-1
    ${suite?.environment?.name?.toLowerCase().includes('prod')
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : ''
                }
    ${suite?.environment?.name?.toLowerCase().includes('stage')
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  : ''
                }
    ${suite?.environment?.name?.toLowerCase().includes('dev')
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : ''
                }
    ${!suite?.environment?.name || suite?.environment?.name === 'No Environment'
                  ? 'bg-gray-100 text-gray-700 border-gray-200'
                  : ''
                }
  `}
            >
              {/* Dot */}
              <span
                className={`h-2 w-2 rounded-full 
      ${suite?.environment?.name?.toLowerCase().includes('prod')
                    ? 'bg-green-600'
                    : ''
                  }
      ${suite?.environment?.name?.toLowerCase().includes('stage')
                    ? 'bg-yellow-600'
                    : ''
                  }
      ${suite?.environment?.name?.toLowerCase().includes('dev')
                    ? 'bg-blue-600'
                    : ''
                  }
      ${!suite?.environment?.name ||
                    suite?.environment?.name === 'No Environment'
                    ? 'bg-gray-500'
                    : ''
                  }
    `}
              />

              {suite?.environment?.name || 'No Environment'}
            </Badge>
          </div>

          <p className='text-gray-600 text-sm mb-3'>{suite.description}</p>

          {/* <div className="flex items-center space-x-1 text-sm text-gray-500 mb-3">
            <span>Environment:</span>
            <div className="flex items-center">
              {suite?.environment?.name || "No Environment"}
            </div>
          </div> */}

          <div className='flex items-center space-x-6 text-sm text-gray-500 mb-3'>
            <span>Created: {formatDate(suite.createdAt)}</span>
            <div className='flex items-center space-x-1'>
              <span>ID: {suite.id}</span>
              <Info className='w-3 h-3' />
            </div>
          </div>

          <div className='flex items-center space-x-4'>
            <Badge
              variant='outline'
              className='text-blue-600 bg-blue-50 border-blue-200'
            >
              {suite.functionalTests} Functional
            </Badge>
            <Badge
              variant='outline'
              className='text-purple-600 bg-purple-50 border-purple-200'
            >
              {suite.performanceTests} Performance
            </Badge>
            <Badge
              variant='outline'
              className='text-orange-600 bg-orange-50 border-orange-200'
            >
              {suite.securityTests} Security
            </Badge>
          </div>
        </div>

        <div className='flex items-center space-x-2'>
          <TooltipProvider>
            {/* Play / Execute */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='text-gray-600 hover:text-blue-600'
                  onClick={() => {
                    if (!suite?.isExecutable) {
                      toast({
                        title: 'Oops!',
                        description:
                          'You haven’t selected any test cases yet. Pick a few and let’s run them.',
                        type: 'error',
                      });
                      return;
                    }
                    onExecute(suite.id);
                  }}
                >
                  <Play className='w-4 h-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Run Suite</TooltipContent>
            </Tooltip>

            {/* Edit */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='text-gray-600 hover:text-blue-600'
                  onClick={() => onEdit(suite)}
                >
                  <Pencil className='w-4 h-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit Suite</TooltipContent>
            </Tooltip>

            {/* Copy */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='text-gray-600 hover:text-blue-600'
                  onClick={() => onClone(suite.id)}
                >
                  <Copy className='w-4 h-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Duplicate Suite</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-muted-foreground hover:text-foreground'
                    >
                      <EllipsisVertical className='w-4 h-4' />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align='end'
                    className="bg-white border shadow-lg flex flex-col p-1"
                  >
                    <Button
                      variant='ghost'
                      size='lg'
                    >
                      <Workflow className='w-4 h-4 mr-2' /> CI/CD
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>

                        <Button

                          variant='ghost'
                          size='lg'
                          className='text-red-600 hover:text-red-700'
                        >
                          <Trash2 className='w-4 h-2' /> Delete
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete this chain?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete “
                            {suite.name}”. This action cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            Cancel
                          </AlertDialogCancel>
                          <Button
                            onClick={() => onDelete(suite.id)}
                          >
                            Delete
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent>More</TooltipContent>
            </Tooltip>

            {/* 
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-red-600 hover:text-red-700'
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>Delete Suite</TooltipContent>
              </Tooltip>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this suite?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete “{suite.name}”. This action
                    cannot be undo.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <Button onClick={() => onDelete(suite.id)}>Delete</Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog> */}
          </TooltipProvider>
        </div>
      </div>
    </div >
  );
};

export default TestSuiteCard;
