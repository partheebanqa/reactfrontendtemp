'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

interface CreateTestSuiteDialogProps {}

const CreateTestSuiteDialog: React.FC<CreateTestSuiteDialogProps> = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [newSuiteName, setNewSuiteName] = useState('');
  const [newSuiteDescription, setNewSuiteDescription] = useState('');

  const createSuiteMutation = useMutation({
    mutationFn: async (suiteData: any) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      setIsOpen(false);
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
            <Button variant='outline' onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSuite}
              disabled={!newSuiteName.trim() || createSuiteMutation.isPending}
            >
              Create Suite
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTestSuiteDialog;
