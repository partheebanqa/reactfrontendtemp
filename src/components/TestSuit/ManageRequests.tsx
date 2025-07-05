import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Download, Settings, Trash2 } from 'lucide-react';
import { MethodBadge } from './MethodBadge';

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

interface ManageRequestsProps {
  requests: Request[];
  onImport: () => void;
}

export const ManageRequests: React.FC<ManageRequestsProps> = ({
  requests,
  onImport,
}) => {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0'>
        <div>
          <CardTitle className='flex items-center'>
            Manage Requests & Test Cases
            <span className='text-destructive ml-1'>*</span>
          </CardTitle>
          <p className='text-sm text-muted-foreground mt-1'>
            Import additional API requests or modify existing test case
            configurations
          </p>
        </div>
        <Button variant='outline' onClick={onImport}>
          <Download className='w-4 h-4 mr-2' />
          Import More Requests
        </Button>
      </CardHeader>

      <CardContent>
        <div className='mb-4 p-3 bg-info/5 border border-info/20 rounded-md'>
          <div className='flex justify-between text-sm'>
            <span className='text-info'>
              {requests.length} requests configured
            </span>
            <span className='text-info'>
              {requests.reduce((sum, r) => sum + r.testCases.functional, 0)}{' '}
              test cases selected
            </span>
          </div>
        </div>

        <div className='space-y-4'>
          {requests.map((request) => (
            <div key={request.id} className='border rounded-lg p-4'>
              <div className='flex items-start justify-between mb-3'>
                <div className='flex items-center space-x-3'>
                  <MethodBadge method={request.method} />
                  <div>
                    <h3 className='font-medium'>{request.name}</h3>
                    <p className='text-sm text-muted-foreground'>
                      {request.endpoint}
                    </p>
                    <p className='text-sm text-muted-foreground mt-1'>
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
                    className='text-destructive hover:text-destructive hover:bg-destructive/10'
                  >
                    <Trash2 className='w-4 h-4' />
                  </Button>
                </div>
              </div>

              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>
                    Test Cases:
                  </span>
                  <Button
                    variant='link'
                    size='sm'
                    className='text-primary p-0 h-auto'
                  >
                    Configure
                  </Button>
                </div>
                <div className='flex items-center space-x-2 text-sm'>
                  <span className='text-muted-foreground'>⚡ Functional</span>
                  <Badge
                    variant='outline'
                    className='text-primary border-primary/20 bg-primary/5'
                  >
                    {request.testCases.functional}
                  </Badge>
                </div>
                <div className='text-sm text-muted-foreground'>
                  Total:{' '}
                  <span className='font-medium'>
                    {request.testCases.total} test cases
                  </span>
                </div>
                {request.testCases.total === 0 && (
                  <p className='text-sm text-muted-foreground italic'>
                    No test cases selected. Click "Configure" to add test cases.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className='mt-6 pt-4 border-t bg-muted/20 -mx-4 px-4 py-3 rounded-b-lg'>
          <div className='flex justify-between text-sm'>
            <span>
              Configured requests: <strong>{requests.length}</strong>
            </span>
            <span>
              Total test cases:{' '}
              <strong>
                {requests.reduce((sum, r) => sum + r.testCases.functional, 0)}
              </strong>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
