'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Workflow,
  Play,
  Pause,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RequestChain } from '@/shared/types/requestChain.model';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import HelpLink from '../HelpModal/HelpLink';
import { RequestChainPagination } from './RequestChainPagination';

interface RequestChainsListProps {
  chains: RequestChain[];
  loading?: boolean;
  onCreateChain: () => void;
  onEditChain: (chain: RequestChain) => void;
  onDeleteChain: (chainId: string) => void;
  onCloneChain: (chainId: string) => void;
  onToggleChain: (chainId: string) => void;
}

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className='space-y-3'>
    {[1, 2, 3].map((i) => (
      <Card key={i} className='animate-pulse'>
        <CardContent className='p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4 flex-1'>
              <div className='w-4 h-4 bg-muted rounded-full'></div>
              <div className='flex-1'>
                <div className='h-5 bg-muted rounded w-1/3 mb-2'></div>
                <div className='h-4 bg-muted rounded w-2/3 mb-3'></div>
                <div className='flex space-x-6'>
                  <div className='h-4 bg-muted rounded w-16'></div>
                  <div className='h-4 bg-muted rounded w-16'></div>
                  <div className='h-4 bg-muted rounded w-16'></div>
                </div>
              </div>
            </div>
            <div className='flex space-x-2'>
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className='w-8 h-8 bg-muted rounded'></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export function RequestChainsList({
  chains,
  loading = false,
  onCreateChain,
  onEditChain,
  onDeleteChain,
  onCloneChain,
  onToggleChain,
}: RequestChainsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [sortBy, setSortBy] = useState<
    'name' | 'created' | 'executed' | 'success'
  >('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredAndSortedChains = useMemo(() => {
    const filtered = chains.filter((chain) => {
      const term = searchTerm.toLowerCase();
        // NEW: pagination
 

      const matchesSearch =
        chain.name.toLowerCase().includes(term) ||
        chain.description?.toLowerCase().includes(term) ||
        chain.id.toLowerCase().includes(term) ||
        chain.environment?.name?.toLowerCase().includes(term) ||
        chain.createdAt.toLowerCase().includes(term) ||
        chain.updatedAt.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && chain.enabled) ||
        (statusFilter === 'inactive' && !chain.enabled);

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created':
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'executed':
          const aExecuted = a.lastExecuted
            ? new Date(a.lastExecuted).getTime()
            : 0;
          const bExecuted = b.lastExecuted
            ? new Date(b.lastExecuted).getTime()
            : 0;
          comparison = aExecuted - bExecuted;
          break;
        case 'success':
          comparison = a.successRate - b.successRate;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [chains, searchTerm, statusFilter, sortBy, sortOrder]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Reset to page 1 whenever filters/search/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder]);

   // NEW: slice for current page
   const totalItems = filteredAndSortedChains.length;
   const startIndex = (currentPage - 1) * itemsPerPage;
   const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
   const paginatedChains = filteredAndSortedChains.slice(startIndex, endIndex);
 

  const getStatusIcon = (chain: RequestChain) => {
    if (!chain.enabled) {
      return <Pause className='w-4 h-4 text-muted-foreground' />;
    }

    if (chain.successRate >= 90) {
      return <CheckCircle className='w-4 h-4 text-green-500' />;
    } else if (chain.successRate >= 70) {
      return <Clock className='w-4 h-4 text-yellow-500' />;
    } else {
      return <XCircle className='w-4 h-4 text-red-500' />;
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold'>Request Chains</h1>
          <p className='text-muted-foreground'>
            Manage your API automation workflows
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button onClick={onCreateChain} className='gap-2'>
            <Plus className='w-4 h-4' />
            Create Chain
          </Button>
          <HelpLink />
        </div>
      </div>

      {/* Filters and Search */}
      <div className='flex flex-col lg:flex-row gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            placeholder='Search request chains...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-10'
          />
        </div>

        <div className='flex flex-col sm:flex-row gap-2'>
          <Select
            value={statusFilter}
            onValueChange={(value: typeof statusFilter) =>
              setStatusFilter(value)
            }
          >
            <SelectTrigger className='w-full sm:w-[180px]'>
              <SelectValue placeholder='Filter by status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Chains</SelectItem>
              <SelectItem value='active'>Active</SelectItem>
              <SelectItem value='inactive'>Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={`${sortBy}-${sortOrder}`}
            onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortBy(field as typeof sortBy);
              setSortOrder(order as typeof sortOrder);
            }}
          >
            <SelectTrigger className='w-full sm:w-[180px]'>
              <SelectValue placeholder='Sort by' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='name-asc'>Name A-Z</SelectItem>
              <SelectItem value='name-desc'>Name Z-A</SelectItem>
              <SelectItem value='created-desc'>Newest First</SelectItem>
              <SelectItem value='created-asc'>Oldest First</SelectItem>
              <SelectItem value='executed-desc'>Recently Executed</SelectItem>
              <SelectItem value='success-desc'>Highest Success Rate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Summary */}
      <div className='text-sm text-muted-foreground'>
        Showing {filteredAndSortedChains.length} of {chains.length} chains
      </div>

      {/* Chains List */}
      {loading && <LoadingSkeleton />}

     

{!loading && paginatedChains.length > 0 && (
        <>
          <div className='space-y-3'>
          {paginatedChains.map((chain) => (
            <Card key={chain.id} className='hover:shadow-sm transition-shadow'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  {/* Left section - Icon, Name, and Details */}
                  <div className='flex items-center space-x-4 flex-1 min-w-0'>
                    <div className='flex-shrink-0'>{getStatusIcon(chain)}</div>

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center space-x-3'>
                        <h3 className='text-lg font-semibold truncate'>
                          {chain.name}
                        </h3>
                        <Badge
                          variant={chain.enabled ? 'default' : 'secondary'}
                          className={
                            chain.enabled ? 'bg-green-100 text-green-800' : ''
                          }
                        >
                          {chain.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className='text-sm text-muted-foreground mt-1 line-clamp-1'>
                        {chain.description}
                      </p>
                      <div className='flex items-center space-x-4 mt-2 text-sm text-muted-foreground'>
                        <span>{chain?.chainRequests?.length} steps</span>
                        <span>•</span>
                        <span>
                          {chain.chainRequests.map((r) => r.name).join(', ')}
                        </span>
                      </div>

                      <div className='flex items-center space-x-6 mt-3'>
                        <div className='text-center'>
                          <p className='text-sm font-medium'>
                            {chain.chainRequests.length}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            Requests
                          </p>
                        </div>
                        <div className='text-center'>
                          <p className='text-sm font-medium'>
                            {chain.successRate}%
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            Success
                          </p>
                        </div>
                        <div className='text-center'>
                          <p className='text-sm font-medium'>
                            {chain.lastExecuted
                              ? new Date(
                                  chain.lastExecuted
                                ).toLocaleDateString()
                              : 'Never'}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            Last Execution
                          </p>
                        </div>
                      </div>

                      <div className='flex items-center space-x-6 mt-3'>
                        <div className='text-center'>
                          <span>Environment: </span>
                          <span>
                            {chain.environment?.name || 'No Environment'}
                          </span>
                        </div>
                        {chain?.schedule?.enabled && (
                          <div className='flex items-center space-x-2 mt-2'>
                            <Badge
                              variant='outline'
                              className='text-blue-600 border-blue-200'
                            >
                              <Settings className='w-3 h-3 mr-1' />
                              Scheduled
                            </Badge>
                            <span className='text-xs text-blue-600'>
                              {chain.schedule.type === 'once'
                                ? 'One-time'
                                : 'Recurring'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className='text-xs text-muted-foreground mt-2'>
                        Created:{' '}
                        {new Date(chain.createdAt).toLocaleDateString()} • ID:{' '}
                        {chain.id}
                      </div>
                    </div>
                  </div>

                  {/* Right section - Action buttons */}
                  <div className='flex items-center space-x-2 flex-shrink-0 ml-4'>
                    <TooltipProvider>
                      {/* Enable/Disable Chain */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => onToggleChain(chain?.id)}
                            className={
                              chain.enabled
                                ? 'text-green-600 hover:text-green-700'
                                : 'text-muted-foreground hover:text-foreground'
                            }
                          >
                            {chain.enabled ? (
                              <Play className='w-4 h-4' />
                            ) : (
                              <Pause className='w-4 h-4' />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {chain.enabled ? 'Execute Chain' : 'Executing'}
                        </TooltipContent>
                      </Tooltip>

                      {/* Edit Chain */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => onEditChain(chain)}
                            className='text-muted-foreground hover:text-foreground'
                          >
                            <Edit className='w-4 h-4' />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit Chain</TooltipContent>
                      </Tooltip>

                      {/* Copy Chain */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-muted-foreground hover:text-foreground'
                            onClick={() => onCloneChain(chain.id)}
                          >
                            <Copy className='w-4 h-4' />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy Chain</TooltipContent>
                      </Tooltip>

                      {/* Delete Chain with confirmation */}
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
                          <TooltipContent>Delete Chain</TooltipContent>
                        </Tooltip>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete this chain?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete “{chain.name}”. This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <Button onClick={() => onDeleteChain(chain.id)}>
                              Delete
                            </Button>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TooltipProvider>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>

          {/* NEW: pagination footer */}
          <RequestChainPagination
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </>
      )}

      {!loading && filteredAndSortedChains.length === 0 && (
        <div className='text-center py-12'>
          <Workflow className='w-16 h-16 text-muted-foreground mx-auto mb-4' />
          <h3 className='text-lg font-medium mb-2'>No request chains found</h3>
          <p className='text-muted-foreground mb-6 max-w-md mx-auto'>
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first request chain to automate your API workflows.'}
          </p>
          <Button onClick={onCreateChain} className='gap-2'>
            <Plus className='w-4 h-4' />
            Create Request Chain
          </Button>
        </div>
      )}
    </div>
  );
}
