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
  Edit,
  Eye,
  EllipsisVertical,
  RefreshCw,
  ChartNoAxesCombined,
  CopyPlus,
  Edit2,
  MoreVertical,
  BarChart3,
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
import { Loader } from '../Loader';
import { navigate } from 'wouter/use-browser-location';
import React from 'react';

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
        <CardContent className='p-4 md:p-6'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div className='flex items-start md:items-center space-x-3 md:space-x-4 flex-1'>
              <div className='w-8 h-8 md:w-10 md:h-10 bg-muted rounded flex-shrink-0'></div>
              <div className='flex-1 min-w-0'>
                <div className='h-5 bg-muted rounded w-2/3 md:w-1/3 mb-2'></div>
                <div className='h-4 bg-muted rounded w-full md:w-2/3 mb-3'></div>
                <div className='flex flex-wrap gap-2 md:gap-4'>
                  <div className='h-4 bg-muted rounded w-16'></div>
                  <div className='h-4 bg-muted rounded w-16'></div>
                  <div className='h-4 bg-muted rounded w-16'></div>
                </div>
              </div>
            </div>
            <div className='flex space-x-2 justify-end'>
              {[1, 2, 3, 4].map((j) => (
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
  const [tagsFilter, setTagsFilter] = useState<string>('all');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewChain, setPreviewChain] = useState<RequestChain | null>(null);

  // Build env options from store
  const envOptions = useMemo(() => {
    const set = new Set<string>();
    environments?.forEach((e) => e?.name && set.add(e.name));
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [environments]);

  const tagsOptions = useMemo(() => {
    const set = new Set<string>();
    chains.forEach((chain) => {
      chain.tags?.forEach((tag) => tag && set.add(tag));
    });
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [chains]);

  // console.log(chains, 'environment options', envOptions, 'tags options', tagsOptions);

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

      const envName = chain.environment?.name.toLowerCase();
      const matchesEnvironment =
        environmentFilter === 'all' ||
        envName === environmentFilter.toLowerCase();

      const matchesTags =
        tagsFilter === 'all' ||
        chain.tags?.some(
          (tag) => tag.toLowerCase() === tagsFilter.toLowerCase(),
        );

      return (
        matchesSearch && matchesStatus && matchesEnvironment && matchesTags
      );
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
  }, [
    chains,
    searchTerm,
    statusFilter,
    sortBy,
    sortOrder,
    environmentFilter,
    tagsFilter,
  ]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Reset to page 1 whenever filters/search/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder, environmentFilter]);

  const totalItems = filteredAndSortedChains.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedChains = filteredAndSortedChains.slice(startIndex, endIndex);

  const getStatusIcon = (chain: RequestChain) => {
    if (!chain.enabled) {
      return <Pause className='w-4 h-4 text-muted-foreground' />;
    }

    return (
      <Link2 className='bg-[#f9e3fc] p-2 rounded' color='#660275' size={32} />
    );
  };

  const handleClickReport = (chainId: string) => {
    navigate(`/executions/report?chainId=${chainId}`);
  };

  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      sanity: 'bg-blue-100 text-blue-700 border-blue-200',
      regression: 'bg-purple-100 text-purple-700 border-purple-200',
      smoke: 'bg-orange-100 text-orange-700 border-orange-200',
      uat: 'bg-green-100 text-green-700 border-green-200',
      integration: 'bg-pink-100 text-pink-700 border-pink-200',
      e2e: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    };

    return (
      colors[tag.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200'
    );
  };

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const toggleMenu = (id: string) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  return (
    <div className='space-y-3'>
      <BreadCum
        title='Request Chains'
        subtitle='Test complex user flows from login to checkout in automated sequences'
        buttonTitle='Create Request Chain'
        onClickQuickGuide={() => console.log('Exporting...')}
        onClickCreateNew={onCreateChain}
        quickGuideTitle='🚀 Guided Onboarding: Working with Request Chains'
        quickGuideContent={
          <div>
            <p className='mb-4 text-base font-medium mt-4'>
              Here's how to get started:
            </p>
            <ul className='list-none pl-2 md:pl-5 space-y-4 text-sm leading-relaxed'>
              <li>
                🟩{' '}
                <b className='text-[#000000]'>Step 1: Create a Request Chain</b>{' '}
                – Location: "Create Request Chain" button.
                <span className='block mt-1'>
                  Provide a name and description for your chain. Set the status
                  to <b>Active</b>. Select the target environment where the
                  chain should run. This defines the execution context for all
                  included requests.
                </span>
              </li>

              <li>
                🟨{' '}
                <b className='text-[#000000]'>
                  Step 2: Add Requests to the Chain
                </b>{' '}
                – Location: "Import from Collection" or "Add New Request".
                <ul className='list-disc pl-6 mt-2 space-y-1'>
                  <li>
                    Use <b>Import from Collection</b> to include requests from
                    an existing collection.
                  </li>
                  <li>
                    You can also import a new collection not yet added to the
                    Request Builder.
                  </li>
                  <li>
                    Use <b>Add New Request</b> to manually create and add a
                    request to the chain.
                  </li>
                </ul>
              </li>

              <li>
                🟦 <b className='text-[#000000]'>Step 3: Reorder Requests</b> –
                Location: Drag each request.
                <span className='block mt-1'>
                  Drag and drop requests to define the execution sequence.
                  <i>
                    Note: The order is critical—it determines how requests are
                    executed.
                  </i>
                </span>
              </li>

              <li>
                🟪{' '}
                <b className='text-[#000000]'>
                  Step 4: Add Variable Extraction
                </b>{' '}
                – Location: Expand icon on a request → then click "Run".
                <ul className='list-disc pl-6 mt-2 space-y-1'>
                  <li>Run the request to generate a successful response.</li>
                  <li>
                    Hover over the response body or headers and click{' '}
                    <b>Extract</b>.
                  </li>
                  <li>
                    Name the variable and save it (variables follow the naming
                    convention: <code>E_Variable_NAME</code>).
                  </li>
                  <li>
                    Extracted variables will appear at the bottom of each
                    request (headers or body).
                  </li>
                  <li>
                    You can review all extracted variables in the{' '}
                    <b>Extracted Variables</b> table above the "Add Request"
                    section.
                  </li>
                </ul>
              </li>

              <li>
                🟧{' '}
                <b className='text-[#000000]'>
                  Step 5: Pass the Extracted Variables
                </b>{' '}
                – Inject extracted variables into URL, body, headers, or auth
                fields.
                <span className='block mt-1'>
                  Use double curly braces to reference variables:{' '}
                  <code>{'{{Key}}'}</code>
                </span>
                <p className='mt-2 font-medium'>
                  🔤 Variable Naming Conventions:
                </p>
                <ul className='list-disc pl-6 mt-1 space-y-1'>
                  <li>
                    <code>E_</code> → Extracted variables
                  </li>
                  <li>
                    <code>S_</code> → Static variables
                  </li>
                  <li>
                    <code>D_</code> → Dynamic variables
                  </li>
                </ul>
              </li>

              <li>
                🟥{' '}
                <b className='text-[#000000]'>
                  Step 6: Run All Requests Before Saving
                </b>{' '}
                – Location: "Run All" button.
                <span className='block mt-1'>
                  Execute the full chain to verify API responses and variable
                  substitutions.
                  <i>
                    Note: You can pass values using previous responses, static
                    variables, or dynamic variables.
                  </i>
                </span>
              </li>

              <li>
                🟫{' '}
                <b className='text-[#000000]'>Step 7: Save the Request Chain</b>{' '}
                – Location: "Save" button.
                <span className='block mt-1'>
                  Save your configured request chain. Optionally, click{' '}
                  <b>Execute</b> to run the chain immediately.
                </span>
              </li>

              <li>
                🟨{' '}
                <b className='text-[#000000]'>Step 8: Execute from List View</b>{' '}
                – From the list view, select and execute your saved request
                chain.
              </li>

              <li>
                ✅{' '}
                <b className='text-[#000000]'>
                  Final Step: Review Execution Results
                </b>{' '}
                – Location: Executions page.
                <span className='block mt-1'>
                  Navigate to the <b>Executions</b> page to view logs, extracted
                  variables, and detailed execution insights.
                </span>
              </li>
            </ul>
          </div>
        }
      />

      {/* Filters and Search */}
      <div className='flex flex-col lg:flex-row gap-2'>
        {/* Search bar - takes up available space on desktop, full width on mobile */}
        <div className='relative flex-1 lg:max-w-md'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            placeholder='Search request chains...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-10'
          />
        </div>

        {/* Filters - responsive grid */}
        <div className='grid grid-cols-2 lg:flex gap-2 lg:gap-3'>
          <Select
            value={environmentFilter}
            onValueChange={setEnvironmentFilter}
          >
            <SelectTrigger className='w-full sm:w-[200px]'>
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
          <Select value={tagsFilter} onValueChange={setTagsFilter}>
            <SelectTrigger className='w-full sm:w-48'>
              <SelectValue placeholder='All tags' />
            </SelectTrigger>
            <SelectContent>
              {tagsOptions.map((name) => (
                <SelectItem key={name} value={name}>
                  {name === 'all' ? (
                    'All Tags'
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
            value={`${sortBy}-${sortOrder}`}
            onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortBy(field as typeof sortBy);
              setSortOrder(order as typeof sortOrder);
            }}
          >
            <SelectTrigger className='w-full sm:w-[200px]'>
              <SelectValue placeholder='Sort by' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='name-asc'>Name A-Z</SelectItem>
              <SelectItem value='name-desc'>Name Z-A</SelectItem>
              <SelectItem value='created-desc'>Newest First</SelectItem>
              <SelectItem value='created-asc'>Oldest First</SelectItem>
              <SelectItem value='executed-desc'>Recently Executed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant='default'
          className='w-full sm:w-auto hover-scale'
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

      {/* Results Summary */}
      <div className='text-xs text-muted-foreground'>
        Showing {filteredAndSortedChains.length} of {chains.length} chains
      </div>

      {/* Chains List */}
      {loading && (
        <>
          <Loader message='Loading Request Chains' />
        </>
      )}

      {!loading && paginatedChains.length > 0 && (
        <>
          <div className='hidden lg:block space-y-2 md:space-y-3'>
            {paginatedChains.map((chain) => (
              <Card
                key={chain.id}
                className='shadow-none transition-shadow hover:shadow-sm'
              >
                <CardContent className='p-4 md:p-5'>
                  <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                    {/* Left section - Icon, Name, and Details */}
                    <div className='flex items-start md:items-center space-x-3 md:space-x-4 flex-1 min-w-0'>
                      <div className='flex-shrink-0 mt-1 md:mt-0'>
                        {getStatusIcon(chain)}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2'>
                          <h3 className='text-sm font-medium text-foreground truncate'>
                            {chain.name}
                          </h3>
                          <div className='flex flex-wrap items-center gap-2'>
                            <Badge
                              variant='outline'
                              className={`
                                flex items-center gap-1 text-xs
                                ${
                                  chain.environment?.name
                                    ?.toLowerCase()
                                    .includes('prod')
                                    ? 'bg-green-100 text-green-800 border-green-200'
                                    : ''
                                }
                                ${
                                  chain.environment?.name
                                    ?.toLowerCase()
                                    .includes('stage')
                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                    : ''
                                }
                                ${
                                  chain.environment?.name
                                    ?.toLowerCase()
                                    .includes('dev')
                                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                                    : ''
                                }
                                ${
                                  !chain.environment?.name ||
                                  chain.environment?.name === 'No Environment'
                                    ? 'bg-gray-100 text-gray-700 border-gray-200'
                                    : ''
                                }
                              `}
                            >
                              <span
                                className={`h-2 w-2 rounded-full 
                                  ${
                                    chain.environment?.name
                                      ?.toLowerCase()
                                      .includes('prod')
                                      ? 'bg-green-600'
                                      : ''
                                  }
                                  ${
                                    chain.environment?.name
                                      ?.toLowerCase()
                                      .includes('stage')
                                      ? 'bg-yellow-600'
                                      : ''
                                  }
                                  ${
                                    chain.environment?.name
                                      ?.toLowerCase()
                                      .includes('dev')
                                      ? 'bg-blue-600'
                                      : ''
                                  }
                                  ${
                                    !chain.environment?.name ||
                                    chain.environment?.name === 'No Environment'
                                      ? 'bg-gray-500'
                                      : ''
                                  }
                                `}
                              />
                              {chain.environment?.name || 'No Environment'}
                            </Badge>

                            <Badge
                              variant={chain.enabled ? 'default' : 'secondary'}
                              className={`text-xs ${
                                chain.enabled
                                  ? 'bg-green-100 text-green-800'
                                  : ''
                              }`}
                            >
                              {chain.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                        </div>

                        <p className='text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2'>
                          {chain.description}
                        </p>

                        <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-2 text-xs md:text-sm text-muted-foreground'>
                          <span className='flex items-center font-[500] text-[#64748b] hidden md:block lg:block'>
                            {chain?.chainRequests?.length}{' '}
                            {chain?.chainRequests?.length === 1
                              ? 'step'
                              : 'steps'}{' '}
                          </span>
                          <span className='hidden sm:inline'>-</span>
                          <span className='font-[500] text-[#64748b] line-clamp-1'>
                            {chain.chainRequests.length > 3
                              ? chain.chainRequests
                                  .slice(0, 3)
                                  .map((r) => r.name.slice(0, 60))
                                  .join(' → ') + ' → ...'
                              : chain.chainRequests
                                  .map((r) => r.name)
                                  .join(' → ')}
                          </span>
                        </div>

                        {chain?.schedule?.enabled && (
                          <div className='flex items-center flex-wrap gap-2 mt-2'>
                            <Badge
                              variant='outline'
                              className='text-blue-600 border-blue-200 text-xs'
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

                        <div className='text-xs text-muted-foreground mt-2'>
                          <div className='flex flex-col sm:flex-row sm:items-center gap-1'>
                            <span>
                              Created:{' '}
                              {new Date(chain.createdAt).toLocaleDateString()}
                            </span>
                            <span className='hidden sm:inline'>•</span>
                            <span className='truncate'>ID: {chain.id}</span>
                          </div>
                          <div className='flex flex-col sm:flex-row sm:items-center gap-1'>
                            {(chain?.tags?.length ?? 0) > 0 && (
                              <div className='flex items-center space-x-2 mt-2'>
                                {chain.tags!.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant='outline'
                                    className={getTagColor(tag)}
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right section - Action buttons */}
                    <div className='flex items-center justify-end space-x-1 md:space-x-2 flex-shrink-0'>
                      <TooltipProvider>
                        {/* Enable/Disable Chain */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => onToggleChain(chain?.id)}
                              className={`h-8 w-8 p-0 ${
                                chain.enabled
                                  ? 'text-green-600 hover:text-green-700'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
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
                              className='h-8 w-8 p-0 text-muted-foreground hover:text-foreground'
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
                              className='h-8 w-8 p-0 text-muted-foreground hover:text-foreground'
                            >
                              <Edit className='w-4 h-4' />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit Chain</TooltipContent>
                        </Tooltip>

                        <TooltipProvider>
                          <DropdownMenu>
                            <Tooltip>
                              <DropdownMenuTrigger asChild>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    size='icon'
                                    className='h-8 w-8 p-0 text-muted-foreground hover:text-foreground'
                                  >
                                    <EllipsisVertical className='w-4 h-4' />
                                  </Button>
                                </TooltipTrigger>
                              </DropdownMenuTrigger>

                              <TooltipContent side='top'>
                                Chain Actions
                              </TooltipContent>
                            </Tooltip>

                            {/* Menu Content */}
                            <DropdownMenuContent
                              align='end'
                              className='
        bg-background border border-border shadow-md rounded-lg min-w-[180px] py-1
      '
                            >
                              <DropdownMenuItem
                                onClick={() => onCloneChain(chain.id)}
                                className='flex items-center px-4 py-2 text-sm hover:bg-muted cursor-pointer'
                              >
                                <CopyPlus className='w-4 h-4 mr-2' />
                                Duplicate
                              </DropdownMenuItem>

                              <div className='border-t border-border my-1' />

                              {/* Reports */}
                              <DropdownMenuItem
                                onClick={() => handleClickReport(chain.id)}
                                className='flex items-center px-4 py-2 text-sm hover:bg-muted cursor-pointer'
                              >
                                <ChartNoAxesCombined className='w-4 h-4 mr-2' />
                                Reports
                              </DropdownMenuItem>

                              <div className='border-t border-border my-1' />

                              {/* Delete with AlertDialog */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button className='flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700'>
                                    <Trash2 className='w-4 h-4 mr-2' />
                                    Delete
                                  </button>
                                </AlertDialogTrigger>

                                <AlertDialogContent className='max-w-md'>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete this chain?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete "{chain.name}
                                      ". This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>

                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>

                                    <Button
                                      variant='destructive'
                                      onClick={() => onDeleteChain(chain.id)}
                                    >
                                      Delete
                                    </Button>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TooltipProvider>
                      </TooltipProvider>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className='lg:hidden space-y-4'>
            {paginatedChains.map((chain) => (
              <div
                key={chain.id}
                className='bg-card rounded-xl border border-border overflow-hidden transition-shadow hover:shadow-sm'
              >
                {/* Card Header */}
                <div className='p-4 border-b border-border'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex items-start gap-3 flex-1 min-w-0'>
                      <div className='w-10 h-10 bg-[#f9e3fc] rounded-lg flex items-center justify-center flex-shrink-0'>
                        <Link2 className='w-6 h-6 text-white' />
                      </div>

                      <div className='flex-1 min-w-0'>
                        <h3 className='text-sm font-medium text-foreground truncate'>
                          {chain.name}
                        </h3>

                        <div className='flex flex-wrap items-center gap-2 mt-1'>
                          <span className='text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded'>
                            {chain.environment?.name || 'No Environment'}
                          </span>

                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                              chain?.enabled
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-800 border-slate-200'
                            }`}
                          >
                            {chain.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className='relative flex-shrink-0'>
                      <button
                        onClick={() => toggleMenu(chain.id)}
                        className='p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors'
                      >
                        <MoreVertical className='w-5 h-5' />
                      </button>

                      {openMenuId === chain.id && (
                        <>
                          <div
                            className='fixed inset-0 z-10'
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className='absolute right-0 mt-2 w-48 bg-background rounded-lg shadow-md border border-border py-1 z-20'>
                            <button
                              onClick={() => onCloneChain(chain.id)}
                              className='w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3'
                            >
                              <Copy className='w-4 h-4' />
                              Duplicate
                            </button>

                            <button
                              onClick={() => handleClickReport(chain.id)}
                              className='w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3'
                            >
                              <BarChart3 className='w-4 h-4' />
                              Reports
                            </button>

                            <div className='border-t border-slate-100 my-1' />

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button className='flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700'>
                                  <Trash2 className='w-4 h-4 mr-2' />
                                  Delete
                                </button>
                              </AlertDialogTrigger>

                              <AlertDialogContent className='max-w-md'>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete this chain?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete "{chain.name}
                                    ". This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>

                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>

                                  <Button
                                    variant='destructive'
                                    onClick={() => onDeleteChain(chain.id)}
                                  >
                                    Delete
                                  </Button>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className='p-4 space-y-3'>
                  <p className='text-sm text-muted-foreground'>
                    {chain.description}
                  </p>
                  <div className='bg-muted/50 rounded-lg p-3 border border-border'>
                    <div className='flex items-center flex-wrap gap-1.5 text-xs'>
                      {chain?.chainRequests &&
                        chain.chainRequests.length > 0 && (
                          <>
                            {chain.chainRequests
                              .slice(0, 3)
                              .map((step, idx) => {
                                const isLastVisible =
                                  idx ===
                                  Math.min(chain.chainRequests.length, 3) - 1;

                                return (
                                  <React.Fragment
                                    key={`${chain.id}-flowm-${idx}`}
                                  >
                                    <span className='px-2 py-1 bg-background text-foreground rounded text-xs border border-border'>
                                      {step.name.slice(0, 60)}
                                    </span>

                                    {!isLastVisible && (
                                      <span className='text-slate-400 font-bold'>
                                        →
                                      </span>
                                    )}

                                    {isLastVisible &&
                                      chain.chainRequests.length > 3 && (
                                        <span className='text-slate-400 font-bold'>
                                          → ...
                                        </span>
                                      )}
                                  </React.Fragment>
                                );
                              })}
                          </>
                        )}
                    </div>
                  </div>

                  {(chain?.tags?.length ?? 0) > 0 && (
                    <div className='flex flex-wrap gap-1.5'>
                      {chain?.tags?.map((tag, idx) => (
                        <span
                          key={`${chain.id}-tagm-${idx}`}
                          className='px-2.5 py-1 rounded-md text-xs font-medium border ${getTagColor(tag)}'
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className='flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border'>
                    <span className='font-mono bg-muted px-2 py-1 rounded border border-border'>
                      ID: {chain.id.slice(0, 21)}...
                    </span>
                    <span>•</span>
                    <span>
                      Created: {new Date(chain.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className='grid grid-cols-3 gap-2 pt-2'>
                    <button
                      onClick={() => onToggleChain(chain?.id)}
                      className='flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity'
                    >
                      <Play className='w-4 h-4' />
                      <span className='text-xs'>Execute</span>
                    </button>

                    <button
                      onClick={() => {
                        setPreviewChain(chain);
                        setPreviewOpen(true);
                      }}
                      className='flex items-center justify-center gap-1.5 px-3 py-2 bg-muted text-foreground rounded-lg text-xs font-medium hover:bg-muted/80 transition-colors border border-border'
                    >
                      <Eye className='w-4 h-4' />
                      <span className='text-xs'>View</span>
                    </button>

                    <button
                      onClick={() => onEditChain(chain)}
                      className='flex items-center justify-center gap-1.5 px-3 py-2 bg-muted text-foreground rounded-lg text-xs font-medium hover:bg-muted/80 transition-colors border border-border'
                    >
                      <Edit2 className='w-4 h-4' />
                      <span className='text-xs'>Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* {renderPagination()} */}
          </div>

          {/* Pagination footer */}
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
        <div className='text-center py-12 px-4'>
          <Workflow className='w-12 h-12 md:w-16 md:h-16 text-muted-foreground mx-auto mb-4' />
          <h3 className='text-base md:text-lg font-medium mb-2'>
            No request chains found
          </h3>
          <p className='text-sm md:text-base text-muted-foreground mb-6 max-w-md mx-auto'>
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
