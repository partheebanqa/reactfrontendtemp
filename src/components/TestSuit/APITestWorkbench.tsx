import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { ImportModal } from './ImportModal';
import { ManageRequests } from './ManageRequests';

export interface Request {
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

export const APITestWorkbench: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleImportRequests = (selectedRequests: Request[]) => {
    setRequests((prev) => [...prev, ...selectedRequests]);
    setIsImportModalOpen(false);
  };

  const EmptyState = () => (
    <Card className='border-2 border-dashed border-border'>
      <CardContent className='flex flex-col items-center justify-center py-16 px-6'>
        <div className='w-16 h-16 mb-6 rounded-full bg-muted flex items-center justify-center'>
          <Download className='w-8 h-8 text-muted-foreground' />
        </div>
        <h3 className='text-xl font-semibold mb-2'>No requests imported yet</h3>
        <p className='text-muted-foreground text-center mb-6 max-w-md'>
          Start by importing API requests from your collections. You can then
          configure specific test cases for each request.
        </p>
        <Button
          variant='outline'
          size='lg'
          onClick={() => setIsImportModalOpen(true)}
        >
          <Download className='w-4 h-4 mr-2' />
          Import Your First Request
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className='min-h-screen bg-background p-6'>
      <div className='max-w-6xl mx-auto'>
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold mb-2'>
                Import Requests & Configure Test Cases
              </h1>
              <p className='text-muted-foreground'>
                Import API requests from collections and configure test cases
                for each request
              </p>
            </div>
            {requests.length > 0 && (
              <Button
                variant='outline'
                onClick={() => setIsImportModalOpen(true)}
              >
                <Download className='w-4 h-4 mr-2' />
                Import Requests
              </Button>
            )}
          </div>
        </div>

        {requests.length === 0 ? (
          <EmptyState />
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
