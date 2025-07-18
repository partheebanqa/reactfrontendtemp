import React, { useState, useMemo } from 'react';
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
  Download,
  Filter,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RequestChain } from '@/shared/types/requestChain.model';

interface RequestChainsListProps {
  chains: RequestChain[];
  onCreateChain: () => void;
  onEditChain: (chain: RequestChain) => void;
  onDeleteChain: (chainId: string) => void;
  onToggleChain: (chainId: string) => void;
}

export function RequestChainsList({
  chains,
  onCreateChain,
  onEditChain,
  onDeleteChain,
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
    let filtered = chains.filter((chain) => {
      const matchesSearch =
        chain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chain.description?.toLowerCase().includes(searchTerm.toLowerCase());
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
        <Button onClick={onCreateChain} className='gap-2'>
          <Plus className='w-4 h-4' />
          Create Chain
        </Button>
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

      {/* Chains Grid */}
      {filteredAndSortedChains.length > 0 ? (
        <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
          {filteredAndSortedChains.map((chain) => (
            <Card key={chain.id} className='hover:shadow-lg transition-shadow'>
              <CardHeader className='pb-3'>
                <div className='flex items-start justify-between'>
                  <div className='flex items-center space-x-3 min-w-0 flex-1'>
                    {getStatusIcon(chain)}
                    <div className='min-w-0 flex-1'>
                      <CardTitle className='text-lg truncate'>
                        {chain.name}
                      </CardTitle>
                      <p className='text-sm text-muted-foreground line-clamp-2'>
                        {chain.description}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-1 ml-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => onToggleChain(chain.id)}
                      className={
                        chain.enabled
                          ? 'text-green-600'
                          : 'text-muted-foreground'
                      }
                    >
                      {chain.enabled ? (
                        <Play className='w-4 h-4' />
                      ) : (
                        <Pause className='w-4 h-4' />
                      )}
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => onEditChain(chain)}
                    >
                      <Edit className='w-4 h-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => onDeleteChain(chain.id)}
                      className='text-red-600 hover:text-red-700'
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className='space-y-4'>
                {/* Stats */}
                <div className='grid grid-cols-3 gap-4'>
                  <div className='text-center'>
                    <p className='text-2xl font-bold'>
                      {chain.requests.length}
                    </p>
                    <p className='text-xs text-muted-foreground'>Requests</p>
                  </div>
                  <div className='text-center'>
                    <p className='text-2xl font-bold'>{chain.executionCount}</p>
                    <p className='text-xs text-muted-foreground'>Executions</p>
                  </div>
                  <div className='text-center'>
                    <p className='text-2xl font-bold'>{chain.successRate}%</p>
                    <p className='text-xs text-muted-foreground'>Success</p>
                  </div>
                </div>

                {/* Last Execution */}
                <div className='flex items-center justify-between p-3 bg-muted/50 rounded-lg'>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-medium'>Last Execution</p>
                    <p className='text-xs text-muted-foreground truncate'>
                      {chain.lastExecuted
                        ? new Date(chain.lastExecuted).toLocaleString()
                        : 'Never executed'}
                    </p>
                  </div>
                  <Clock className='w-4 h-4 text-muted-foreground flex-shrink-0' />
                </div>

                {/* Schedule Status */}
                {chain.schedule.enabled && (
                  <div className='flex items-center justify-between p-3 bg-blue-50 rounded-lg'>
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-medium text-blue-900'>
                        Scheduled
                      </p>
                      <p className='text-xs text-blue-600'>
                        {chain.schedule.type === 'once'
                          ? 'One-time'
                          : 'Recurring'}
                      </p>
                    </div>
                    <Settings className='w-4 h-4 text-blue-500 flex-shrink-0' />
                  </div>
                )}

                {/* Actions */}
                <div className='grid grid-cols-2 gap-2'>
                  <Button variant='outline' size='sm' className='gap-2'>
                    <Copy className='w-4 h-4' />
                    Clone
                  </Button>
                  <Button variant='outline' size='sm' className='gap-2'>
                    <Download className='w-4 h-4' />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
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
