'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Edit, Copy, Trash2, Info } from 'lucide-react';
import { formatDate } from '@/utils/formatDate';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

interface TestSuite {
  requests: boolean;
  id: string;
  name: string;
  description: string;
  createdAt: string;
  functionalTests: number;
  performanceTests: number;
  securityTests: number;
  status: 'Not Run' | 'Running' | 'Passed' | 'Failed';
}

interface TestSuiteCardProps {
  suite: TestSuite;
  onEdit: (suite: TestSuite) => void;
  onDelete: (id: string) => void;
  onExecute: (id: string) => void;
  onClone: (id: string) => void;
}

const TestSuiteCard: React.FC<TestSuiteCardProps> = ({
  suite,
  onEdit,
  onDelete,
  onExecute,
  onClone,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Not Run':
        return (
          <Badge
            variant='secondary'
            className='text-orange-600 bg-orange-100 border-orange-200'
          >
            Not Run
          </Badge>
        );
      case 'Running':
        return (
          <Badge
            variant='secondary'
            className='text-blue-600 bg-blue-100 border-blue-200'
          >
            Running
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

  return (
    <div className='p-6 hover:bg-gray-50 transition-colors'>
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <div className='flex items-center space-x-3 mb-2'>
            <h3 className='font-semibold text-lg'>{suite.name}</h3>
            {getStatusBadge(suite.status)}
          </div>

          <p className='text-gray-600 text-sm mb-3'>{suite.description}</p>

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
                  onClick={() => onExecute(suite.id)}
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
                  <Edit className='w-4 h-4' />
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

            {/* Delete */}
            {/* <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='text-gray-600 hover:text-red-600'
                  onClick={() => onDelete(suite.id)}
                >
                  <Trash2 className='w-4 h-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Suite</TooltipContent>                    
            </Tooltip> */}

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
                                          <AlertDialogTitle>
                                            Delete this suite?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will permanently delete “{suite.name}”. This
                                            action cannot be undo.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <Button
                                           onClick={() => onDelete(suite.id)}
                                           
                                          >
                                            Delete
                                          </Button>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export default TestSuiteCard;
