'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Workflow,
  Play,
  Pause,
  Trash2,
  Settings,
  Copy,
  Dot,
  Link2,
  Pencil,
  Eye,
  EllipsisVertical,
  RefreshCw,
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
import { RequestChainPagination } from './RequestChainPagination';
import BreadCum from '../BreadCum/Breadcum';
import { useDataManagement } from '@/hooks/useDataManagement';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RequestChainPreviewDialog } from './RequestChainPreview';

interface RequestChainsListProps {
  chains: RequestChain[];
  loading?: boolean;
  onCreateChain: () => void;
  onEditChain: (chain: RequestChain) => void;
  onDeleteChain: (chainId: string) => void;
  onCloneChain: (chainId: string) => void;
  onToggleChain: (chainId: string) => void;
  onRefresh: () => void;
  refreshing?: boolean;
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
  onRefresh,
  refreshing,
}: RequestChainsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [sortBy, setSortBy] = useState<
    'name' | 'created' | 'executed' | 'success'
  >('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');
  const { environments, activeEnvironment } = useDataManagement();

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewChain, setPreviewChain] = useState<RequestChain | null>(null);

  // Build env options from store
  const envOptions = useMemo(() => {
    const set = new Set<string>();
    environments?.forEach((e) => e?.name && set.add(e.name));
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [environments]);

  // Optional: default to active environment on first load
  // useEffect(() => {
  //   if (environmentFilter === "all" && activeEnvironment?.name) {
  //     setEnvironmentFilter(activeEnvironment.name);
  //   }
  // }, [activeEnvironment?.name]);

  const filteredAndSortedChains = useMemo(() => {
    const filtered = chains.filter((chain) => {
      const term = searchTerm.toLowerCase();

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

      // 🔹 NEW: environment filtering
      const envName = chain.environment?.name.toLowerCase();
      const matchesEnvironment =
        environmentFilter === 'all' ||
        envName === environmentFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesEnvironment;
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
        case 'executed': {
          const aExecuted = a.lastExecuted
            ? new Date(a.lastExecuted).getTime()
            : 0;
          const bExecuted = b.lastExecuted
            ? new Date(b.lastExecuted).getTime()
            : 0;
          comparison = aExecuted - bExecuted;
          break;
        }
        case 'success':
          comparison = a.successRate - b.successRate;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [chains, searchTerm, statusFilter, sortBy, sortOrder, environmentFilter]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Reset to page 1 whenever filters/search/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder, environmentFilter]);

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
      return (
        <Link2 className='bg-[#f9e3fc] p-2 rounded' color='#660275' size={40} />
      );
    } else if (chain.successRate >= 70) {
      return (
        <Link2 className='bg-[#f9e3fc] p-2 rounded' color='#660275' size={40} />
      );
    } else {
      return (
        <Link2 className='bg-[#f9e3fc] p-2 rounded' color='#660275' size={40} />
      );
    }
  };

  return (
    <div className='space-y-3'>
      <BreadCum
        title='Request Chains'
        subtitle='Manage your API automation workflows'
        buttonTitle='Create Request Chain'
        onClickQuickGuide={() => console.log('Exporting...')}
        onClickCreateNew={onCreateChain}
        quickGuideTitle='How to Use Reports'
        quickGuideContent={
          <div>
            <p className='mb-2'>Here’s how to get started:</p>
            <ul className='list-disc pl-5 space-y-1 text-sm'>
              <li>
                Step 1: Click <b>New Report</b> to create.
              </li>
              <li>Step 2: Fill in details like name and filters.</li>
              <li>Step 3: Save and view analytics.</li>
            </ul>
          </div>
        }
      />

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
            value={environmentFilter}
            onValueChange={setEnvironmentFilter}
          >
            <SelectTrigger className='w-48'>
              <SelectValue placeholder='All environments' />
            </SelectTrigger>
            <SelectContent>
              {envOptions.map((name) => (
                <SelectItem key={name} value={name}>
                  {name === 'all' ? (
                    'All environments'
                  ) : (
                    <div className='flex items-center gap-2'>
                      <span>{name}</span>
                    </div>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <SelectItem value='all'>All Status</SelectItem>
              <SelectItem value='active'>Enabled</SelectItem>
              <SelectItem value='inactive'>Disabled</SelectItem>
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

          <Button
            variant='default'
            className='hover-scale'
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`mr-2 ${refreshing ? 'animate-spin' : ''}`}
              size={16}
            />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
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
              <Card
                key={chain.id}
                className='shadow-none hover:transition-shadow'
              >
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    {/* Left section - Icon, Name, and Details */}
                    <div className='flex items-center space-x-4 flex-1 min-w-0'>
                      <div className='flex-shrink-0'>
                        {getStatusIcon(chain)}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center space-x-3'>
                          <h3 className='text-lg font-[600] truncate'>
                            {chain.name}
                          </h3>
                          <Badge
                            variant='outline'
                            className={`
    flex items-center gap-1
    ${chain.environment?.name?.toLowerCase().includes('prod')
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : ''
                              }
    ${chain.environment?.name?.toLowerCase().includes('stage')
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                : ''
                              }
    ${chain.environment?.name?.toLowerCase().includes('dev')
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : ''
                              }
    ${!chain.environment?.name || chain.environment?.name === 'No Environment'
                                ? 'bg-gray-100 text-gray-700 border-gray-200'
                                : ''
                              }
  `}
                          >
                            {/* Dot */}
                            <span
                              className={`h-2 w-2 rounded-full 
      ${chain.environment?.name?.toLowerCase().includes('prod')
                                  ? 'bg-green-600'
                                  : ''
                                }
      ${chain.environment?.name?.toLowerCase().includes('stage')
                                  ? 'bg-yellow-600'
                                  : ''
                                }
      ${chain.environment?.name?.toLowerCase().includes('dev')
                                  ? 'bg-blue-600'
                                  : ''
                                }
      ${!chain.environment?.name || chain.environment?.name === 'No Environment'
                                  ? 'bg-gray-500'
                                  : ''
                                }
    `}
                            />

                            {chain.environment?.name || 'No Environment'}
                          </Badge>

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
                        <div className='flex items-center space-x-3 mt-1 text-sm text-muted-foreground'>
                          <span className='flex items-center font-[500] text-[#64748b] text-[13px]'>
                            <Dot size={40} className='text-red-500' />
                            {chain?.chainRequests?.length} steps
                          </span>
                          <span>-</span>
                          <span className='font-[500] text-[#64748b] text-[13px]'>
                            {chain.chainRequests.length > 3
                              ? chain.chainRequests
                                .slice(0, 3)
                                .map((r) => r.name)
                                .join(' → ') + ' → ...'
                              : chain.chainRequests
                                .map((r) => r.name)
                                .join(' → ')}
                          </span>
                        </div>
                        <div className='flex items-center space-x-6'>
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

                        <div className='text-[13px] text-muted-foreground mt-1'>
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

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => {
                                setPreviewChain(chain);
                                setPreviewOpen(true);
                              }}
                              className='text-muted-foreground hover:text-foreground'
                            >
                              <Eye className='w-4 h-4' />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Preview Chain</TooltipContent>
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
                              <Pencil className='w-4 h-4' />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit Chain</TooltipContent>
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
                                className='bg-white border shadow-lg'
                              >
                                <DropdownMenuItem
                                  onClick={() => onCloneChain(chain.id)}
                                >
                                  <Copy className='w-4 h-4 mr-2' /> Clone
                                </DropdownMenuItem>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant='ghost'
                                      size='sm'
                                      className='text-red-600 hover:text-red-700'
                                    >
                                      <Trash2 className='w-4 h-4' /> Delete
                                    </Button>
                                  </AlertDialogTrigger>

                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete this chain?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete “
                                        {chain.name}”. This action cannot be
                                        undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <Button
                                        onClick={() => onDeleteChain(chain.id)}
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

      <RequestChainPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        chain={previewChain}
      />

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
