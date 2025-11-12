'use client';

import type React from 'react';
import { useState, useEffect, useMemo } from 'react';
import {
  Loader2,
  X,
  Download,
  Share2,
  Search,
  Globe,
  Clock,
  Zap,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toast } from '@/hooks/use-toast';
import { collectionActions } from '@/store/collectionStore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { executeRequest } from '@/services/executeRequest.service';

import { CSS } from '@dnd-kit/utilities';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { insightsService } from '@/services/insights.service';
import type { TestResult, TestMetrics } from '@/shared/types/testInsights';
import { InsightCard } from './InsightCard';
import { PerformanceCard } from './PerformanceCard';
import { useWorkspace } from '@/hooks/useWorkspace';

interface CollectionRequest {
  id?: string;
  name: string;
  method: string;
  url: string;
  bodyType?: string;
  bodyRawContent?: string;
  bodyFormData?: any[];
  authorizationType?: string;
  authorization?: any;
  headers?: any[];
  params?: any[];
}

interface Collection {
  id: string;
  name: string;
  requests?: CollectionRequest[];
  folders?: any[];
}

interface SortableRequestItemProps {
  request: RequestWithStatus;
  index: number;
  onToggle: () => void;
  getMethodColor: (method: string) => string;
  getStatusBadge: (
    status?: number,
    responseTime?: number,
    isLoading?: boolean
  ) => React.ReactNode;
}

