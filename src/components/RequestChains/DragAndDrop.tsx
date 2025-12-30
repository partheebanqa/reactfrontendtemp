import { APIRequest, ExecutionLog } from '@/shared/types/requestChain.model';

import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '../ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import {
  Badge,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  CopyPlus,
  Edit,
  GripVertical,
  Loader2,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useSortable } from '@dnd-kit/sortable';

interface SortableRequestItemProps {
  request: APIRequest;
  requestIndex: number;
  isExecuting: boolean;
  currentRequestIndex: number;
  expandedRequests: Set<string>;
  editingNameId: string | null;
  tempName: string;
  executionLog?: ExecutionLog;
  getMethodColor: (method: string) => string;
  onToggleExpand: (requestId: string) => void;
  onStartEditName: (requestId: string, name: string) => void;
  onCommitName: (index: number, name: string) => void;
  onCancelEditName: () => void;
  onDuplicate: (requestId: string) => void;
  onRemove: (requestId: string) => void;
  setTempName: (name: string) => void;
  children?: React.ReactNode;
}

export const SortableRequestItem: React.FC<SortableRequestItemProps> = ({
  request,
  requestIndex,
  isExecuting,
  currentRequestIndex,
  expandedRequests,
  editingNameId,
  tempName,
  executionLog,
  getMethodColor,
  onToggleExpand,
  onStartEditName,
  onCommitName,
  onCancelEditName,
  onDuplicate,
  onRemove,
  setTempName,
  children,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: request.id,
    disabled: isExecuting,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`hover:shadow-sm transition-shadow group ${
        currentRequestIndex === requestIndex ? 'ring-2 ring-primary' : ''
      }`}
    >
      <CardContent className='p-2'>
        <div className='flex items-center'>
          <div className='flex items-center space-x-3'>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className='cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded transition-colors'
                    {...attributes}
                    {...listeners}
                    disabled={isExecuting}
                  >
                    <GripVertical className='w-5 h-5 text-muted-foreground' />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Drag to reorder</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div
              className={`w-8 h-8 ${
                currentRequestIndex === requestIndex
                  ? 'bg-primary text-primary-foreground animate-pulse'
                  : 'bg-blue-100 text-blue-600'
              } rounded-full flex items-center justify-center text-sm font-medium`}
            >
              {currentRequestIndex === requestIndex ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                requestIndex + 1
              )}
            </div>
          </div>

          <div className='flex-1 flex items-center space-x-4 ml-3'>
            <span
              className={`py-1 px-2 text-xs font-semibold ${getMethodColor(
                request.method
              )}`}
            >
              {request.method}
            </span>

            <div className='flex-1'>
              {editingNameId === request.id ? (
                <div className='flex items-center gap-2'>
                  <Input
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className='h-8 max-w-[280px]'
                    placeholder='Request name'
                    autoFocus
                  />
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => {
                      onCommitName(requestIndex, tempName);
                      onCancelEditName();
                    }}
                    className='text-green-600 hover:text-green-700'
                  >
                    <Check className='w-4 h-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={onCancelEditName}
                    className='text-red-600 hover:text-red-700'
                  >
                    <X className='w-4 h-4' />
                  </Button>
                </div>
              ) : (
                <div className='flex items-center gap-2'>
                  <p className='font-medium'>
                    {request.name || request.url || 'New Request'}
                  </p>

                  <div className='opacity-0 group-hover:opacity-100 transition-opacity'>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() =>
                              onStartEditName(
                                request.id,
                                request.name || request.url || ''
                              )
                            }
                            disabled={isExecuting}
                            className='h-6 w-6 p-0'
                          >
                            <Edit className='w-3 h-3' />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isExecuting
                            ? 'Cannot edit during execution'
                            : 'Edit'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              )}
            </div>

            <div className='flex items-center space-x-2'>
              {executionLog && (
                <div className='flex items-center space-x-1'>
                  {executionLog.status === 'success' ? (
                    <CheckCircle className='w-4 h-4 text-green-500' />
                  ) : (
                    <XCircle className='w-4 h-4 text-red-500' />
                  )}

                  {executionLog.response && (
                    <Badge
                      variant={
                        executionLog.response.status < 300
                          ? 'default'
                          : 'destructive'
                      }
                      className='text-xs'
                    >
                      {executionLog.response.status}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className='flex items-center space-x-2 ml-4'>
            <div className='flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity'>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onDuplicate(request.id)}
                      disabled={isExecuting}
                      className='p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
                      aria-label='Clone'
                    >
                      <CopyPlus className='w-4 h-4' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Duplicate request</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onRemove(request.id)}
                      className='p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 hover:text-red-700'
                      disabled={isExecuting}
                      aria-label='Delete request'
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Delete request</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <Button
              variant='ghost'
              size='sm'
              onClick={() => onToggleExpand(request.id)}
              className='h-8 w-8 p-0'
            >
              {expandedRequests.has(request.id) ? (
                <ChevronUp className='w-4 h-4 text-[rgb(19_111_176)]' />
              ) : (
                <ChevronDown className='w-4 h-4 text-[rgb(19_111_176)]' />
              )}
            </Button>
          </div>
        </div>

        {children}
      </CardContent>
    </Card>
  );
};
