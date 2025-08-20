import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { executionService } from '@/services/executionService.service';
import AnalyticsReport from '@/components/Reports/Components/Analistics';
import DetailedTestResults from '@/components/Reports/Components/DetailedTestResults';
import TestCategoryCard from '@/components/Reports/Components/TestCategoryCard';
import RequestChainExecutionFlow from '@/components/Reports/Components/RequestChainExecutionFlow';
import VariablesAndDataFlow from '@/components/Reports/Components/VariablesAndDataFlow';
import { FileCode, Settings2, Shield, ShieldCheck, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const ExecutionDetailsDialog = ({ open, onClose, execution }: any) => {
  // Fetch report data based on execution type
  const { data: reportData, isLoading } = useQuery({
    queryKey: [
      'execution-report',
      execution?.entityId,
      execution?.executionType,
    ],
    queryFn: () => {
      if (!execution?.entityId || !execution?.executionType) return null;

      if (execution.executionType === 'test_suite') {
        return executionService.getTestSuiteReport(execution.entityId);
      } else {
        return executionService.getRequestChainReport(execution.entityId);
      }
    },
    enabled: open && !!execution?.entityId && !!execution?.executionType,
  });

  const renderTestSuiteReport = (data: any) => {
    const testCategories = [
      {
        name: 'General Tests',
        icon: <Settings2 className='w-4 h-4 text-blue-600' />,
        testCount: data.generalTests?.total || 0,
        tests:
          data.generalTests?.apis?.map((api: any) => ({
            name: api.name,
            method: api.method,
            endpoint: api.url,
            duration: `${api.duration}ms`,
            statusCode: 200,
            status:
              api.status === 'passed'
                ? 'success'
                : api.status === 'failed'
                ? 'fail'
                : 'warning',
          })) || [],
      },
      {
        name: 'Functional Tests',
        icon: <FileCode className='w-4 h-4 text-purple-600' />,
        testCount: data.functionalTests?.total || 0,
        tests:
          data.functionalTests?.apis?.map((api: any) => ({
            name: api.name,
            method: api.method,
            endpoint: api.url,
            duration: `${api.duration}ms`,
            statusCode: 200,
            status:
              api.status === 'passed'
                ? 'success'
                : api.status === 'failed'
                ? 'fail'
                : 'warning',
          })) || [],
      },
      {
        name: 'Performance Tests',
        icon: <Zap className='w-4 h-4 text-yellow-600' />,
        testCount: data.performanceTests?.total || 0,
        tests:
          data.performanceTests?.apis?.map((api: any) => ({
            name: api.name,
            method: api.method,
            endpoint: api.url,
            duration: `${api.duration}ms`,
            statusCode: 200,
            status:
              api.status === 'passed'
                ? 'success'
                : api.status === 'failed'
                ? 'fail'
                : 'warning',
          })) || [],
      },
      {
        name: 'Security Tests',
        icon: <Shield className='w-4 h-4 text-red-600' />,
        testCount: data.securityTests?.total || 0,
        tests:
          data.securityTests?.apis?.map((api: any) => ({
            name: api.name,
            method: api.method,
            endpoint: api.url,
            duration: `${api.duration}ms`,
            statusCode: 200,
            status:
              api.status === 'passed'
                ? 'success'
                : api.status === 'failed'
                ? 'fail'
                : 'warning',
          })) || [],
      },
    ];

    return (
      <div className='max-h-[80vh] overflow-y-auto'>
        <AnalyticsReport
          title={data.name || 'Test Suite Report'}
          description={
            data.description || 'Comprehensive test suite execution report'
          }
          successRate={`${data.successRate || 0}%`}
          meta={{
            environment: execution.environment || 'Unknown',
            executedAt: execution.startTime
              ? formatDistanceToNow(new Date(execution.startTime), {
                  addSuffix: true,
                })
              : 'Unknown',
            duration: `${Math.round((data.duration || 0) / 1000)}s`,
            executedBy: data.executedBy || 'Unknown',
          }}
          stats={[
            {
              value: data.totalTestCases?.toString() || '0',
              label: 'Total Tests',
              bgColor: 'bg-gray-100',
              textColor: 'text-gray-800',
            },
            {
              value: data.successfulTestCases?.toString() || '0',
              label: 'Successful',
              bgColor: 'bg-green-100',
              textColor: 'text-green-700',
            },
            {
              value: data.failedTestCases?.toString() || '0',
              label: 'Failed',
              bgColor: 'bg-red-100',
              textColor: 'text-red-700',
            },
            {
              value: data.skippedTestCases?.toString() || '0',
              label: 'Skipped',
              bgColor: 'bg-yellow-100',
              textColor: 'text-yellow-700',
            },
          ]}
        />

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-5'>
          <TestCategoryCard
            icon={<Settings2 className='w-5 h-5' />}
            title='General Tests'
            total={data.generalTests?.total || 0}
            passed={data.generalTests?.passed || 0}
            failed={data.generalTests?.failed || 0}
            warning={data.generalTests?.skipped || 0}
            borderColor='border border-blue-200'
          />
          <TestCategoryCard
            icon={<FileCode className='w-5 h-5 text-purple-600' />}
            title='Functional Tests'
            total={data.functionalTests?.total || 0}
            passed={data.functionalTests?.passed || 0}
            failed={data.functionalTests?.failed || 0}
            warning={data.functionalTests?.skipped || 0}
          />
          <TestCategoryCard
            icon={<Zap className='w-5 h-5 text-yellow-600' />}
            title='Performance Tests'
            total={data.performanceTests?.total || 0}
            passed={data.performanceTests?.passed || 0}
            failed={data.performanceTests?.failed || 0}
            warning={data.performanceTests?.skipped || 0}
            bgColor='bg-yellow-50'
            borderColor='border border-yellow-200'
          />
          <TestCategoryCard
            icon={<ShieldCheck className='w-5 h-5 text-red-600' />}
            title='Security Tests'
            total={data.securityTests?.total || 0}
            passed={data.securityTests?.passed || 0}
            failed={data.securityTests?.failed || 0}
            warning={data.securityTests?.skipped || 0}
            bgColor='bg-red-50'
            borderColor='border border-red-200'
          />
        </div>

        <DetailedTestResults categories={testCategories} />
      </div>
    );
  };

  const renderRequestChainReport = (data: any) => {
    const steps =
      data.requestExecutions?.map((req: any, index: number) => ({
        step: req.order || index + 1,
        method: req.method,
        name: req.name,
        url: req.url,
        statusCode: req.status === 'passed' ? 200 : 400,
        responseSize: `${req.responseSize || 0} bytes`,
        duration: `${req.duration}ms`,
        status: req.status === 'passed' ? 'success' : 'fail',
        extractedVars:
          req.extractedVariables?.map((v: any) => ({
            key: v.name,
            value: v.value,
          })) || [],
        errorMessage: req.status === 'failed' ? 'Request failed' : undefined,
      })) || [];

    const globalVars = data.globalVariables || {
      baseUrl: 'https://api.example.com',
      timeout: '5000',
    };

    const extractedVars =
      data.extractedVariables?.reduce((acc: any, variable: any) => {
        acc[variable.name] = variable.value;
        return acc;
      }, {}) || {};

    return (
      <div className='max-h-[80vh] overflow-y-auto'>
        <AnalyticsReport
          title={data.name || 'Request Chain Report'}
          description='Request chain execution flow with variable extraction and data flow analysis'
          successRate={`${data.successRate || 0}%`}
          meta={{
            environment: execution.environment || 'Unknown',
            executedAt: execution.startTime
              ? formatDistanceToNow(new Date(execution.startTime), {
                  addSuffix: true,
                })
              : 'Unknown',
            duration: `${Math.round((data.duration || 0) / 1000)}s`,
            executedBy: data.executedBy || 'Unknown',
          }}
          stats={[
            {
              value: data.totalRequests?.toString() || '0',
              label: 'Total Requests',
              bgColor: 'bg-gray-100',
              textColor: 'text-gray-800',
            },
            {
              value: data.successfulRequests?.toString() || '0',
              label: 'Successful',
              bgColor: 'bg-green-100',
              textColor: 'text-green-700',
            },
            {
              value: data.failedRequests?.toString() || '0',
              label: 'Failed',
              bgColor: 'bg-red-100',
              textColor: 'text-red-700',
            },
            {
              value: data.skippedRequests?.toString() || '0',
              label: 'Skipped',
              bgColor: 'bg-yellow-100',
              textColor: 'text-yellow-700',
            },
          ]}
        />

        <div className='bg-[#FAFAFA]'>
          <VariablesAndDataFlow
            globalVariables={globalVars}
            extractedVariables={extractedVars}
          />
        </div>

        <RequestChainExecutionFlow steps={steps} />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-6xl max-h-[90vh] overflow-hidden'>
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
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <p className='text-gray-500'>Loading report...</p>
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
            <p className='text-gray-500'>No report data available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