const SortableRequestItem: React.FC<SortableRequestItemProps> = ({
  request,
  index,
  onToggle,
  getMethodColor,
  getStatusBadge,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: request.id || `request-${index}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='flex items-center gap-3 py-2 border-b border-border hover:bg-muted/50'
    >
      <button
        className='cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded transition-colors'
        {...attributes}
        {...listeners}
      >
        <GripVertical className='w-4 h-4 text-muted-foreground' />
      </button>
      <span className='text-sm text-muted-foreground w-2'>{index + 1}</span>
      <input
        type='checkbox'
        checked={request.isSelected}
        onChange={onToggle}
        className='w-3 h-3 rounded border-border'
      />
      <span
        className={`py-1 text-xs font-semibold rounded ${getMethodColor(
          request.method
        )}`}
      >
        {request.method}
      </span>
      <span className='flex-1 text-sm text-foreground'>{request.name}</span>
      {getStatusBadge(request.status, request.responseTime, request.isLoading)}
    </div>
  );
};

interface RequestWithStatus extends CollectionRequest {
  status?: number;
  responseTime?: number;
  requestPayloadSizeKB?: string;
  responsePayloadSizeKB?: string;
  isSelected: boolean;
  isLoading?: boolean;
}

interface SanitizeTestRunnerProps {
  collection: Collection;
  onClose: () => void;
  workspaceId?: string;
  environments?: any[];
  activeEnvironment?: any;
}

export const SanitizeTestRunner: React.FC<SanitizeTestRunnerProps> = ({
  collection,

  workspaceId,
  environments = [],
  activeEnvironment,
}) => {
  const { currentWorkspace } = useWorkspace();
  const [requests, setRequests] = useState<RequestWithStatus[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) {
      return requests;
    }
    return requests.filter((req) =>
      req.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [requests, searchQuery]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setRequests((items) => {
        const oldIndex = items.findIndex(
          (item) => (item.id || `request-${items.indexOf(item)}`) === active.id
        );
        const newIndex = items.findIndex(
          (item) => (item.id || `request-${items.indexOf(item)}`) === over.id
        );

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  useEffect(() => {
    const getAllRequests = (
      requests: CollectionRequest[] = [],
      folders: any[] = []
    ): CollectionRequest[] => {
      let allRequests = [...requests];
      folders.forEach((folder) => {
        if (folder.requests) {
          allRequests = [...allRequests, ...folder.requests];
        }
        if (folder.folders) {
          allRequests = [...allRequests, ...getAllRequests([], folder.folders)];
        }
      });
      return allRequests;
    };

    const allRequests = getAllRequests(
      collection.requests || [],
      (collection as any).folders || []
    );

    setRequests(
      allRequests.map((req) => ({
        ...req,
        status: undefined,
        responseTime: undefined,
        requestPayloadSizeKB: undefined,
        responsePayloadSizeKB: undefined,
        isSelected: true,
        isLoading: false,
      }))
    );

    setSearchQuery('');
  }, [collection.id, collection.requests, collection.folders]);
  const handleClose = () => {
    collectionActions.closeSanitizeTestRunner();
  };
  const handleSelectAll = () => {
    setRequests((prev) => prev.map((req) => ({ ...req, isSelected: true })));
  };

  const handleDeselectAll = () => {
    setRequests((prev) => prev.map((req) => ({ ...req, isSelected: false })));
  };

  const handleReset = () => {
    setRequests((prev) =>
      prev.map((req) => ({
        ...req,
        status: undefined,
        responseTime: undefined,
        requestPayloadSizeKB: undefined,
        responsePayloadSizeKB: undefined,
        isSelected: true,
        isLoading: false,
      }))
    );
    setStartTime(null);
  };

  const handleRunTests = async () => {
    setIsRunning(true);
    setStartTime(new Date());

    const selectedRequests = requests.filter((r) => r.isSelected);

    try {
      for (const req of selectedRequests) {
        setRequests((prev) =>
          prev.map((r) => (r.id === req.id ? { ...r, isLoading: true } : r))
        );

        const startTime = Date.now();

        const env =
          environments.find((e) => e.id === selectedEnvironment?.id) ??
          activeEnvironment ??
          null;

        let finalUrl = req.url;
        if (env?.baseUrl && env.baseUrl.trim() !== '') {
          try {
            const parsedUrl = new URL(req.url);
            finalUrl = req.url.replace(
              `${parsedUrl.protocol}//${parsedUrl.host}`,
              env.baseUrl
            );
          } catch {
            finalUrl = req.url;
          }
        }

        const payload = {
          request: {
            workspaceId: currentWorkspace.id,
            name: req.name,
            method: req.method,
            url: finalUrl,
            bodyType: req.bodyType,
            bodyRawContent: req.bodyRawContent || '',
            bodyFormData: req.bodyFormData || [],
            authorizationType: req.authorizationType,
            authorization: req.authorization,
            headers: req.headers || [],
            params: req.params || [],
          },
          environmentId: selectedEnvironment?.id ?? null,
        };

        const requestPayloadSizeKB = (
          new Blob([JSON.stringify(payload)]).size / 1024
        ).toFixed(2);

        try {
          console.log('payload:', payload);

          const result = await executeRequest(payload);
          const endTime = Date.now();

          const responseStatus = result?.data?.responses?.[0]?.statusCode ?? 0;
          const responseTime = endTime - startTime;

          const responsePayloadBytes =
            result?.data?.responses?.[0]?.metrics?.bytesReceived ?? 0;
          const responsePayloadSizeKB = (responsePayloadBytes / 1024).toFixed(
            2
          );
          setRequests((prev) =>
            prev.map((r) =>
              r.id === req.id
                ? {
                    ...r,
                    status: responseStatus,
                    responseTime,
                    requestPayloadSizeKB,
                    responsePayloadSizeKB,
                    isLoading: false,
                  }
                : r
            )
          );
        } catch (error) {
          console.error('Error executing request:', req.name, error);
          const endTime = Date.now();
          setRequests((prev) =>
            prev.map((r) =>
              r.id === req.id
                ? {
                    ...r,
                    status: 500,
                    responseTime: endTime - startTime,
                    requestPayloadSizeKB: '0',
                    responsePayloadSizeKB: '0',
                    isLoading: false,
                  }
                : r
            )
          );
        }
      }
    } catch (error) {
      console.error('Error in handleRunTests:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getMethodColor = (method: string) => {
    const colors = {
      GET: 'text-green-600',
      POST: 'text-orange-600',
      PUT: 'text-blue-600',
      DELETE: 'text-red-600',
      PATCH: 'text-purple-600',
      HEAD: 'text-gray-600',
      OPTIONS: 'text-gray-600',
    };
    return colors[method as keyof typeof colors] || 'text-gray-600';
  };

  const getStatusBadge = (
    status?: number,
    responseTime?: number,
    isLoading?: boolean
  ) => {
    if (isLoading) {
      return (
        <div className='flex items-center gap-2'>
          <div className='w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground animate-pulse'>
            <Loader2 className='w-4 h-4 animate-spin' />
          </div>
          <span className='text-sm text-muted-foreground'>Loading...</span>
        </div>
      );
    }

    if (!status) return null;

    const isSuccess = status >= 200 && status < 300;
    const isError = status >= 400;

    return (
      <div className='flex items-center gap-2'>
        {isSuccess && (
          <div className='flex items-center gap-1'>
            <div className='w-5 h-5 rounded-full bg-green-100 flex items-center justify-center'>
              <svg
                className='w-3 h-3 text-green-600'
                fill='none'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path d='M5 13l4 4L19 7'></path>
              </svg>
            </div>
            <span className='px-1 py-0.5 bg-blue-500 text-white text-xs rounded-full font-medium'>
              {status}
            </span>
          </div>
        )}
        {isError && (
          <div className='flex items-center gap-1'>
            <div className='w-5 h-5 rounded-full bg-red-100 flex items-center justify-center'>
              <svg
                className='w-3 h-3 text-red-600'
                fill='none'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path d='M6 18L18 6M6 6l12 12'></path>
              </svg>
            </div>
            <span className='px-1 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium'>
              {status}
            </span>
          </div>
        )}
        {responseTime && (
          <span className='text-sm text-muted-foreground'>
            {responseTime}ms
          </span>
        )}
      </div>
    );
  };

  // Calculate metrics and insights
  const { metrics, testResults, insights } = useMemo(() => {
    const executedRequests = requests.filter((r) => r.status !== undefined);

    // Convert to TestResult format for insights
    const testResults: TestResult[] = executedRequests.map((r) => ({
      id: r.id || r.name,
      name: r.name,
      method: r.method,
      status:
        r.status && r.status >= 200 && r.status < 300
          ? 'passed'
          : r.status
          ? 'failed'
          : 'skipped',
      statusCode: r.status || 0,
      responseTime: r.responseTime || 0,
      payloadSize: Number(r.responsePayloadSizeKB || 0) * 1024,
      timestamp: new Date().toISOString(),
      hasAuthHeader: r.authorizationType !== 'none',
      requestHeaders: {},
      responseHeaders: {},
    }));

    const totalExecuted = executedRequests.length;
    const pass = executedRequests.filter(
      (r) => r.status && r.status >= 200 && r.status < 300
    ).length;
    const fail = executedRequests.filter(
      (r) => r.status && r.status >= 400
    ).length;
    const skipped = requests.filter((r) => !r.isSelected).length;
    const authApis = requests.filter(
      (r) => r.authorizationType !== 'none'
    ).length;

    const responseTimes = executedRequests
      .map((r) => r.responseTime || 0)
      .filter((t) => t > 0);

    const maxResponseTime =
      responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
    const minResponseTime =
      responseTimes.length > 0 ? Math.min(...responseTimes) : 0;

    const slowest = executedRequests.find(
      (r) => r.responseTime === maxResponseTime
    );
    const fastest = executedRequests.find(
      (r) => r.responseTime === minResponseTime
    );

    // Calculate most failed status code
    const failedRequests = executedRequests.filter(
      (r) => r.status && r.status >= 400
    );
    const statusCodeCounts = failedRequests.reduce((acc, r) => {
      if (r.status) {
        acc[r.status] = (acc[r.status] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);

    const mostFailedEntry = Object.entries(statusCodeCounts).sort(
      ([, a], [, b]) => b - a
    )[0];

    const metrics: TestMetrics = {
      total: requests.length,
      passed: pass,
      failed: fail,
      skipped,
      authAPIs: authApis,
      maxResponseTime,
      minResponseTime,
      slowestAPI: slowest?.name || 'N/A',
      fastestAPI: fastest?.name || 'N/A',
      totalExecutionTime: responseTimes.reduce((a, b) => a + b, 0),
      mostFailedStatusCode: mostFailedEntry
        ? { code: parseInt(mostFailedEntry[0]), count: mostFailedEntry[1] }
        : undefined,
    };

    const insights =
      testResults.length > 0
        ? insightsService.generateInsights(testResults, metrics)
        : [];

    return { metrics, testResults, insights };
  }, [requests]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`Test Summary`, 20, 20);
    doc.setFontSize(12);
    doc.text(collection.name, 20, 30);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 40);

    let yPos = 55;
    const summaryData = [
      { label: 'Total', value: metrics.total.toString() },
      { label: 'Passed', value: metrics.passed.toString() },
      { label: 'Failed', value: metrics.failed.toString() },
      { label: 'Skipped', value: metrics.skipped.toString() },
      { label: 'Auth APIs', value: metrics.authAPIs.toString() },
      {
        label: 'Max Response Time',
        value:
          metrics.maxResponseTime > 0 ? `${metrics.maxResponseTime}ms` : 'N/A',
      },
    ];

    summaryData.forEach((item) => {
      doc.text(`${item.label}:`, 20, yPos);
      doc.text(item.value, 100, yPos);
      yPos += 10;
    });

    doc.save(`${collection.name}-test-summary.pdf`);

    toast({
      title: 'PDF Downloaded',
      description: 'Test summary has been downloaded successfully.',
    });
  };

  const handleShare = async () => {
    const summaryText = `
Test Summary: ${collection.name}
Generated: ${new Date().toLocaleString()}

Total: ${metrics.total}
Passed: ${metrics.passed}
Failed: ${metrics.failed}
Skipped: ${metrics.skipped}
Auth APIs: ${metrics.authAPIs}
Max Response Time: ${
      metrics.maxResponseTime > 0 ? `${metrics.maxResponseTime}ms` : 'N/A'
    }
    `.trim();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Test Summary: ${collection.name}`,
          text: summaryText,
        });
        toast({
          title: 'Shared Successfully',
          description: 'Test summary has been shared.',
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(summaryText);
        toast({
          title: 'Copied to Clipboard',
          description: 'Test summary has been copied to your clipboard.',
        });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        toast({
          title: 'Error',
          description: 'Failed to copy summary to clipboard.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className='h-full bg-background'>
      <PanelGroup direction='horizontal'>
        <Panel defaultSize={65} minSize={30}>
          <div className='h-full flex flex-col'>
            <div className='border-b border-border p-3 flex items-center justify-between'>
              <h2 className='text-muted-foreground text-sm'>
                Quick Test :
                <span className='text-lg font-semibold text-foreground ml-1'>
                  {collection.name}
                </span>
              </h2>

              <div className='flex items-center gap-3'>
                <Select
                  value={
                    selectedEnvironment
                      ? JSON.stringify(selectedEnvironment)
                      : 'No Environment'
                  }
                  onValueChange={(value) => {
                    if (value === 'No Environment') {
                      setSelectedEnvironment(null);
                    } else {
                      const envObject = JSON.parse(value);
                      setSelectedEnvironment(envObject);
                    }
                  }}
                >
                  <SelectTrigger className='w-[160px]'>
                    <SelectValue placeholder='Select environment' />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value='No Environment'>
                      No Environment
                    </SelectItem>
                    {environments &&
                      environments.length > 0 &&
                      environments
                        .filter((env) => env.name !== 'No Environment')
                        .map((env) => (
                          <SelectItem key={env.id} value={JSON.stringify(env)}>
                            {env.name}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='p-3 border-b border-border'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground' />
                <Input
                  type='text'
                  placeholder='Search requests by name...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>

            <div className='flex-1 overflow-auto'>
              <div className='p-3'>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={requests.map((r, i) => r.id || `request-${i}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    {filteredRequests.map((request, index) => {
                      const displayIndex = index;

                      return (
                        <SortableRequestItem
                          key={request.id || `request-${displayIndex}`}
                          request={request}
                          index={displayIndex}
                          onToggle={() => {
                            setRequests((prev) =>
                              prev.map((r, i) =>
                                r.id === request.id ||
                                (!r.id && !request.id && i === displayIndex)
                                  ? { ...r, isSelected: !r.isSelected }
                                  : r
                              )
                            );
                          }}
                          getMethodColor={getMethodColor}
                          getStatusBadge={getStatusBadge}
                        />
                      );
                    })}
                  </SortableContext>
                </DndContext>
              </div>
            </div>

            <div className='border-t border-border p-3 flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <button
                  onClick={handleDeselectAll}
                  className='text-sm text-muted-foreground hover:text-foreground'
                >
                  Deselect All
                </button>
                <button
                  onClick={handleSelectAll}
                  className='text-sm text-muted-foreground hover:text-foreground'
                >
                  Select All
                </button>
                <span className='text-muted-foreground'>|</span>
                <button
                  onClick={handleReset}
                  className='text-sm text-muted-foreground hover:text-foreground'
                >
                  Reset
                </button>
              </div>
              <Button
                onClick={handleRunTests}
                disabled={
                  isRunning || requests.filter((r) => r.isSelected).length === 0
                }
              >
                {isRunning ? 'Running...' : `Run ${collection.name}`}
              </Button>
            </div>
          </div>
        </Panel>
        <PanelResizeHandle className='w-1 bg-border hover:bg-primary transition-colors cursor-col-resize' />
        <Panel defaultSize={35} minSize={20}>
          <div className='h-full bg-muted/30 overflow-auto relative'>
            <div className='sticky top-0 bg-background border-b border-border p-4 z-10'>
              <div className='flex items-start justify-between mb-3'>
                <div className='flex-1'>
                  <h3 className='text-lg font-semibold text-foreground'>
                    Test Summary
                  </h3>
                  <p className='text-sm font-medium text-foreground mt-1'>
                    {collection.name}
                  </p>
                  <div className='flex items-center gap-3 mt-2 text-xs text-muted-foreground'>
                    <div className='flex items-center gap-1'>
                      <Globe className='w-3 h-3' />
                      <span>
                        {selectedEnvironment?.name || 'No Environment'}
                      </span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Clock className='w-3 h-3' />
                      <span>
                        {startTime
                          ? startTime.toLocaleString()
                          : new Date().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className='p-2 hover:bg-muted rounded-md'
                >
                  <X className='w-5 h-5' />
                </button>
              </div>

              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleDownloadPDF}
                  disabled={metrics.passed === 0 && metrics.failed === 0}
                  className='flex items-center gap-2'
                >
                  <Download className='w-4 h-4' />
                  Export
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleShare}
                  disabled={metrics.passed === 0 && metrics.failed === 0}
                  className='flex items-center gap-2'
                >
                  <Share2 className='w-4 h-4' />
                  Share
                </Button>
              </div>
            </div>

            <div className='p-4 space-y-6'>
              {/* Stats Cards */}
              <div className='grid grid-cols-2 gap-3'>
                <MetricBadge
                  label='Total Executed'
                  value={metrics.passed + metrics.failed}
                />
                <MetricBadge
                  label='Passed'
                  value={metrics.passed}
                  color='green'
                />
                <MetricBadge
                  label='Failed'
                  value={metrics.failed}
                  color='red'
                />
                <MetricBadge
                  label='Skipped'
                  value={metrics.skipped}
                  color='gray'
                />
              </div>

              {/* Test Distribution */}
              {(metrics.passed > 0 || metrics.failed > 0) && (
                <div>
                  <h3 className='text-sm font-semibold text-foreground mb-3'>
                    Test Distribution
                  </h3>
                  <StatusChart metrics={metrics} />
                </div>
              )}

              {/* Performance Insights */}
              {(metrics.passed > 0 || metrics.failed > 0) && (
                <div>
                  <h3 className='text-sm font-semibold text-foreground mb-3'>
                    Performance Insights
                  </h3>
                  <div className='grid grid-cols-1 gap-3'>
                    <PerformanceCard
                      title='Fastest API'
                      value={metrics.fastestAPI}
                      subtitle={`${metrics.minResponseTime}ms`}
                      variant='fastest'
                    />
                    <PerformanceCard
                      title='Slowest API'
                      value={metrics.slowestAPI}
                      subtitle={`${metrics.maxResponseTime}ms`}
                      variant='slowest'
                    />
                    {metrics.mostFailedStatusCode && (
                      <PerformanceCard
                        title='Most Failed Status'
                        value={metrics.mostFailedStatusCode.code.toString()}
                        subtitle={`${metrics.mostFailedStatusCode.count} times`}
                        variant='failed'
                      />
                    )}
                    <PerformanceCard
                      title='Total Execution Time'
                      value={`${metrics.totalExecutionTime}ms`}
                      variant='time'
                    />
                  </div>
                </div>
              )}

              {/* Smart Insights */}
              {insights.length > 0 && (
                <div>
                  <h3 className='text-sm font-semibold text-foreground mb-3'>
                    Smart Insights
                  </h3>
                  <div className='space-y-3'>
                    {insights.map((insight, index) => (
                      <InsightCard
                        key={index}
                        type={insight.type}
                        message={insight.message}
                        severity={insight.severity}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className='pt-4 text-xs text-muted-foreground text-center border-t border-border'>
                Exported on {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
};

function MetricBadge({
  label,
  value,
  color = 'gray',
}: {
  label: string;
  value: number;
  color?: 'gray' | 'green' | 'red';
}) {
  const colors = {
    gray: 'bg-muted border-border text-foreground',
    green:
      'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
    red: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
  };

  return (
    <div className={`${colors[color]} rounded-lg p-4 border text-center`}>
      <div className='text-xs font-medium opacity-75 mb-1'>{label}</div>
      <div className='text-2xl font-semibold'>{value}</div>
    </div>
  );
}

function StatusChart({ metrics }: { metrics: TestMetrics }) {
  const total = metrics.passed + metrics.failed || 1;
  const passPercent = (metrics.passed / total) * 100;
  const failPercent = (metrics.failed / total) * 100;

  return (
    <div className='space-y-3'>
      <div className='flex gap-1 h-10 rounded-lg overflow-hidden'>
        {passPercent > 0 && (
          <div
            style={{ width: `${passPercent}%` }}
            className='bg-green-500 flex items-center justify-center text-white text-sm font-medium'
          >
            {metrics.passed > 0 && metrics.passed}
          </div>
        )}
        {failPercent > 0 && (
          <div
            style={{ width: `${failPercent}%` }}
            className='bg-red-500 flex items-center justify-center text-white text-sm font-medium'
          >
            {metrics.failed > 0 && metrics.failed}
          </div>
        )}
      </div>

      <div className='flex items-center justify-center gap-4 text-xs'>
        <div className='flex items-center gap-1.5'>
          <div className='w-3 h-3 rounded-sm bg-green-500'></div>
          <span className='text-muted-foreground'>Pass ({metrics.passed})</span>
        </div>
        <div className='flex items-center gap-1.5'>
          <div className='w-3 h-3 rounded-sm bg-red-500'></div>
          <span className='text-muted-foreground'>Fail ({metrics.failed})</span>
        </div>
        {metrics.skipped > 0 && (
          <div className='flex items-center gap-1.5'>
            <div className='w-3 h-3 rounded-sm bg-gray-400'></div>
            <span className='text-muted-foreground'>
              Skip ({metrics.skipped})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
