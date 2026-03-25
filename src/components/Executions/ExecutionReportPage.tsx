// src/components/Executions/ExecutionReportPage.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { executionService } from '@/services/executionService.service';
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
  SkipForward,
} from 'lucide-react';
import { formatDistanceToNow, isValid } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { shareReport } from '@/utils/exportUtils';
import { RequestGrouping } from '../Reports/Components/RequestGrouping';
import Logo from '../../assests/images/OptraLogo.webp';
import { Loader } from '../Loader';
import { downloadAsHTMLSameUI } from '@/utils/exportUtilsSameUi';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { RequestMetrics } from '../Reports/Components/RequestMetrics';
import { buildRequestMetrics } from '@/types/report';
import ExportHTMLButton from '../Reports/Components/ExportHTMLButton';
import ExportPDFButton from '../Reports/Components/ExportPDFButton';
import { RequestReportMetrics } from '../Reports/Components/RequestReportMetrics';
import {
  downloadAsPDF,
  mapBackendSuiteReportToTestSuiteData,
} from '@/utils/exportUtilsNew';
import { convertDateStamp } from '@/utils/exportDate';
import { useWorkspace } from '@/hooks/useWorkspace';
import {
  createIntegrationJiraIssue,
  getWorkSpaceIntegrations,
} from '@/services/integrationTools.service';
import { WorkSpaceIntegration } from '../settings/ExternalTools';
import { useToast } from '@/hooks/use-toast';
import JiraIntegrationModal from './JiraIntegrationModal';

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
    total > 0
      ? Math.round((passed / total) * 100)
      : Number(data?.successRate || 0);

  const avgDuration =
    tcs.length > 0
      ? Math.round(
        tcs.reduce((s: number, t: any) => s + Number(t?.duration || 0), 0) /
        tcs.length,
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

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString();
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

  const search = new URLSearchParams(window.location.search);
  const executionId = search.get('executionId');

  const { type, entityId } = useParams<RouteParams>();

  const handleShare = () => {
    shareReport(entityId, executionId || '');
  };
  const handleDownloadPDF = async () => {
    // 1. Map raw backend response to TestSuiteData
    const mappedSuite = mapBackendSuiteReportToTestSuiteData(data);

    // 2. Expose this to the PDF util
    (window as any).__REPORT_DATA__ = mappedSuite;

    // 3. Trigger PDF generation
    await downloadAsPDF('report-content', `${mappedSuite.name}_report.pdf`);
  };

  const handleDownloadHTML = () =>
    downloadAsHTMLSameUI('report-content', `${data.name}_report.html`);

  const JiraIcon = () => (
    <svg
      viewBox='0 0 48 48'
      xmlns='http://www.w3.org/2000/svg'
      className='w-6 h-6'
      fill='none'
    >
      <path
        d='M0 24C0 10.7452 10.7452 0 24 0C37.2548 0 48 10.7452 48 24C48 37.2548 37.2548 48 24 48C10.7452 48 0 37.2548 0 24Z'
        fill='white'
      />
      <path
        d='M34.9367 12H23.41C23.41 13.38 23.9582 14.7035 24.934 15.6793C25.9098 16.6551 27.2333 17.2033 28.6133 17.2033H30.7367V19.2533C30.7385 22.1245 33.0656 24.4515 35.9367 24.4533V13C35.9367 12.4477 35.489 12 34.9367 12Z'
        fill='#2684FF'
      />
      <path
        d='M29.2333 17.7433H17.7067C17.7085 20.6144 20.0355 22.9414 22.9067 22.9433H25.03V25C25.0337 27.8711 27.3622 30.1966 30.2333 30.1966V18.7433C30.2333 18.191 29.7856 17.7433 29.2333 17.7433Z'
        fill='url(#paint0_linear)'
      />
      <path
        d='M23.5267 23.4833H12C12 26.357 14.3296 28.6866 17.2033 28.6866H19.3333V30.7366C19.3352 33.6051 21.6582 35.9311 24.5267 35.9366V24.4833C24.5267 23.931 24.079 23.4833 23.5267 23.4833Z'
        fill='url(#paint1_linear)'
      />
      <defs>
        <linearGradient
          id='paint0_linear'
          x1='27.4434'
          y1='15.326'
          x2='22.5699'
          y2='20.4112'
          gradientUnits='userSpaceOnUse'
        >
          <stop offset='0.18' stopColor='#0052CC' />
          <stop offset='1' stopColor='#2684FF' />
        </linearGradient>
        <linearGradient
          id='paint1_linear'
          x1='376.829'
          y1='349.939'
          x2='167.455'
          y2='557.146'
          gradientUnits='userSpaceOnUse'
        >
          <stop offset='0.18' stopColor='#0052CC' />
          <stop offset='1' stopColor='#2684FF' />
        </linearGradient>
      </defs>
    </svg>
  );
  const [integrations, setIntegrations] = useState<WorkSpaceIntegration[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  const getIntegrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getWorkSpaceIntegrations(workspaceId || '');
      const data: WorkSpaceIntegration[] = await response;
      setIntegrations(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch integrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      getIntegrations();
    }
  }, [workspaceId]);

  const jiraIntegration = integrations?.find(
    (integration) => integration.type === 'jira',
  );
  const integrationId = jiraIntegration?.id;

  const [openJiraModal, setOpenJiraModal] = useState(false);

  const [jiraPayload, setJiraPayload] = useState({
    summary: '',
    description: '',
    issueType: '',
  });

  const [jiraLoading, setJiraLoading] = useState(false);

  const { toast } = useToast();

  const handleJiraSubmit = async (e: any) => {
    e.preventDefault();
    try {
      setJiraLoading(true);

      await createIntegrationJiraIssue(
        integrationId || '',
        jiraPayload,
        workspaceId || '',
      );
      toast({ title: 'Jira issue created successfully' });
      setOpenJiraModal(false);
    } catch (error) {
      console.error('Failed to create Jira issue', error);
    } finally {
      setJiraLoading(false);
    }
  };

  return (
    <div id='report-content'>
      <div className='border border-gray-200 bg-background rounded-lg px-6 py-3 animate-fade-in mt-3'>
        <div className='flex justify-between items-start mb-6'>
          <div>
            <h1 className='text-lg md:text-3xl font-bold text-gray-900 mb-2'>
              {data.name}
            </h1>
            <p className='text-sm md:text-md text-gray-600'>
              {data.description}
            </p>
          </div>

          <div>
            <img
              src={Logo}
              alt='Optraflow logo'
              style={{ width: '100%', height: '50px' }}
            />
          </div>
        </div>

        <div className='grid grid-cols-2 md:grid-cols-4 gap-6 mb-3'>
          <div className='flex items-center space-x-3'>
            <Calendar className='w-5 h-5 text-blue-500' />
            <div>
              <p className='text-xs md:text-sm text-gray-500'>Execution Date</p>
              <p className='text-xs md:text-sm font-semibold'>
                {(() => {
                  const { dateTime, tz } = convertDateStamp(
                    data.lastExecutionDate,
                  );
                  return `${dateTime}, ${tz}`;
                })()}
              </p>
            </div>
          </div>

          <div className='flex items-center space-x-3'>
            <Clock className='w-5 h-5 text-green-500' />
            <div>
              <p className='text-xs md:text-sm text-gray-500'>Duration</p>
              <p className='text-xs md:text-sm font-semibold'>
                {formatDuration(data.duration)}
              </p>
            </div>
          </div>

          <div className='flex items-center space-x-3'>
            <User className='w-5 h-5 text-purple-500' />
            <div>
              <p className='text-xs md:text-sm text-gray-500'>Executed By</p>
              <p className='text-xs md:text-sm font-semibold text-xs'>
                {data.executedBy}
              </p>
            </div>
          </div>

          <div className='flex items-center space-x-3'>
            <Database className='w-5 h-5 text-orange-500' />
            <div>
              <p className='text-xs md:text-sm text-gray-500'>Environment</p>
              <p className='text-xs md:text-sm font-semibold text-xs'>
                {data.environmentId}
              </p>
            </div>
          </div>
        </div>

        <div className='flex items-center gap-4'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleDownloadHTML}
                  className='p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group'
                  title='Download HTML'
                >
                  <FileText className='w-5 h-5' />
                </button>
              </TooltipTrigger>
              <TooltipContent>Download HTML Report</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleDownloadPDF}
                  className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors group'
                  title='Download PDF'
                >
                  <Download className='w-5 h-5' />
                </button>
              </TooltipTrigger>
              <TooltipContent>Download PDF Summary</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleShare}
                  className='p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors group'
                  title='Share Report'
                >
                  <Share2 className='w-5 h-5' />
                </button>
              </TooltipTrigger>
              <TooltipContent>Share Report</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setOpenJiraModal(true)}
                  className='p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors'
                >
                  <JiraIcon />
                </button>
              </TooltipTrigger>
              <TooltipContent>Create Jira issue</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <JiraIntegrationModal
            openJiraModal={openJiraModal}
            setOpenJiraModal={() => setOpenJiraModal(false)}
            testSuiteData={data}
          />
          {/* <Dialog open={openJiraModal} onOpenChange={setOpenJiraModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Jira Issue</DialogTitle>
              </DialogHeader>

              <div className="space-y-3">

                <input
                  className="w-full border rounded-md p-2 text-sm"
                  placeholder="Summary"
                  value={jiraPayload.summary}
                  onChange={(e) =>
                    setJiraPayload({ ...jiraPayload, summary: e.target.value })
                  }
                />

                <textarea
                  className="w-full border rounded-md p-2 text-sm"
                  placeholder="Description"
                  value={jiraPayload.description}
                  onChange={(e) =>
                    setJiraPayload({ ...jiraPayload, description: e.target.value })
                  }
                />

                <select
                  className="w-full border rounded-md p-2 text-sm"
                  value={jiraPayload.issueType}
                  onChange={(e) =>
                    setJiraPayload({ ...jiraPayload, issueType: e.target.value })
                  }
                >
                  <option value="Bug">Bug</option>
                  <option value="Task">Task</option>
                  <option value="Story">Story</option>
                </select>

              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenJiraModal(false)}>
                  Cancel
                </Button>

                <Button onClick={handleJiraSubmit} disabled={jiraLoading}>
                  {jiraLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {jiraLoading ? "Creating..." : "Create Issue"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog> */}
        </div>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6 mb-3 mt-3'>
        {metrics.map((metric, index) => (
          <div
            key={index}
            className='border border-gray-200 bg-background rounded-lg px-6 py-6 animate-fade-in'
          >
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs md:text-sm text-gray-500 mb-1'>
                  {metric.title}
                </p>
                <p className='text-md md:text-2xl font-bold text-gray-900'>
                  {metric.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${metric.color}`}>
                <metric.icon className='w-4 h-4 md:w-6 md:h-6' />
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

// --- 🔧 Helpers (put near your other utils) -------------------------------

type RequestExec = {
  order?: number;
  method?: string;
  name?: string;
  url?: string;
  status?: 'passed' | 'failed' | 'skipped';
  responseSize?: number;
  duration?: number; // ms
  extractedVariables?: Array<{ name: string; value: string }>;
};

function computeChainOverall(data: any) {
  const total =
    Number(data?.totalRequests) || data?.requestExecutions?.length || 0;
  const successful = Number(data?.successfulRequests) || 0;
  const failed = Number(data?.failedRequests) || 0;
  const skipped = Number(data?.skippedRequests) || 0;
  const denom = total || successful + failed + skipped;
  const successRate = denom ? Math.round((successful / denom) * 100) : 0;

  return { total: denom, successful, failed, skipped, successRate };
}

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[idx];
}

type MethodRow = {
  method: string;
  total: number;
  success: number;
  failed: number;
  avgDurationMs: number;
  p95DurationMs: number;
};

function buildRequestMetricsFromChain(data: any): MethodRow[] {
  const execs: RequestExec[] = data?.requestExecutions || [];
  const byMethod = new Map<string, RequestExec[]>();

  execs.forEach((r) => {
    const key = (r.method || 'GET').toUpperCase();
    if (!byMethod.has(key)) byMethod.set(key, []);
    byMethod.get(key)!.push(r);
  });

  const rows: MethodRow[] = [];
  for (const [method, list] of byMethod.entries()) {
    const durations = list
      .map((x) => Number(x.duration || 0))
      .filter((n) => Number.isFinite(n));
    const total = list.length;
    const success = list.filter((x) => x.status === 'passed').length;
    const failed = list.filter((x) => x.status === 'failed').length;
    const avgDurationMs = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;
    const p95DurationMs = Math.round(percentile(durations, 95));
    rows.push({ method, total, success, failed, avgDurationMs, p95DurationMs });
  }

  // Stable order: GET, POST, PUT, PATCH, DELETE, OTHER
  const order = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  rows.sort((a, b) => {
    const ai = order.indexOf(a.method);
    const bi = order.indexOf(b.method);
    if (ai === -1 && bi === -1) return a.method.localeCompare(b.method);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return rows;
}

const formatMs = (ms: number) =>
  ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;

// --- ✅ RequestChainReport with Metrics -----------------------------------

type RequestChainReportProps = {
  data: any;
  environment: string;
  startedQS: string | null;
};

const RequestChainReport: React.FC<RequestChainReportProps> = ({
  data,
  environment,
  startedQS,
}) => {
  // 🧮 Derived data
  const steps =
    data.requestExecutions?.map((req: any, index: number) => ({
      step: req.order || index + 1,
      method: req.method,
      name: req.name,
      url: req.url,
      statusCode: req.status === 'passed' ? 200 : 400,
      requestCurl: req.requestCurl,
      response: req.response,
      responseSize: `${req.responseSize || 0} bytes`,
      duration: `${req.duration}ms`,
      substitutedVariables: req.substitutedVariables || [],
      assertionResults:
        req?.assertionResults?.map((v: any) => ({
          status: v.status,
          category: v.category,
          description: v.description,
          field: v.field,
          responseSize: v.responseSize,
          responseStatus: v.responseStatus,
          responseTime: v.responseTime,
          type: v.type,
          actualValue: v.actualValue,
          operator: v.operator,
          expectedValue: v.expectedValue,
        })) ?? [],
      status:
        req.status === 'passed'
          ? 'success'
          : req.status === 'failed'
            ? 'fail'
            : 'skipped',
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

  const overall = React.useMemo(() => computeChainOverall(data), [data]);
  const methodMetrics = React.useMemo(
    () => buildRequestMetricsFromChain(data),
    [data],
  );
  const successRateColor =
    overall.successRate >= 80
      ? 'text-green-600 bg-green-100'
      : overall.successRate >= 60
        ? 'text-yellow-600 bg-yellow-100'
        : 'text-red-600 bg-red-100';

  const metricCards = [
    {
      title: 'Success Rate',
      value: `${overall.successRate}%`,
      icon: TrendingUp,
      color: successRateColor,
    },
    {
      title: 'Total Requests',
      value: overall.total.toString(),
      icon: Clock,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      title: 'Successful',
      value: overall.successful.toString(),
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100',
    },
    {
      title: 'Failed',
      value: overall.failed.toString(),
      icon: XCircle,
      color: 'text-red-600 bg-red-100',
    },
    {
      title: 'Skipped',
      value: overall.skipped.toString(),
      icon: SkipForward,
      color: 'text-red-600 bg-orange-100',
    },
  ];

  const formatDuration = (ms: number) =>
    ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(
      Math.floor(Math.log(bytes) / Math.log(k)),
      sizes.length - 1,
    );
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const JiraIcon = () => (
    <svg
      viewBox='0 0 48 48'
      xmlns='http://www.w3.org/2000/svg'
      className='w-6 h-6'
      fill='none'
    >
      <path
        d='M0 24C0 10.7452 10.7452 0 24 0C37.2548 0 48 10.7452 48 24C48 37.2548 37.2548 48 24 48C10.7452 48 0 37.2548 0 24Z'
        fill='white'
      />
      <path
        d='M34.9367 12H23.41C23.41 13.38 23.9582 14.7035 24.934 15.6793C25.9098 16.6551 27.2333 17.2033 28.6133 17.2033H30.7367V19.2533C30.7385 22.1245 33.0656 24.4515 35.9367 24.4533V13C35.9367 12.4477 35.489 12 34.9367 12Z'
        fill='#2684FF'
      />
      <path
        d='M29.2333 17.7433H17.7067C17.7085 20.6144 20.0355 22.9414 22.9067 22.9433H25.03V25C25.0337 27.8711 27.3622 30.1966 30.2333 30.1966V18.7433C30.2333 18.191 29.7856 17.7433 29.2333 17.7433Z'
        fill='url(#paint0_linear)'
      />
      <path
        d='M23.5267 23.4833H12C12 26.357 14.3296 28.6866 17.2033 28.6866H19.3333V30.7366C19.3352 33.6051 21.6582 35.9311 24.5267 35.9366V24.4833C24.5267 23.931 24.079 23.4833 23.5267 23.4833Z'
        fill='url(#paint1_linear)'
      />
      <defs>
        <linearGradient
          id='paint0_linear'
          x1='27.4434'
          y1='15.326'
          x2='22.5699'
          y2='20.4112'
          gradientUnits='userSpaceOnUse'
        >
          <stop offset='0.18' stopColor='#0052CC' />
          <stop offset='1' stopColor='#2684FF' />
        </linearGradient>
        <linearGradient
          id='paint1_linear'
          x1='376.829'
          y1='349.939'
          x2='167.455'
          y2='557.146'
          gradientUnits='userSpaceOnUse'
        >
          <stop offset='0.18' stopColor='#0052CC' />
          <stop offset='1' stopColor='#2684FF' />
        </linearGradient>
      </defs>
    </svg>
  );
  const [integrations, setIntegrations] = useState<WorkSpaceIntegration[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  const getIntegrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getWorkSpaceIntegrations(workspaceId || '');
      const data: WorkSpaceIntegration[] = await response;
      setIntegrations(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch integrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      getIntegrations();
    }
  }, [workspaceId]);

  const jiraIntegration = integrations?.find(
    (integration) => integration.type === 'jira',
  );
  const integrationId = jiraIntegration?.id;

  const [openJiraModal, setOpenJiraModal] = useState(false);

  const [jiraPayload, setJiraPayload] = useState({
    summary: '',
    description: '',
    issueType: '',
  });

  const [jiraLoading, setJiraLoading] = useState(false);

  const { toast } = useToast();

  const handleJiraSubmit = async (e: any) => {
    e.preventDefault();
    try {
      setJiraLoading(true);

      await createIntegrationJiraIssue(
        integrationId || '',
        jiraPayload,
        workspaceId || '',
      );
      toast({ title: 'Jira issue created successfully' });
      setOpenJiraModal(false);
    } catch (error) {
      console.error('Failed to create Jira issue', error);
    } finally {
      setJiraLoading(false);
    }
  };

  const [, navigate] = useLocation();

  return (
    <div>
      {/* Keeps your existing top summary card */}
      {/* <AnalyticsReport
        title={data.name || 'Request Chain Report'}
        description="Request chain execution flow with variable extraction and data flow analysis"
        successRate={`${data.successRate ?? overall.successRate}%`}
        meta={{
          environment,
          executedAt: safeExecutedAt(startedQS),
          duration: `${Math.round((data.duration || 0) / 1000)}s`,
          executedBy: data.executedBy || 'Unknown',
        }}
        stats={[
          { value: (data.totalRequests ?? overall.total).toString(), label: 'Total Requests', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
          { value: (data.successfulRequests ?? overall.successful).toString(), label: 'Successful', bgColor: 'bg-green-100', textColor: 'text-green-700' },
          { value: (data.failedRequests ?? overall.failed).toString(), label: 'Failed', bgColor: 'bg-red-100', textColor: 'text-red-700' },
          { value: (data.skippedRequests ?? overall.skipped).toString(), label: 'Skipped', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
        ]}
      /> */}

      {/* Header block (unchanged, except we reuse formatDuration) */}
      <div className='border border-gray-200 bg-background rounded-lg px-6 py-3 animate-fade-in mt-3'>
        <div className='flex justify-between items-start mb-6'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              {data.name}
            </h1>
            <p className='text-gray-600'>
              {data.description ||
                'Request chain execution flow with variable extraction and data flow analysis'}
            </p>
          </div>

          {/* Replace Logo import if needed */}
          <div>
            <img
              src={Logo}
              alt='Optraflow logo'
              style={{ width: '100%', height: '50px' }}
            />
          </div>
        </div>

        <div className='grid grid-cols-2 md:grid-cols-4 gap-6 mb-3'>
          <div className='flex items-center space-x-3'>
            <Calendar className='w-5 h-5 text-blue-500' />
            <div>
              <p className='text-sm text-gray-500'>Execution Date</p>
              <p className='text-sm font-semibold'>
                {(() => {
                  const { dateTime, tz } = convertDateStamp(
                    data.lastExecutionDate,
                  );
                  return `${dateTime}, ${tz}`;
                })()}
              </p>
            </div>
          </div>

          <div className='flex items-center space-x-3'>
            <Clock className='w-5 h-5 text-green-500' />
            <div>
              <p className='text-sm text-gray-500'>Duration</p>
              <p className='font-semibold'>
                {formatDuration(data?.duration || 0)}
              </p>
            </div>
          </div>

          <div className='flex items-center space-x-3'>
            <User className='w-5 h-5 text-purple-500' />
            <div>
              <p className='text-sm text-gray-500'>Executed By</p>
              <p className='font-semibold text-xs'>{data.executedBy}</p>
            </div>
          </div>

          <div className='flex items-center space-x-3'>
            <Database className='w-5 h-5 text-orange-500' />
            <div>
              <p className='text-sm text-gray-500'>Environment</p>
              <p className='font-semibold text-xs'>{data.environmentId}</p>
            </div>
          </div>
        </div>

        {/* 🔹 New: Metric Cards (same visual style as TestSuiteReport) */}

        {/* (Optional) Action buttons retained but commented handlers */}

        <div className='flex items-center gap-4'>
          <TooltipProvider>
            <ExportHTMLButton reportData={data} />
            <ExportPDFButton reportData={data} />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className='p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors group'
                  title='Share Report'
                >
                  <Share2 className='w-5 h-5' />
                </button>
              </TooltipTrigger>
              <TooltipContent>Share Report</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    if (jiraIntegration) {
                      setOpenJiraModal(true);
                    } else {
                      navigate('/settings/account?tab=external-tools');
                    }
                  }}
                  className='p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-1'
                >
                  <JiraIcon />

                  {!jiraIntegration && (
                    <span className='text-xs text-red-500'>Not Configured</span>
                  )}
                </button>
              </TooltipTrigger>

              <TooltipContent>
                {jiraIntegration ? 'Create Jira issue' : 'Configure Jira'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <JiraIntegrationModal
            openJiraModal={openJiraModal}
            setOpenJiraModal={() => setOpenJiraModal(false)}
            testSuiteData={data}
          />
        </div>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-5 gap-6 mb-3 mt-3'>
        {metricCards.map((metric, idx) => (
          <div
            key={idx}
            className='border border-gray-200 bg-background rounded-lg px-6 py-6 animate-fade-in'
          >
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-500 mb-1'>{metric.title}</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {metric.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${metric.color}`}>
                <metric.icon className='w-6 h-6' />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* <div className="bg-white rounded-lg border border-gray-200  p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Activity className="w-6 h-6 mr-2 text-blue-600" />
          Request-Level Metrics
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.totalRequests}</p>
            <p className="text-sm text-gray-500">Total Requests</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
              <Database className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.uniqueEndpoints}</p>
            <p className="text-sm text-gray-500">Unique Endpoints</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatDuration(data.duration / data.totalRequests)}
            </p>
            <p className="text-sm text-gray-500">Avg Response Time</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatBytes(data.totalDataTransferred)}
            </p>
            <p className="text-sm text-gray-500">Data Transferred</p>
          </div>
        </div>
      </div> */}

      <RequestReportMetrics metrics={methodMetrics} />

      {/* Existing sections */}

      <RequestChainExecutionFlow steps={steps} />

      <div className='bg-[#FAFAFA]'>
        <VariablesAndDataFlow
          globalVariables={globalVars}
          extractedVariables={extractedVars}
        />
      </div>
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
  const { currentWorkspace } = useWorkspace();

  const reportRef = useRef<HTMLDivElement>(null);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['execution-report', entityId, type, executionId],
    queryFn: async () => {
      if (!entityId || !type || !executionId || !currentWorkspace?.id) {
        throw new Error('Missing required parameters');
      }

      if (type === 'test_suite') {
        return executionService.getTestSuiteReport(
          entityId,
          executionId,
          currentWorkspace.id,
        );
      }

      return executionService.getRequestChainReport(
        entityId,
        executionId,
        currentWorkspace.id,
      );
    },

    enabled:
      Boolean(entityId) &&
      Boolean(type) &&
      Boolean(executionId) &&
      Boolean(currentWorkspace?.id),
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
    <div className='mx-auto p-1 sm:p-1' ref={reportRef}>
      <header className='border border-gray-200 bg-background rounded-lg px-6 py-4 animate-fade-in'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-semibold text-foreground'>
              {type === 'test_suite'
                ? 'Test Suite Report'
                : 'Request Chain Report'}
            </h2>
          </div>
          {/* <div className="flex items-center space-x-4">
            <Button onClick={() => handleDownloadPDF(reportData?.data?.name || 'Report')}>
              Download Report
            </Button>
          </div> */}
        </div>
      </header>

      {isLoading ? (
        <Loader message='Loading Report' />
      ) : reportData?.data ? (
        type === 'test_suite' ? (
          <TestSuiteReport data={reportData.data} />
        ) : (
          <RequestChainReport
            data={reportData.data}
            environment={environment}
            startedQS={started}
          />
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
