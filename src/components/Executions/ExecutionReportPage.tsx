// src/components/Executions/ExecutionReportPage.tsx
import React, { useEffect, useMemo, useRef } from 'react';
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
  FileText,
  Share2,
  User,
  Database,
  Clock,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow, isValid } from 'date-fns';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { shareReport } from '@/utils/exportUtils';
import { RequestGrouping } from '../Reports/Components/RequestGrouping';
import Logo from '../../assests/images/OptraLogo.png';
import { Loader } from '../Loader';
import { downloadAsHTMLSameUI, downloadAsPDFSameUI } from '@/utils/exportUtilsSameUi';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { RequestMetrics } from '../Reports/Components/RequestMetrics';
import { buildRequestMetrics } from '@/types/report';

type RouteParams = {
  type: 'test_suite' | 'request_chain';
  entityId: string;
};

const useQueryParams = () => {
  const search = typeof window !== 'undefined' ? window.location.search : '';
  return React.useMemo(() => new URLSearchParams(search), [search]);
};

const safeExecutedAt = (startedQS: string | null): string => {
  if (!startedQS) return 'Unknown';
  const asNumber = Number(startedQS);
  const date =
    Number.isFinite(asNumber) && startedQS.trim() !== ''
      ? new Date(asNumber)
      : new Date(startedQS);
  if (!isValid(date)) return 'Unknown';
  return formatDistanceToNow(date, { addSuffix: true });
};

// ---------- helpers to compute summary ----------
const collectAllTestCases = (data: any) => {
  const out: Array<{ status?: string; duration?: number }> = [];

  // Style A: ApiTestReport.requests[*].{positiveTests..}.testCases
  if (Array.isArray(data?.requests)) {
    const groups = [
      'positiveTests',
      'negativeTests',
      'functionalTests',
      'semanticTests',
      'edgeCaseTests',
      'securityTests',
      'advancedSecurityTests',
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
    'positiveTests',
    'negativeTests',
    'functionalTests',
    'semanticTests',
    'edgeCaseTests',
    'securityTests',
    'advancedSecurityTests',
  ];
  for (const k of catKeys) {
    const cat = data?.[k];
    if (cat?.apis?.length) out.push(...cat.apis);
  }

  return out;
};

const computeOverall = (data: any) => {
  const tcs = collectAllTestCases(data);

  const total = tcs.length || Number(data?.totalTestCases || 0);

  const passed =
    (tcs.length ? tcs.filter((t: any) => t.status === 'passed').length : 0) ||
    Number(data?.successfulTestCases || 0);

  const failed =
    (tcs.length ? tcs.filter((t: any) => t.status === 'failed').length : 0) ||
    Number(data?.failedTestCases || 0);

  const skipped =
    (tcs.length ? tcs.filter((t: any) => t.status === 'skipped').length : 0) ||
    Number(data?.skippedTestCases || 0);

  const successRate =
    total > 0 ? Math.round((passed / total) * 100) : Number(data?.successRate || 0);

  const avgDuration =
    tcs.length > 0
      ? Math.round(
        tcs.reduce((s: number, t: any) => s + Number(t?.duration || 0), 0) / tcs.length
      )
      : Number.isFinite(data?.duration)
        ? Number(data.duration)
        : 0;

  return { total, passed, failed, skipped, successRate, avgDuration };
};

// ----------------- Child components -----------------

type TestSuiteReportProps = { data: any };
const TestSuiteReport: React.FC<TestSuiteReportProps> = ({ data }) => {
  // ✅ hooks live at the top of this component (not inside a conditional branch)
  const overall = useMemo(() => computeOverall(data), [data]);
  const requestMetrics = useMemo(() => buildRequestMetrics(data), [data]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();
  const formatDuration = (ms: number) => `${(ms / 1000).toFixed(2)}s`;

  const metrics = [
    {
      title: 'Success Rate',
      value: `${overall.successRate}%`,
      icon: TrendingUp,
      color:
        overall.successRate >= 80
          ? 'text-green-600 bg-green-100'
          : overall.successRate >= 60
            ? 'text-yellow-600 bg-yellow-100'
            : 'text-red-600 bg-red-100',
    },
    {
      title: 'Total Test Cases',
      value: overall.total.toString(),
      icon: Clock,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      title: 'Passed',
      value: overall.passed.toString(),
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100',
    },
    {
      title: 'Failed',
      value: overall.failed.toString(),
      icon: XCircle,
      color: 'text-red-600 bg-red-100',
    },
  ];

  const handleShare = () => shareReport(data.name);
  const handleDownloadPDF = () =>
    downloadAsPDFSameUI('report-content', `${data.name}_report.pdf`);
  const handleDownloadHTML = () =>
    downloadAsHTMLSameUI('report-content', `${data.name}_report.html`);

  return (
    <div id="report-content">
      <div className="border border-gray-200 bg-background rounded-lg px-6 py-3 animate-fade-in mt-3">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.name}</h1>
            <p className="text-gray-600">{data.description}</p>
          </div>

          <div>
            <img src={Logo} alt="Optraflow logo" style={{ width: '100%', height: '50px' }} />
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleDownloadHTML}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group"
                  title="Download HTML"
                >
                  <FileText className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Download HTML File</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleDownloadPDF}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
                  title="Download PDF"
                >
                  <Download className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Download PDF File</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleShare}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors group"
                  title="Share Report"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Share Report</TooltipContent>
            </Tooltip>
          </TooltipProvider>
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

      {/* Request-level metrics */}
      <RequestMetrics metrics={requestMetrics} />

      <RequestGrouping report={data} />
    </div>
  );
};

