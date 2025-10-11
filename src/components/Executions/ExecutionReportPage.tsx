import React from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { executionService } from '@/services/executionService.service';
import AnalyticsReport from '@/components/Reports/Components/Analistics';
import DetailedTestResults from '@/components/Reports/Components/DetailedTestResults';
import TestCategoryCard from '@/components/Reports/Components/TestCategoryCard';
import RequestChainExecutionFlow from '@/components/Reports/Components/RequestChainExecutionFlow';
import VariablesAndDataFlow from '@/components/Reports/Components/VariablesAndDataFlow';
import {
  Download,
  FileCode,
  Settings2,
  Share2,
  Shield,
  ShieldCheck,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  ShieldAlert,
  FileText,
  User,
  Database,
  Clock,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { formatDistanceToNow, isValid } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { downloadAsHTML, downloadAsPDF, shareReport } from '@/utils/exportUtils';
import { RequestGrouping } from '../Reports/Components/RequestGrouping';

type RouteParams = {
  type: 'test_suite' | 'request_chain';
  entityId: string;
};

const useQueryParams = () => {
  const search = typeof window !== 'undefined' ? window.location.search : '';
  return React.useMemo(() => new URLSearchParams(search), [search]);
};

// ✅ SAFE helper to render "executedAt"
const safeExecutedAt = (startedQS: string | null): string => {
  if (!startedQS) return 'Unknown';

  // If it's numeric (epoch ms), use Number; otherwise try to construct from string
  const asNumber = Number(startedQS);
  const date =
    Number.isFinite(asNumber) && startedQS.trim() !== ''
      ? new Date(asNumber)
      : new Date(startedQS);

  if (!isValid(date)) return 'Unknown';
  return formatDistanceToNow(date, { addSuffix: true });
};

// Collect *all* test cases from either style of payload
const collectAllTestCases = (data: any) => {
  const out: Array<{ status?: string; duration?: number }> = [];

  // Style A: ApiTestReport.requests[*].{positiveTests..}.testCases
  if (Array.isArray(data?.requests)) {
    const groups = [
      "positiveTests",
      "negativeTests",
      "functionalTests",
      "semanticTests",
      "edgeCaseTests",
      "securityTests",
      "advancedSecurityTests",
    ];
    for (const req of data.requests) {
      for (const g of groups) {
        const tg = req?.[g];
        if (tg?.testCases?.length) out.push(...tg.testCases);
      }
    }
  }

  // Style B: TestSuiteData.{positiveTests..}.apis
  const catKeys = [
    "positiveTests",
    "negativeTests",
    "functionalTests",
    "semanticTests",
    "edgeCaseTests",
    "securityTests",
    "advancedSecurityTests",
  ];
  for (const k of catKeys) {
    const cat = data?.[k];
    if (cat?.apis?.length) out.push(...cat.apis);
  }

  return out;
};

const computeOverall = (data: any) => {
  const tcs = collectAllTestCases(data);

  const total =
    (tcs.length || 0) || Number(data?.totalTestCases || 0);

  const passed =
    (tcs.length ? tcs.filter((t: any) => t.status === "passed").length : 0) ||
    Number(data?.successfulTestCases || 0);

  const failed =
    (tcs.length ? tcs.filter((t: any) => t.status === "failed").length : 0) ||
    Number(data?.failedTestCases || 0);

  const skipped =
    (tcs.length ? tcs.filter((t: any) => t.status === "skipped").length : 0) ||
    Number(data?.skippedTestCases || 0);

  const successRate =
    total > 0 ? Math.round((passed / total) * 100) : Number(data?.successRate || 0);

  const avgDuration =
    tcs.length > 0
      ? Math.round(
        tcs.reduce((s: number, t: any) => s + Number(t?.duration || 0), 0) /
        tcs.length
      )
      : Number.isFinite(data?.duration)
        ? Number(data.duration)
        : 0;

  return { total, passed, failed, skipped, successRate, avgDuration };
};


const ExecutionReportPage: React.FC = () => {
  const { type, entityId } = useParams<RouteParams>();
  const qs = useQueryParams();
  const environment = qs.get('env') || 'Unknown';
  const started = qs.get('started'); // string | null
  const executionId = qs.get('executionId');

  const reportRef = useRef<HTMLDivElement>(null);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['execution-report', entityId, type, executionId],
    queryFn: () => {
      if (!entityId || !type || !executionId) return null;
      return type === 'test_suite'
        ? executionService?.getTestSuiteReport(entityId, executionId)
        : executionService?.getRequestChainReport(entityId, executionId);
    },
    enabled: !!entityId && !!type && !!executionId,
  });

  // console.log('reportData:', reportData);

  const handleDownloadPDF = async (reportName: string) => {
    if (!reportRef.current) return;

    const element = reportRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${reportName || 'Report'}.pdf`);
  };

  const renderTestSuiteReport = (data: any) => {
    // console.log('data123:', data);

    // const testCategories = [
    //   {
    //     name: 'Positive Tests',
    //     icon: <CheckCircle className='w-4 h-4 text-green-600' />,
    //     testCount: data.positiveTests?.total || 0,
    //     tests:
    //       data.positiveTests?.apis?.map((api: any) => ({
    //         name: api.name,
    //         method: api.method,
    //         endpoint: api.url,
    //         duration: `${api.duration}ms`,
    //         requestCurl: api.requestCurl,
    //         response: api.response,
    //         statusCode: api.status === 'passed' ? 200 : 400,
    //         status:
    //           api.status === 'passed'
    //             ? 'success'
    //             : api.status === 'failed'
    //               ? 'fail'
    //               : 'warning',
    //       })) || [],
    //   },
    //   {
    //     name: 'Negative Tests',
    //     icon: <XCircle className='w-4 h-4 text-red-600' />,
    //     testCount: data.negativeTests?.total || 0,
    //     tests:
    //       data.negativeTests?.apis?.map((api: any) => ({
    //         name: api.name,
    //         method: api.method,
    //         endpoint: api.url,
    //         duration: `${api.duration}ms`,
    //         requestCurl: api.requestCurl,
    //         response: api.response,
    //         statusCode: api.status === 'passed' ? 200 : 400,
    //         status:
    //           api.status === 'passed'
    //             ? 'success'
    //             : api.status === 'failed'
    //               ? 'fail'
    //               : 'warning',
    //       })) || [],
    //   },
    //   {
    //     name: 'Functional Tests',
    //     icon: <FileCode className='w-4 h-4 text-purple-600' />,
    //     testCount: data.functionalTests?.total || 0,
    //     tests:
    //       data.functionalTests?.apis?.map((api: any) => ({
    //         name: api.name,
    //         method: api.method,
    //         endpoint: api.url,
    //         requestCurl: api.requestCurl,
    //         response: api.response,
    //         duration: `${api.duration}ms`,
    //         statusCode: api.status === 'passed' ? 200 : 400,
    //         status:
    //           api.status === 'passed'
    //             ? 'success'
    //             : api.status === 'failed'
    //               ? 'fail'
    //               : 'warning',
    //       })) || [],
    //   },
    //   {
    //     name: 'Semantic Tests',
    //     icon: <Eye className='w-4 h-4 text-blue-600' />,
    //     testCount: data.semanticTests?.total || 0,
    //     tests:
    //       data.semanticTests?.apis?.map((api: any) => ({
    //         name: api.name,
    //         method: api.method,
    //         endpoint: api.url,
    //         requestCurl: api.requestCurl,
    //         response: api.response,
    //         duration: `${api.duration}ms`,
    //         statusCode: api.status === 'passed' ? 200 : 400,
    //         status:
    //           api.status === 'passed'
    //             ? 'success'
    //             : api.status === 'failed'
    //               ? 'fail'
    //               : 'warning',
    //       })) || [],
    //   },
    //   {
    //     name: 'Edge Case Tests',
    //     icon: <AlertTriangle className='w-4 h-4 text-orange-600' />,
    //     testCount: data.edgeCaseTests?.total || 0,
    //     tests:
    //       data.edgeCaseTests?.apis?.map((api: any) => ({
    //         name: api.name,
    //         method: api.method,
    //         endpoint: api.url,
    //         requestCurl: api.requestCurl,
    //         response: api.response,
    //         duration: `${api.duration}ms`,
    //         statusCode: api.status === 'passed' ? 200 : 400,
    //         status:
    //           api.status === 'passed'
    //             ? 'success'
    //             : api.status === 'failed'
    //               ? 'fail'
    //               : 'warning',
    //       })) || [],
    //   },
    //   {
    //     name: 'Security Tests',
    //     icon: <Shield className='w-4 h-4 text-red-600' />,
    //     testCount: data.securityTests?.total || 0,
    //     tests:
    //       data.securityTests?.apis?.map((api: any) => ({
    //         name: api.name,
    //         method: api.method,
    //         endpoint: api.url,
    //         requestCurl: api.requestCurl,
    //         response: api.response,
    //         duration: `${api.duration}ms`,
    //         statusCode: api.status === 'passed' ? 200 : 400,
    //         status:
    //           api.status === 'passed'
    //             ? 'success'
    //             : api.status === 'failed'
    //               ? 'fail'
    //               : 'warning',
    //       })) || [],
    //   },
    //   {
    //     name: 'Advanced Security Tests',
    //     icon: <ShieldAlert className='w-4 h-4 text-red-700' />,
    //     testCount: data.advancedSecurityTests?.total || 0,
    //     tests:
    //       data.advancedSecurityTests?.apis?.map((api: any) => ({
    //         name: api.name,
    //         method: api.method,
    //         endpoint: api.url,
    //         requestCurl: api.requestCurl,
    //         response: api.response,
    //         duration: `${api.duration}ms`,
    //         statusCode: api.status === 'passed' ? 200 : 400,
    //         status:
    //           api.status === 'passed'
    //             ? 'success'
    //             : api.status === 'failed'
    //               ? 'fail'
    //               : 'warning',
    //       })) || [],
    //   },
    // ];
    const overall = computeOverall(data);

    const metrics = [
      {
        title: "Success Rate",
        value: `${overall.successRate}%`,
        icon: TrendingUp,
        color:
          overall.successRate >= 80
            ? "text-green-600 bg-green-100"
            : overall.successRate >= 60
              ? "text-yellow-600 bg-yellow-100"
              : "text-red-600 bg-red-100",
      },
      {
        title: "Total Test Cases",
        value: overall.total.toString(),
        icon: Clock,
        color: "text-blue-600 bg-blue-100",
      },
      {
        title: "Passed",
        value: overall.passed.toString(),
        icon: CheckCircle,
        color: "text-green-600 bg-green-100",
      },
      {
        title: "Failed",
        value: overall.failed.toString(), // ✅ was using skipped by mistake
        icon: XCircle,
        color: "text-red-600 bg-red-100",
      },
      // {
      //   title: "Skipped",
      //   value: overall.skipped.toString(),
      //   icon: AlertTriangle,
      //   color: "text-yellow-600 bg-yellow-100",
      // },
      // {
      //   title: "Avg Duration",
      //   value: `${(overall.avgDuration / 1000).toFixed(2)}s`,
      //   icon: Clock,
      //   color: "text-gray-700 bg-gray-100",
      // },
    ];


    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleString();
    };

    const formatDuration = (ms: number) => {
      return `${(ms / 1000).toFixed(2)}s`;
    };


    const handleDownloadPDF = () => {
      downloadAsPDF('report-content', `${data.name}_report.pdf`);
    };

    const handleDownloadHTML = () => {
      downloadAsHTML('report-content', `${data.name}_report.html`);
    };

    const handleShare = () => {
      shareReport(data.name);
    };


    return (
      <div ref={reportRef}>
        <div className="border border-gray-200 bg-background rounded-lg px-6 py-3 animate-fade-in mt-3">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.name}</h1>
              <p className="text-gray-600">{data.description}</p>
            </div>

          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-3">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Execution Date</p>
                <p className="font-semibold">{formatDate(data.lastExecutionDate)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-semibold">{formatDuration(data.duration)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Executed By</p>
                <p className="font-semibold text-xs">{data.executedBy}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-500">Environment</p>
                <p className="font-semibold text-xs">{data.environmentId}</p>
              </div>
            </div>
          </div>



          <div className="flex items-center gap-4">
            {/* <button
              onClick={handleDownloadPDF}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
              title="Download PDF"
            >
              <Download className="w-5 h-5" />
            </button>

            <button
              onClick={handleDownloadHTML}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group"
              title="Download HTML"
            >
              <FileText className="w-5 h-5" />
            </button> */}

            {/* <button
              onClick={handleShare}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors group"
              title="Share Report"
            >
              <Share2 className="w-5 h-5" />
            </button> */}
          </div>

        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-3 mt-3">
          {metrics.map((metric, index) => (
            <div key={index} className="border border-gray-200 bg-background rounded-lg px-6 py-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
                <div className={`p-3 rounded-full ${metric.color}`}>
                  <metric.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* <AnalyticsReport
          title={data.name || 'Test Suite Report'}
          description={
            data.description || 'Comprehensive test suite execution report'
          }
          successRate={`${data.successRate || 0}%`}
          meta={{
            environment,
            executedAt: safeExecutedAt(started),
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
        /> */}

        {/* <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-5'>
          <TestCategoryCard
            icon={<CheckCircle className='w-5 h-5 text-green-600' />}
            title='Positive Tests'
            total={data.positiveTests?.total || 0}
            passed={data.positiveTests?.passed || 0}
            failed={data.positiveTests?.failed || 0}
            warning={data.positiveTests?.skipped || 0}
            bgColor='bg-green-50'
            borderColor='border border-green-200'
          />
          <TestCategoryCard
            icon={<XCircle className='w-5 h-5 text-red-600' />}
            title='Negative Tests'
            total={data.negativeTests?.total || 0}
            passed={data.negativeTests?.passed || 0}
            failed={data.negativeTests?.failed || 0}
            warning={data.negativeTests?.skipped || 0}
            bgColor='bg-red-50'
            borderColor='border border-red-200'
          />
          <TestCategoryCard
            icon={<FileCode className='w-5 h-5 text-purple-600' />}
            title='Functional Tests'
            total={data.functionalTests?.total || 0}
            passed={data.functionalTests?.passed || 0}
            failed={data.functionalTests?.failed || 0}
            warning={data.functionalTests?.skipped || 0}
            bgColor='bg-purple-50'
            borderColor='border border-purple-200'
          />
          <TestCategoryCard
            icon={<Eye className='w-5 h-5 text-blue-600' />}
            title='Semantic Tests'
            total={data.semanticTests?.total || 0}
            passed={data.semanticTests?.passed || 0}
            failed={data.semanticTests?.failed || 0}
            warning={data.semanticTests?.skipped || 0}
            bgColor='bg-blue-50'
            borderColor='border border-blue-200'
          />
          <TestCategoryCard
            icon={<AlertTriangle className='w-5 h-5 text-orange-600' />}
            title='Edge Case Tests'
            total={data.edgeCaseTests?.total || 0}
            passed={data.edgeCaseTests?.passed || 0}
            failed={data.edgeCaseTests?.failed || 0}
            warning={data.edgeCaseTests?.skipped || 0}
            bgColor='bg-orange-50'
            borderColor='border border-orange-200'
          />
          <TestCategoryCard
            icon={<Shield className='w-5 h-5 text-red-600' />}
            title='Security Tests'
            total={data.securityTests?.total || 0}
            passed={data.securityTests?.passed || 0}
            failed={data.securityTests?.failed || 0}
            warning={data.securityTests?.skipped || 0}
            bgColor='bg-red-50'
            borderColor='border border-red-200'
          />
          <TestCategoryCard
            icon={<ShieldAlert className='w-5 h-5 text-red-700' />}
            title='Advanced Security Tests'
            total={data.advancedSecurityTests?.total || 0}
            passed={data.advancedSecurityTests?.passed || 0}
            failed={data.advancedSecurityTests?.failed || 0}
            warning={data.advancedSecurityTests?.skipped || 0}
            bgColor='bg-red-100'
            borderColor='border border-red-300'
          />
        </div> */}

        {/* <DetailedTestResults categories={testCategories} /> */}
        <RequestGrouping report={data} />


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

    const globalVars = data.globalVariables || {};
    const extractedVars =
      data.extractedVariables?.reduce((acc: any, variable: any) => {
        acc[variable.name] = variable.value;
        return acc;
      }, {}) || {};

    return (
      <div ref={reportRef}>
        <AnalyticsReport
          title={data.name || 'Request Chain Report'}
          description='Request chain execution flow with variable extraction and data flow analysis'
          successRate={`${data.successRate || 0}%`}
          meta={{
            environment,
            executedAt: safeExecutedAt(started), // ← use safe helper
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
    <div className='mx-auto p-1 sm:p-1'>
      <header className='border border-gray-200 bg-background rounded-lg px-6 py-4 animate-fade-in'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-semibold text-foreground'>
              {' '}
              {type === 'test_suite'
                ? 'Test Suite Report'
                : 'Request Chain Report'}
            </h2>
          </div>
          <div className='flex items-center space-x-4'>
            <Button
              onClick={() =>
                handleDownloadPDF(reportData?.data?.name || 'Report')
              }
            >
              Download Report
            </Button>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className='flex items-center justify-center py-12'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
            <p className='text-gray-500'>Loading report...</p>
          </div>
        </div>
      ) : reportData?.data ? (
        type === 'test_suite' ? (
          renderTestSuiteReport(reportData.data)
        ) : (
          renderRequestChainReport(reportData.data)
        )
      ) : (
        <div className='text-center py-8'>
          <p className='text-gray-500'>No report data available</p>
        </div>
      )}
    </div>
  );
};

export default ExecutionReportPage;
