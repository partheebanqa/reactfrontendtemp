'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { Plus, Search, Filter, Play } from 'lucide-react';
import TestSuiteCard from './TestSuiteCard';
import {
  getAllTestSuites,
  deleteTestSuite,
  executeTestSuite,
} from '@/services/testSuites.service';
import { TestSuite } from '@/shared/types/TestSuite.model';
import { useWorkspace } from '@/hooks/useWorkspace';

const TestSuites: React.FC = () => {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [testSuitListData, setTestSuitListData] = useState<
    TestSuite[] | undefined
  >(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');

  const {
    data: apiData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/test-suites', currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
    queryFn: () => getAllTestSuites(currentWorkspace!.id),
  });

  useEffect(() => {
    if (error) {
      console.error('Error fetching test suites:', error);
    }
    if (apiData) {
      console.log('Test suites from API:', apiData);
      setTestSuitListData(apiData);
    }
  }, [apiData, error]);

  const deleteSuiteMutation = useMutation({
    mutationFn: deleteTestSuite,
    onSuccess: () => {
      toast({
        title: 'Deleted',
        description: 'Test suite deleted successfully.',
      });

      queryClient.invalidateQueries({
        queryKey: ['/api/test-suites', currentWorkspace?.id],
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete failed',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    },
  });

  const executeSuiteMutation = useMutation({
    mutationFn: executeTestSuite,
    onSuccess: () => {
      toast({
        title: 'Executed',
        description: 'Test suite executed successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['testSuites'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete failed',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    },
  });

  const handleDeleteSuite = (id: string) => {
    deleteSuiteMutation.mutate(id);
  };

  const handleExecuteSuite = (id: string) => {
    executeSuiteMutation.mutate({ testSuiteId: id });
  };

  const handleEditSuite = (suite: TestSuite) => {
    console.log('Navigating to edit suite with ID:', suite.id);
    setLocation(`/test-suites/${suite.id}/edit`);
  };

  const handleCreateSuite = () => {
    setLocation('/test-suites/create');
  };

  const filteredSuites = (testSuitListData ?? []).filter((suite) => {
    const matchesSearch =
      suite.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      suite.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'All statuses' || suite.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className='p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Test Suites</h1>
        {/* <Button
          className='bg-blue-600 hover:bg-blue-700'
          onClick={handleCreateSuite}
        >
          <Plus className='w-4 h-4 mr-2' />
          Create Test Suite
        </Button> */}

        <Button onClick={handleCreateSuite} className='gap-2'>
          <Plus className='w-4 h-4' />
          Create Suite
        </Button>
      </div>

      <div className='flex items-center space-x-4'>
        <div className='relative flex-1 max-w-md'>
          <Search className='w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
          <Input
            placeholder='Search test suites...'
            className='pl-10'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className='w-48'>
            <Filter className='w-4 h-4 mr-2' />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='All statuses'>All statuses</SelectItem>
            <SelectItem value='Not Run'>Not Run</SelectItem>
            <SelectItem value='Running'>Running</SelectItem>
            <SelectItem value='Passed'>Passed</SelectItem>
            <SelectItem value='Failed'>Failed</SelectItem>
          </SelectContent>
        </Select>

        <Button className='bg-green-600 hover:bg-green-700'>
          <Play className='w-4 h-4 mr-2' />
          Run All Suites
        </Button>
      </div>

      <div className='bg-white rounded-lg border'>
        {filteredSuites.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-500'>No test suites found</p>
          </div>
        ) : (
          <div className='divide-y'>
            {filteredSuites.map((suite) => (
              <TestSuiteCard
                key={suite.id}
                suite={suite}
                onEdit={handleEditSuite}
                onDelete={handleDeleteSuite}
                onExecute={handleExecuteSuite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestSuites;