type RequestChainReportProps = {
  data: any;
  environment: string;
  startedQS: string | null;
};
const RequestChainReport: React.FC<RequestChainReportProps> = ({ data, environment, startedQS }) => {
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
    <div>
      <AnalyticsReport
        title={data.name || 'Request Chain Report'}
        description="Request chain execution flow with variable extraction and data flow analysis"
        successRate={`${data.successRate || 0}%`}
        meta={{
          environment,
          executedAt: safeExecutedAt(startedQS),
          duration: `${Math.round((data.duration || 0) / 1000)}s`,
          executedBy: data.executedBy || 'Unknown',
        }}
        stats={[
          { value: data.totalRequests?.toString() || '0', label: 'Total Requests', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
          { value: data.successfulRequests?.toString() || '0', label: 'Successful', bgColor: 'bg-green-100', textColor: 'text-green-700' },
          { value: data.failedRequests?.toString() || '0', label: 'Failed', bgColor: 'bg-red-100', textColor: 'text-red-700' },
          { value: data.skippedRequests?.toString() || '0', label: 'Skipped', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
        ]}
      />

      <div className="bg-[#FAFAFA]">
        <VariablesAndDataFlow globalVariables={globalVars} extractedVariables={extractedVars} />
      </div>

      <RequestChainExecutionFlow steps={steps} />
    </div>
  );
};

// ----------------- Page component -----------------

const ExecutionReportPage: React.FC = () => {
  const { type, entityId } = useParams<RouteParams>();
  const qs = useQueryParams();
  const environment = qs.get('env') || 'Unknown';
  const started = qs.get('started');
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (type === 'test_suite' && reportData?.data) {
      // @ts-ignore – used by the HTML exporter
      window.__REPORT_DATA__ = reportData.data;
    }
  }, [type, reportData]);

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

  return (
    <div className="mx-auto p-1 sm:p-1" ref={reportRef}>
      <header className="border border-gray-200 bg-background rounded-lg px-6 py-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              {type === 'test_suite' ? 'Test Suite Report' : 'Request Chain Report'}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={() => handleDownloadPDF(reportData?.data?.name || 'Report')}>
              Download Report
            </Button>
          </div>
        </div>
      </header>

      {isLoading ? (
        <Loader message="Loading Report" />
      ) : reportData?.data ? (
        type === 'test_suite' ? (
          <TestSuiteReport data={reportData.data} />
        ) : (
          <RequestChainReport data={reportData.data} environment={environment} startedQS={started} />
        )
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No report data available</p>
        </div>
      )}
    </div>
  );
};

export default ExecutionReportPage;
