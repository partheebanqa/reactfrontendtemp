import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { executionService } from '@/services/executionService.service';
import { formatDistanceToNow } from 'date-fns';

export const ExecutionDetailsDialog = ({ open, onClose, execution }: any) => {
  // Fetch report data based on execution type
  const { data: reportData, isLoading } = useQuery({
    queryKey: [
      'execution-report',
      execution?.entityId,
      execution?.executionType,
      execution?.id,
    ],
    queryFn: async () => {
      if (!execution?.entityId || !execution?.executionType || !execution?.id)
        return null;

      if (execution.executionType === 'test_suite') {
        return await executionService.getTestSuiteReport(
          execution.entityId,
          execution.id
        );
      } else {
        return await executionService.getRequestChainReport(
          execution?.entityId,
          execution.id
        );
      }
    },
    enabled:
      open &&
      !!execution?.entityId &&
      !!execution?.executionType &&
      !!execution?.id,
  });

  const renderTestSuiteReport = (data: any) => {
    return (
      <div className='max-h-[80vh] overflow-y-auto scrollbar-thin space-y-6'>
        <div className='bg-card p-6 rounded-lg border'>
          <h3 className='text-lg font-semibold mb-4'>
            {data.name || 'Test Suite Report'}
          </h3>
          <p className='text-muted-foreground mb-4'>
            {data.description || 'Comprehensive test suite execution report'}
          </p>

          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-foreground'>
                {data.successRate || 0}%
              </div>
              <div className='text-sm text-muted-foreground'>Success Rate</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-foreground'>
                {data.totalTestCases || 0}
              </div>
              <div className='text-sm text-muted-foreground'>Total Tests</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {data.successfulTestCases || 0}
              </div>
              <div className='text-sm text-muted-foreground'>Successful</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-red-600'>
                {data.failedTestCases || 0}
              </div>
              <div className='text-sm text-muted-foreground'>Failed</div>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {[
            { name: 'General Tests', data: data.generalTests, color: 'blue' },
            {
              name: 'Functional Tests',
              data: data.functionalTests,
              color: 'purple',
            },
            {
              name: 'Performance Tests',
              data: data.performanceTests,
              color: 'yellow',
            },
            { name: 'Security Tests', data: data.securityTests, color: 'red' },
          ].map((category) => (
            <div key={category.name} className='bg-card p-4 rounded-lg border'>
              <h4 className='font-medium mb-2'>{category.name}</h4>
              <div className='text-sm text-muted-foreground'>
                Total: {category.data?.total || 0} | Passed:{' '}
                {category.data?.passed || 0} | Failed:{' '}
                {category.data?.failed || 0}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRequestChainReport = (data: any) => {
    return (
      <div className='max-h-[80vh] overflow-y-auto scrollbar-thin space-y-6'>
        <div className='bg-card p-6 rounded-lg border'>
          <h3 className='text-lg font-semibold mb-4'>
            {data.name || 'Request Chain Report'}
          </h3>
          <p className='text-muted-foreground mb-4'>
            Request chain execution flow with variable extraction and data flow
            analysis
          </p>

          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-foreground'>
                {data.successRate || 0}%
              </div>
              <div className='text-sm text-muted-foreground'>Success Rate</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-foreground'>
                {data.totalRequests || 0}
              </div>
              <div className='text-sm text-muted-foreground'>
                Total Requests
              </div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {data.successfulRequests || 0}
              </div>
              <div className='text-sm text-muted-foreground'>Successful</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-red-600'>
                {data.failedRequests || 0}
              </div>
              <div className='text-sm text-muted-foreground'>Failed</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-hidden'>
        <DialogHeader>
          <DialogTitle>
            {execution?.executionType === 'test_suite'
              ? 'Test Suite Report'
              : 'Request Chain Report'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
              <p className='text-muted-foreground'>Loading report...</p>
            </div>
          </div>
        ) : reportData?.data ? (
          execution?.executionType === 'test_suite' ? (
            renderTestSuiteReport(reportData.data)
          ) : (
            renderRequestChainReport(reportData.data)
          )
        ) : (
          <div className='text-center py-8'>
            <p className='text-muted-foreground'>No report data available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
