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
import { TestSuite } from '@/models/TestSuite.model';

const TestSuites: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
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
      console.log('✅ Test suites from API:', apiData);
    }
  }, [apiData, error]);

  const mockSuites: TestSuite[] = [
    {
      id: '1751609029834',
      name: 'test123',
      description: 'test description',
      createdAt: '04/07/2025',
      suiteId: 'd97c2edf-bcb1-437b-8224-4b627d65ab06',
      functionalTests: 13,
      performanceTests: 0,
      securityTests: 0,
      status: 'Not Run',
    },
    {
      id: '1751609029835',
      name: 'test456',
      description: 'adfasdf',
      createdAt: '04/07/2025',
      suiteId: '413569f6-956c-4fcb-8e07-762180183fca',
      functionalTests: 15,
      performanceTests: 0,
      securityTests: 0,
      status: 'Not Run',
    },
    {
      id: '1751609029836',
      name: 'ZXCZX',
      description: 'sdfds',
      createdAt: '04/07/2025',
      suiteId: '363bb6ab-e785-444f-8f1a-798ca21fc890',
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
    console.log('Navigating to edit suite with ID:', suite.suiteId);
    setLocation(`/test-suites/${suite.suiteId}/edit`);
  };

  const filteredSuites = mockSuites.filter((suite) => {
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

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className='bg-blue-600 hover:bg-blue-700'>
              <Plus className='w-4 h-4 mr-2' />
              Create Test Suite
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Test Suite</DialogTitle>
            </DialogHeader>
            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium'>Suite Name</label>
                <Input
                  placeholder='Enter suite name'
                  value={newSuiteName}
                  onChange={(e) => setNewSuiteName(e.target.value)}
                />
              </div>
              <div>
                <label className='text-sm font-medium'>
                  Description (Optional)
                </label>
                <Input
                  placeholder='Describe what this suite tests'
                  value={newSuiteDescription}
                  onChange={(e) => setNewSuiteDescription(e.target.value)}
                />
              </div>
              <div className='flex justify-end space-x-2'>
                <Button
                  variant='outline'
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateSuite}
                  disabled={
                    !newSuiteName.trim() || createSuiteMutation.isPending
                  }
                >
                  Create Suite
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
