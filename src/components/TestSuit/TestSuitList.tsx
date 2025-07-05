'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Filter, Play } from 'lucide-react';
import TestSuiteCard from './TestSuiteCard';
import { getTestSuites } from '@/services/testSuites.service';
import CreateTestSuiteDialog from '@/components/TestSuit/CreateTestSuiteDialog';
import { TestSuite } from '@/models/TestSuite.model';

const TestSuites: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [testSuitListData, setTestSuitListData] = useState<
    TestSuite[] | undefined
  >(undefined);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSuiteName, setNewSuiteName] = useState('');
  const [newSuiteDescription, setNewSuiteDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');

  const {
    data: apiData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['testSuites'],
    queryFn: getTestSuites,
  });

  useEffect(() => {
    if (error) {
      console.error('❌ Error fetching test suites:', error);
    }
    if (apiData) {
      console.log('Test suites from API:', apiData);
      setTestSuitListData(apiData);
    }
  }, [apiData, error]);

  const mockSuites: TestSuite[] = [
    {
      id: '363bb6ab-e785-444f-8f1a-798ca21fc890',
      name: 'test123',
      description: 'test description',
      createdAt: '04/07/2025',
      functionalTests: 13,
      performanceTests: 0,
      securityTests: 0,
      status: 'Not Run',
    },
    {
      id: '363bb6ab-e785-444f-8f1a-798ca21fc890',
      name: 'test456',
      description: 'adfasdf',
      createdAt: '04/07/2025',
      functionalTests: 15,
      performanceTests: 0,
      securityTests: 0,
      status: 'Not Run',
    },
    {
      id: '363bb6ab-e785-444f-8f1a-798ca21fc890',
      name: 'ZXCZX',
      description: 'sdfds',
      createdAt: '04/07/2025',
      functionalTests: 16,
      performanceTests: 0,
      securityTests: 0,
      status: 'Not Run',
    },
  ];

  const createSuiteMutation = useMutation({
    mutationFn: async (suiteData: any) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      setIsCreateOpen(false);
      setNewSuiteName('');
      setNewSuiteDescription('');
      toast({
        title: 'Test suite created',
        description: 'Your test suite has been created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['testSuites'] });
    },
  });

  const handleCreateSuite = () => {
    if (!newSuiteName.trim()) return;
    createSuiteMutation.mutate({
      name: newSuiteName,
      description: newSuiteDescription,
    });
  };

  const handleEditSuite = (suite: TestSuite) => {
    console.log('Navigating to edit suite with ID:', suite.id);
    setLocation(`/test-suites/${suite.id}/edit`);
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
        <CreateTestSuiteDialog />
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestSuites;
