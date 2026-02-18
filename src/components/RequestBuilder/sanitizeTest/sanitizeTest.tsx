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
  FileJson,
  FileText,
  Table,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
import {
  extractDataFromResponse,
  isBearerToken,
  shouldRefreshExtractedVariables,
} from '@/lib/request-utils';

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
  preRequestId?: string;
}

interface SortableRequestItemProps {
  request: RequestWithStatus;
  index: number;
  onToggle: () => void;
  getMethodColor: (method: string) => string;
  getStatusBadge: (
    status?: number,
    responseTime?: number,
    isLoading?: boolean,
  ) => React.ReactNode;
  isAuthRequest?: boolean;
}

const SortableRequestItem: React.FC<SortableRequestItemProps> = ({
  request,
  index,
  onToggle,
  getMethodColor,
  getStatusBadge,
  isAuthRequest = false,
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
      className={`flex items-center gap-3 py-2 border-b border-border hover:bg-muted/50 ${
        isAuthRequest
          ? 'bg-emerald-50 dark:bg-emerald-900/10 border-l-2 border-l-emerald-500'
          : ''
      }`}
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
        className='w-4 h-4 rounded border-border'
      />
      <span
        className={`py-1 text-xs font-semibold rounded ${getMethodColor(
          request.method,
        )}`}
      >
        {request.method}
      </span>
      <span className='flex-1 text-sm text-foreground'>{request.name}</span>

      {/* Status badge and response time */}
      <div className='flex items-center gap-2'>
        {getStatusBadge(
          request.status,
          request.responseTime,
          request.isLoading,
        )}

        {/* Token Source badge - shown on the right */}
        {isAuthRequest && (
          <span className='mr-2 inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded text-[10px] font-bold text-yellow-800 dark:text-yellow-400 whitespace-nowrap uppercase'>
            Token Source
          </span>
        )}
      </div>
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
  collections?: any[];
}

// Export Modal Component
interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Collection;
  metrics: TestMetrics;
  testResults: TestResult[];
}

type Format = 'pdf' | 'json' | 'csv';

