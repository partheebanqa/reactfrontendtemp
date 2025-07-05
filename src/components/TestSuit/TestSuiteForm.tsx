import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Trash2, Download } from 'lucide-react';

interface TestSuiteFormProps {
  testSuiteName: string;
  setTestSuiteName: (name: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  mockRequests: Array<{
    id: string;
    method: string;
    name: string;
    endpoint: string;
    description: string;
    testCases: {
      functional: number;
      total: number;
    };
  }>;
}
const TestSuiteForm: React.FC<TestSuiteFormProps> = ({
  testSuiteName,
  setTestSuiteName,
  description,
  setDescription,
  mockRequests,
}) => {
  const getMethodBadge = (method: string) => {
    const colors = {
      PUT: 'bg-orange-100 text-orange-800',
      DELETE: 'bg-red-100 text-red-800',
      GET: 'bg-green-100 text-green-800',
      POST: 'bg-blue-100 text-blue-800',
    };
    return colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className='space-y-6'>
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>
              Test Suite Name <span className='text-red-500'>*</span>
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

      {/* Manage Requests & Test Cases */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0'>
          <div>
            <CardTitle className='flex items-center'>
              Manage Requests & Test Cases
              <span className='text-red-500 ml-1'>*</span>
            </CardTitle>
            <p className='text-sm text-gray-600 mt-1'>
              Import additional API requests or modify existing test case
              configurations
            </p>
          </div>
          <Button variant='outline' className='text-blue-600'>
            <Download className='w-4 h-4 mr-2' />
            Import More Requests
          </Button>
        </CardHeader>
        <CardContent>
          <div className='mb-4 p-3 bg-blue-50 rounded-md'>
            <div className='flex justify-between text-sm'>
              <span className='text-blue-700'>
                {mockRequests.length} requests configured
              </span>
              <span className='text-blue-700'>
                {mockRequests.reduce(
                  (total, req) => total + req.testCases.total,
                  0
                )}{' '}
                test cases selected
              </span>
            </div>
          </div>

          <div className='space-y-4'>
            {mockRequests.map((request) => (
              <div key={request.id} className='border rounded-lg p-4'>
                <div className='flex items-start justify-between mb-3'>
                  <div className='flex items-center space-x-3'>
                    <Badge className={getMethodBadge(request.method)}>
                      {request.method}
                    </Badge>
                    <div>
                      <h3 className='font-medium'>{request.name}</h3>
                      <p className='text-sm text-gray-600'>
                        {request.endpoint}
                      </p>
                      <p className='text-sm text-gray-500 mt-1'>
                        {request.description}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Button variant='ghost' size='sm'>
                      <Settings className='w-4 h-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-red-600 hover:text-red-700'
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>
                </div>

                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>Test Cases:</span>
                    <Button
                      variant='link'
                      size='sm'
                      className='text-blue-600 p-0 h-auto'
                    >
                      Configure
                    </Button>
                  </div>
                  <div className='flex items-center space-x-2 text-sm'>
                    <span className='text-gray-600'>⚡ Functional</span>
                    <Badge variant='outline' className='text-blue-600'>
                      {request.testCases.functional}
                    </Badge>
                  </div>
                  <div className='text-sm text-gray-600'>
                    Total:{' '}
                    <span className='font-medium'>
                      {request.testCases.total} test cases
                    </span>
                  </div>
                  {request.testCases.total === 0 && (
                    <p className='text-sm text-gray-400 italic'>
                      No test cases selected. Click "Configure" to add test
                      cases.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className='mt-6 pt-4 border-t bg-gray-50 -mx-4 px-4 py-3 rounded-b-lg'>
            <div className='flex justify-between text-sm'>
              <span>
                Configured requests: <strong>{mockRequests.length}</strong>
              </span>
              <span>
                Total test cases:{' '}
                <strong>
                  {mockRequests.reduce(
                    (total, req) => total + req.testCases.total,
                    0
                  )}
                </strong>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestSuiteForm;
