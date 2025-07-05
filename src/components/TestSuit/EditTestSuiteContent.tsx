'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Download } from 'lucide-react';
import { ManageRequests } from '@/components/TestSuit/ManageRequests';
import { ImportModal } from '@/components/TestSuit/ImportModal';

interface Request {
  id: string;
  method: string;
  name: string;
  endpoint: string;
  description: string;
  testCases: {
    functional: number;
    total: number;
  };
}

interface EditTestSuiteContentProps {
  id: string;
  onBack: () => void;
}

const EditTestSuiteContent: React.FC<EditTestSuiteContentProps> = ({
  id,
  onBack,
}) => {
  const { toast } = useToast();

  const [testSuiteName, setTestSuiteName] = useState('');
  const [description, setDescription] = useState('');
  const [requests, setRequests] = useState<Request[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading test suite data
  useEffect(() => {
    const loadTestSuiteData = async () => {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock test suite data - replace with actual API call
      const mockTestSuite = {
        id: id,
        name: 'API Integration Test Suite',
        description:
          'Comprehensive test suite for API endpoint validation and integration testing',
      };

      setTestSuiteName(mockTestSuite.name);
      setDescription(mockTestSuite.description);
      setIsLoading(false);
    };

    loadTestSuiteData();
  }, [id]);

  const handleImportRequests = (selectedRequests: Request[]) => {
    setRequests((prev) => [...prev, ...selectedRequests]);
    setIsImportModalOpen(false);
    toast({
      title: 'Requests imported',
      description: `${selectedRequests.length} request(s) imported successfully`,
    });
  };

  const handleSaveChanges = () => {
    toast({
      title: 'Changes saved',
      description: 'Test suite has been updated successfully',
    });
  };

  const EmptyRequestsState = () => (
    <Card className='border-2 border-dashed border-border'>
      <CardContent className='flex flex-col items-center justify-center py-16 px-6'>
        <div className='w-16 h-16 mb-6 rounded-full bg-muted flex items-center justify-center'>
          <Download className='w-8 h-8 text-muted-foreground' />
        </div>
        <h3 className='text-xl font-semibold mb-2'>No requests added yet</h3>
        <p className='text-muted-foreground text-center mb-6 max-w-md'>
          Import API requests from your collections to start configuring test
          cases for this test suite.
        </p>
        <Button
          variant='outline'
          size='lg'
          onClick={() => setIsImportModalOpen(true)}
        >
          <Download className='w-4 h-4 mr-2' />
          Import Requests
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className='min-h-screen bg-background'>
      <div className='bg-card border-b px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <Button
              variant='ghost'
              size='sm'
              onClick={onBack}
              className='text-muted-foreground hover:text-foreground'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back
            </Button>
            <div>
              <h1 className='text-2xl font-semibold'>Edit Test Suite</h1>
              <div className='flex items-center space-x-4 mt-1'>
                <span className='text-sm text-muted-foreground'>
                  Test Suite ID: {id}
                </span>
                <Badge variant='secondary'>CI/CD Integration</Badge>
              </div>
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <Button variant='outline' onClick={onBack}>
              Cancel
            </Button>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </div>
        </div>
      </div>

      <div className='p-6 space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <label className='block text-sm font-medium mb-2'>
                Test Suite Name <span className='text-destructive'>*</span>
              </label>
              <Input
                value={testSuiteName}
                onChange={(e) => setTestSuiteName(e.target.value)}
                placeholder='Enter test suite name'
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-2'>
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Enter test suite description'
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {requests.length === 0 ? (
          <EmptyRequestsState />
        ) : (
          <ManageRequests
            requests={requests}
            onImport={() => setIsImportModalOpen(true)}
          />
        )}

        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportRequests}
        />
      </div>
    </div>
  );
};

export default EditTestSuiteContent;