function ExportModal({
  isOpen,
  onClose,
  collection,
  metrics,
  testResults,
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<Format>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [includeResults, setIncludeResults] = useState(true);
  const [includeInsights, setIncludeInsights] = useState(true);

  const formats = [
    {
      id: 'pdf' as const,
      label: 'PDF Report',
      icon: FileText,
      description: 'Professional PDF with charts',
    },
    {
      id: 'json' as const,
      label: 'JSON Data',
      icon: FileJson,
      description: 'Structured data export',
    },
    {
      id: 'csv' as const,
      label: 'CSV File',
      icon: Table,
      description: 'Spreadsheet compatible',
    },
  ];

  const exportJSON = () => {
    const data = {
      collection: {
        name: collection.name,
        exportedAt: new Date().toISOString(),
      },
      metrics: includeMetrics ? metrics : undefined,
      results: includeResults
        ? testResults.map((r) => ({
            id: r.id,
            name: r.name,
            method: r.method,
            status: r.status,
            statusCode: r.statusCode,
            responseTime: r.responseTime,
            timestamp: r.timestamp,
          }))
        : undefined,
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${collection.name}_test_report_${
      new Date().toISOString().split('T')[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const rows = [
      ['Test Report Summary'],
      ['Collection', collection.name],
      ['Exported At', new Date().toISOString()],
      [],
      ['Metrics'],
      ['Total Tests', metrics.total],
      ['Passed', metrics.passed],
      ['Failed', metrics.failed],
      ['Skipped', metrics.skipped],
      ['Auth APIs', metrics.authAPIs],
      ['Max Response Time (ms)', metrics.maxResponseTime],
      ['Min Response Time (ms)', metrics.minResponseTime],
      ['Slowest API', metrics.slowestAPI],
      ['Fastest API', metrics.fastestAPI],
      ['Total Execution Time (ms)', metrics.totalExecutionTime],
      [],
      ['Test Results'],
      [
        'ID',
        'Name',
        'Method',
        'Status',
        'Status Code',
        'Response Time (ms)',
        'Timestamp',
      ],
      ...testResults.map((r) => [
        r.id,
        r.name,
        r.method,
        r.status,
        r.statusCode || '',
        r.responseTime || '',
        r.timestamp || '',
      ]),
    ];

    const csvContent = rows
      .map((row) =>
        row
          .map((cell) => {
            const cellStr = String(cell);
            if (
              cellStr.includes(',') ||
              cellStr.includes('"') ||
              cellStr.includes('\n')
            ) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          })
          .join(','),
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${collection.name}_test_report_${
      new Date().toISOString().split('T')[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPDF = async (
    collection: Collection,
    results: TestResult[],
    metrics: TestMetrics,
    elementId: string,
  ) => {
    try {
      const element = document.getElementById(elementId);
      if (!element) throw new Error('Element not found');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgData = canvas.toDataURL('image/png');

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(
        `${collection.name}_test_report_${
          new Date().toISOString().split('T')[0]
        }.pdf`,
      );
    } catch (error) {
      console.error('PDF export failed:', error);
      throw error;
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      switch (selectedFormat) {
        case 'pdf':
          await exportPDF(collection, testResults, metrics, 'summary-content');
          break;
        case 'json':
          exportJSON();
          break;
        case 'csv':
          exportCSV();
          break;
      }
      setTimeout(() => {
        setIsExporting(false);
        onClose();
        toast({
          title: 'Export Successful',
          description: `Test report exported as ${selectedFormat.toUpperCase()}`,
        });
      }, 1000);
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
      toast({
        title: 'Export Failed',
        description: 'An error occurred while exporting the report',
        variant: 'destructive',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full'>
        <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
            Export Test Report
          </h2>
          <button
            onClick={onClose}
            disabled={isExporting}
            className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
          >
            <X size={20} className='text-gray-500' />
          </button>
        </div>

        <div className='p-6 space-y-6'>
          <div>
            <label className='text-sm font-semibold text-gray-900 dark:text-white mb-3 block'>
              Export Format
            </label>
            <div className='space-y-2'>
              {formats.map(({ id, label, icon: Icon, description }) => (
                <button
                  key={id}
                  onClick={() => setSelectedFormat(id)}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                    selectedFormat === id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon
                    size={20}
                    className={
                      selectedFormat === id ? 'text-blue-600' : 'text-gray-400'
                    }
                  />
                  <div className='text-left'>
                    <div className='font-medium text-gray-900 dark:text-white'>
                      {label}
                    </div>
                    <div className='text-xs text-gray-500 dark:text-gray-400'>
                      {description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className='text-sm font-semibold text-gray-900 dark:text-white mb-3 block'>
              Include in Export
            </label>
            <div className='space-y-2'>
              <label className='flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={includeMetrics}
                  onChange={(e) => setIncludeMetrics(e.target.checked)}
                  className='w-4 h-4 rounded border-gray-300 text-blue-500 cursor-pointer'
                />
                <span className='text-sm text-gray-700 dark:text-gray-300'>
                  Performance Metrics
                </span>
              </label>
              <label className='flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={includeResults}
                  onChange={(e) => setIncludeResults(e.target.checked)}
                  className='w-4 h-4 rounded border-gray-300 text-blue-500 cursor-pointer'
                />
                <span className='text-sm text-gray-700 dark:text-gray-300'>
                  Test Results
                </span>
              </label>
              <label className='flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={includeInsights}
                  onChange={(e) => setIncludeInsights(e.target.checked)}
                  className='w-4 h-4 rounded border-gray-300 text-blue-500 cursor-pointer'
                />
                <span className='text-sm text-gray-700 dark:text-gray-300'>
                  Smart Insights
                </span>
              </label>
            </div>
          </div>

          <div className='flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700'>
            <button
              onClick={onClose}
              disabled={isExporting}
              className='flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className='flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2'
            >
              {isExporting ? (
                <>
                  <Loader2 size={16} className='animate-spin' />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const SanitizeTestRunner: React.FC<SanitizeTestRunnerProps> = ({
  collection,
  workspaceId,
  environments = [],
  activeEnvironment,
  collections = [],
}) => {
  const { currentWorkspace } = useWorkspace();
  const [requests, setRequests] = useState<RequestWithStatus[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [authRequestName, setAuthRequestName] = useState<string | null>(null);
  const [isAuthRunning, setIsAuthRunning] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) {
      return requests;
    }
    return requests.filter((req) =>
      req.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [requests, searchQuery]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setRequests((items) => {
        const oldIndex = items.findIndex(
          (item) => (item.id || `request-${items.indexOf(item)}`) === active.id,
        );
        const newIndex = items.findIndex(
          (item) => (item.id || `request-${items.indexOf(item)}`) === over.id,
        );

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  useEffect(() => {
    const getAllRequests = (
      requests: CollectionRequest[] = [],
      folders: any[] = [],
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
      (collection as any).folders || [],
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
      })),
    );

    setSearchQuery('');
  }, [collection.id, collection.requests, collection.folders]);

  useEffect(() => {
    if (collection.preRequestId) {
      autoRunPreRequest();
    }
  }, [collection.id, collection.preRequestId]);

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
      })),
    );
    setStartTime(null);
  };

  const autoRunPreRequest = async () => {
    if (!collection.preRequestId) return;

    // Find the pre-request in collection
    const findRequest = (requestId: string): any => {
      const top = (collection.requests || []).find(
        (r: any) => r.id === requestId,
      );
      if (top) return top;
      const searchFolders = (folders: any[] = []): any => {
        for (const folder of folders) {
          const found = (folder.requests || []).find(
            (r: any) => r.id === requestId,
          );
          if (found) return found;
          if (folder.folders) {
            const deep = searchFolders(folder.folders);
            if (deep) return deep;
          }
        }
        return null;
      };
      return searchFolders((collection as any).folders || []);
    };

    const preRequest = findRequest(collection.preRequestId);
    if (!preRequest) return;

    setAuthRequestName(preRequest.name);

    // Check if already valid
    const storageKeys = Object.keys(localStorage).filter((key) =>
      key.startsWith(`extracted_var_${collection.id}_`),
    );
    let hasValidToken = false;
    for (const key of storageKeys) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        if (data.value && isBearerToken(data.value)) {
          hasValidToken = true;
          break;
        }
      } catch {}
    }

    if (
      hasValidToken &&
      !shouldRefreshExtractedVariables(collection.id, collection.preRequestId)
    ) {
      return;
    }

    setIsAuthRunning(true);

    try {
      const payload = {
        request: {
          workspaceId: currentWorkspace?.id || '',
          name: preRequest.name,
          order: 0,
          method: preRequest.method,
          url: preRequest.url,
          bodyType: preRequest.bodyType || 'raw',
          bodyFormData: preRequest.bodyFormData || null,
          bodyRawContent: preRequest.bodyRawContent || '',
          authorizationType: preRequest.authorizationType || 'none',
          headers: preRequest.headers || [],
          params: preRequest.params || [],
        },
        assertions: [],
      };

      const response = await executeRequest(payload);

      if (preRequest.extractVariables?.length > 0) {
        let rawBody =
          response?.data?.responses?.[0]?.body ||
          response?.data?.body ||
          response?.body;

        let responseBody;
        try {
          responseBody =
            typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
        } catch {
          setIsAuthRunning(false);
          return;
        }

        const extractedVariables = extractDataFromResponse(
          {
            body: responseBody,
            headers: response?.data?.responses?.[0]?.headers || {},
            cookies: response?.data?.responses?.[0]?.cookies || {},
          },
          preRequest.extractVariables,
        );

        Object.entries(extractedVariables).forEach(([varName, value]) => {
          if (value !== undefined && value !== null) {
            const storageKey = `extracted_var_${collection.id}_${varName}`;
            localStorage.setItem(
              storageKey,
              JSON.stringify({
                name: varName,
                value: String(value),
                timestamp: Date.now(),
                collectionId: collection.id,
                source: 'response_body',
                requestName: preRequest.name || '',
                requestId: preRequest.id || '',
              }),
            );
            collectionActions.setExtractedVariable(
              collection.id,
              varName,
              String(value),
            );
          }
        });

        const executionKey = `preRequest_executed_${collection.id}_${collection.preRequestId}`;
        localStorage.setItem(executionKey, Date.now().toString());
      }
    } catch (err) {
      console.error('Auto auth failed in quick test:', err);
    } finally {
      setIsAuthRunning(false);
    }
  };

  const handleRunTests = async () => {
    setIsRunning(true);
    setStartTime(new Date());

    const selectedRequests = requests.filter(
      (r) => r.isSelected && r.id !== collection.preRequestId,
    );
    try {
      for (const req of selectedRequests) {
        setRequests((prev) =>
          prev.map((r) => (r.id === req.id ? { ...r, isLoading: true } : r)),
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
              env.baseUrl,
            );
          } catch {
            finalUrl = req.url;
          }
        }

        let authHeaders = [...(req.headers || [])];
        let authorizationConfig = req.authorization || {
          addTo: 'header',
          key: '',
          password: '',
          token: '',
          username: '',
          value: '',
        };
        let authType = req.authorizationType || 'none';

        if (collection.preRequestId) {
          const storageKeys = Object.keys(localStorage).filter((key) =>
            key.startsWith(`extracted_var_${collection.id}_`),
          );

          let extractedToken: string | null = null;
          for (const key of storageKeys) {
            try {
              const data = JSON.parse(localStorage.getItem(key) || '{}');
              if (data.value && isBearerToken(data.value)) {
                extractedToken = data.value;
                break;
              }
            } catch {}
          }

          if (extractedToken) {
            authType = 'bearer';

            authorizationConfig = {
              ...authorizationConfig,
              token: extractedToken,
            };

            const authHeaderExists = authHeaders.some(
              (h) => h.key.toLowerCase() === 'authorization',
            );

            if (authHeaderExists) {
              authHeaders = authHeaders.map((h) =>
                h.key.toLowerCase() === 'authorization'
                  ? { ...h, value: `Bearer ${extractedToken}`, enabled: true }
                  : h,
              );
            } else {
              authHeaders.push({
                key: 'Authorization',
                value: `Bearer ${extractedToken}`,
                enabled: true,
                description: 'Auto-injected from pre-request',
              });
            }
          }
        }

        const payload = {
          request: {
            workspaceId: currentWorkspace?.id,
            name: req.name,
            method: req.method,
            url: finalUrl,
            bodyType: req.bodyType,
            bodyRawContent: req.bodyRawContent || '',
            bodyFormData: req.bodyFormData || [],
            authorizationType: authType, // Use modified auth type
            authorization: authorizationConfig, // Use modified authorization with token
            headers: authHeaders, // Use modified headers with injected token
            params: req.params || [],
          },
          environmentId: selectedEnvironment?.id ?? null,
        };

        const requestPayloadSizeKB = (
          new Blob([JSON.stringify(payload)]).size / 1024
        ).toFixed(2);

        try {
          const result = await executeRequest(payload);
          const endTime = Date.now();

          const responseStatus = result?.data?.responses?.[0]?.statusCode ?? 0;
          const responseTime = endTime - startTime;

          const responsePayloadBytes =
            result?.data?.responses?.[0]?.metrics?.bytesReceived ?? 0;
          const responsePayloadSizeKB = (responsePayloadBytes / 1024).toFixed(
            2,
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
                : r,
            ),
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
                : r,
            ),
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
      POST: 'text-blue-600',
      PUT: 'text-orange-600',
      DELETE: 'text-red-600',
      PATCH: 'text-purple-600',
      HEAD: 'text-gray-600',
      OPTIONS: 'text-indigo-600',
    };
    return colors[method as keyof typeof colors] || 'text-gray-600';
  };

  const getStatusBadge = (
    status?: number,
    responseTime?: number,
    isLoading?: boolean,
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
      (r) => r.status && r.status >= 200 && r.status < 300,
    ).length;
    const fail = executedRequests.filter(
      (r) => r.status && r.status >= 400,
    ).length;
    const skipped = requests.filter((r) => !r.isSelected).length;
    const authApis = requests.filter(
      (r) => r.authorizationType !== 'none',
    ).length;

    const responseTimes = executedRequests
      .map((r) => r.responseTime || 0)
      .filter((t) => t > 0);

    const maxResponseTime =
      responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
    const minResponseTime =
      responseTimes.length > 0 ? Math.min(...responseTimes) : 0;

    const slowest = executedRequests.find(
      (r) => r.responseTime === maxResponseTime,
    );
    const fastest = executedRequests.find(
      (r) => r.responseTime === minResponseTime,
    );

    // Calculate most failed status code
    const failedRequests = executedRequests.filter(
      (r) => r.status && r.status >= 400,
    );
    const statusCodeCounts = failedRequests.reduce(
      (acc, r) => {
        if (r.status) {
          acc[r.status] = (acc[r.status] || 0) + 1;
        }
        return acc;
      },
      {} as Record<number, number>,
    );

    const mostFailedEntry = Object.entries(statusCodeCounts).sort(
      ([, a], [, b]) => b - a,
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
              <h2 className='text-muted-foreground text-sm flex items-center gap-2'>
                Quick Test :
                <span className='text-lg font-semibold text-foreground ml-1'>
                  {collection.name}
                </span>
                <span className='text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full'>
                  {isRunning
                    ? `${requests.filter((r) => r.status !== undefined && r.isSelected).length}/${requests.filter((r) => r.isSelected).length} running`
                    : `${requests.filter((r) => r.isSelected).length}/${requests.length} selected`}
                </span>
              </h2>

              <div className='flex items-center gap-3'>
                {/* Auth Status Badge */}
                {collection.preRequestId ? (
                  authRequestName ? (
                    <div className='flex items-center gap-1.5 text-green-600 text-sm font-medium'>
                      <div className='flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg w-fit mx-auto whitespace-nowrap'>
                        <CheckCircle className='w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0' />

                        <span className='text-xs font-semibold text-emerald-700 dark:text-emerald-400'>
                          Auto Auth Enabled -
                        </span>

                        <span className='text-xs text-gray-500 dark:text-gray-400'>
                          {authRequestName.length > 15
                            ? authRequestName.slice(0, 15) + '…'
                            : authRequestName}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className='flex items-center gap-1.5 text-blue-500 text-sm font-medium'>
                      <svg
                        className='w-4 h-4 animate-spin'
                        fill='none'
                        viewBox='0 0 24 24'
                      >
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                        />
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8v8z'
                        />
                      </svg>
                      Setting up auth...
                    </div>
                  )
                ) : (
                  <button
                    onClick={() => {
                      toast({
                        title: 'No Auto-Auth Request',
                        description:
                          'Please create an Auto-Auth request in your collection',
                        variant: 'destructive',
                      });
                      handleClose();
                    }}
                    className='flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer whitespace-nowrap'
                  >
                    <svg
                      className='w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z'
                      />
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'
                      />
                    </svg>
                    <span className='text-xs font-semibold text-blue-700 dark:text-blue-400'>
                      Setup Auto Auth
                    </span>
                  </button>
                )}
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
                      setSelectedEnvironment(JSON.parse(value));
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
            {!collection.preRequestId && (
              <div className='p-3 border-b border-border'>
                <div className='p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex gap-3 items-start'>
                  <AlertCircle className='w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5' />
                  <p className='text-gray-700 dark:text-gray-300 text-sm text-left'>
                    Without authentication, The APIs might return 401 consider
                    adding authentication API.
                  </p>
                </div>
              </div>
            )}
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

            <div className='flex-1 overflow-auto scrollbar-thin'>
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
                                  : r,
                              ),
                            );
                          }}
                          getMethodColor={getMethodColor}
                          getStatusBadge={getStatusBadge}
                          isAuthRequest={
                            !!collection.preRequestId &&
                            request.id === collection.preRequestId
                          }
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
          <div className='h-full bg-muted/30 overflow-auto scrollbar-thin relative'>
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
                  onClick={() => setIsExportModalOpen(true)}
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

            <div id='summary-content' className='p-4 space-y-6'>
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

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        collection={collection}
        metrics={metrics}
        testResults={testResults}
      />
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
