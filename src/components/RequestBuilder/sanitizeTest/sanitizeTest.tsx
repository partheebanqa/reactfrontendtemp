'use client';

import type React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Loader2, X } from 'lucide-react';
import { collectionActions } from '@/store/collectionStore';
import type { Collection, CollectionRequest } from '@/shared/types/collection';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDataManagement } from '@/hooks/useDataManagement';
import { executeRequest } from '@/services/executeRequest.service';
import { useWorkspace } from '@/hooks/useWorkspace';
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
import { CSS } from '@dnd-kit/utilities';

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
      className='flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
    >
      <button
        className='cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors'
        {...attributes}
        {...listeners}
      >
        <GripVertical className='w-4 h-4 text-gray-400' />
      </button>
      <span className='text-sm text-gray-500 w-2'>{index + 1}</span>
      <input
        type='checkbox'
        checked={request.isSelected}
        onChange={onToggle}
        className='w-4 h-4 rounded border-gray-300'
      />
      <span
        className={`px-2 py-1 text-xs font-semibold rounded ${getMethodColor(
          request.method
        )}`}
      >
        {request.method}
      </span>
      <span className='flex-1 text-sm text-gray-900 dark:text-white'>
        {request.name}
      </span>
      {request.authorizationType !== 'none' && (
        <span className='text-xs text-gray-500'>Auth</span>
      )}
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
}

export const SanitizeTestRunner: React.FC<SanitizeTestRunnerProps> = ({
  collection,
}) => {
  const [requests, setRequests] = useState<RequestWithStatus[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const { activeEnvironment, environments } = useDataManagement();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    // Reset everything when collection changes
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

    // Always create fresh request objects with reset state
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
  }, [collection]);

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
  };

  const handleToggleRequest = (index: number) => {
    setRequests((prev) =>
      prev.map((req, i) =>
        i === index ? { ...req, isSelected: !req.isSelected } : req
      )
    );
  };

  const handleRunTests = async () => {
    setIsRunning(true);

    const selectedRequests = requests.filter((r) => r.isSelected);

    try {
      // Execute requests sequentially using for...of loop
      for (const req of selectedRequests) {
        // Set loading state for current request
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
            workspaceId: workspaceId,
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
      GET: 'text-green-600 bg-green-100',
      POST: 'text-orange-600 bg-orange-100',
      PUT: 'text-blue-600 bg-blue-100',
      DELETE: 'text-red-600 bg-red-100',
      PATCH: 'text-purple-600 bg-purple-100',
      HEAD: 'text-gray-600 bg-gray-100',
      OPTIONS: 'text-gray-600 bg-gray-100',
    };
    return colors[method as keyof typeof colors] || 'text-gray-600 bg-gray-100';
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
          <span className='text-sm text-gray-600'>Loading...</span>
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
            <span className='px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full font-medium'>
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
            <span className='px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium'>
              {status}
            </span>
          </div>
        )}
        {responseTime && (
          <span className='text-sm text-gray-600'>{responseTime}ms</span>
        )}
      </div>
    );
  };

  const summary = useMemo(() => {
    const total = requests.length;
    const pass = requests.filter(
      (r) => r.status && r.status >= 200 && r.status < 300
    ).length;
    const fail = requests.filter((r) => r.status && r.status >= 400).length;
    const skipped = requests.filter((r) => !r.isSelected).length;
    const authApis = requests.filter(
      (r) => r.authorizationType !== 'none'
    ).length;
    const maxResponseTime = Math.max(
      ...requests.map((r) => r.responseTime || 0),
      0
    );

    const maxPayloadSize = Math.max(
      ...requests.map((r) => Number(r.responsePayloadSizeKB) || 0),
      0
    );

    return {
      total,
      pass,
      fail,
      skipped,
      authApis,
      maxResponseTime,
      maxPayloadSize,
    };
  }, [requests]);

  return (
    <div className='h-full bg-white dark:bg-gray-900 flex'>
      <div className='flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700'>
        <div className='border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between'>
          <h2 className='text-gray-500 text-sm'>
            Quick sanity :
            <span className='text-lg font-semibold text-gray-900 dark:text-white ml-1'>
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
              <SelectTrigger className='w-[220px]'>
                <SelectValue placeholder='Select environment' />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value='No Environment'>No Environment</SelectItem>
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

            <button
              onClick={handleClose}
              className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md'
            >
              <X className='w-5 h-5' />
            </button>
          </div>
        </div>

        <div className='flex-1 overflow-auto'>
          <div className='p-4'>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={requests.map((r, i) => r.id || `request-${i}`)}
                strategy={verticalListSortingStrategy}
              >
                {requests.map((request, index) => (
                  <SortableRequestItem
                    key={request.id || `request-${index}`}
                    request={request}
                    index={index}
                    onToggle={() => handleToggleRequest(index)}
                    getMethodColor={getMethodColor}
                    getStatusBadge={getStatusBadge}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        <div className='border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <button
              onClick={handleDeselectAll}
              className='text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            >
              Deselect All
            </button>
            <button
              onClick={handleSelectAll}
              className='text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            >
              Select All
            </button>
            <span className='text-gray-300'>|</span>
            <button
              onClick={handleReset}
              className='text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
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

      <div className='w-80 bg-gray-50 dark:bg-gray-800 p-6'>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-6'>
          Quick sanity summary for ({collection.name})
        </h3>

        <div className='space-y-4'>
          <div className='flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1'>
            Total:
            <span className='ml-1 font-semibold text-gray-900 dark:text-white'>
              {summary.total}
            </span>
          </div>

          <div className='flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1'>
            Pass:
            <span className='ml-1 font-semibold text-green-600 text-base'>
              {summary.pass}
            </span>
          </div>

          <div className='flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1'>
            Fail:
            <span className='ml-1 font-semibold text-red-600 text-base'>
              {summary.fail}
            </span>
          </div>

          <div className='flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1'>
            Skipped:
            <span className='ml-1 font-semibold text-gray-900 dark:text-white text-base'>
              {summary.skipped}
            </span>
          </div>

          <div className='pt-4 border-t border-gray-200 dark:border-gray-700'>
            <div className='flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1'>
              Auth API's:
              <span className='ml-1 font-medium text-gray-900 dark:text-white text-base'>
                {summary.authApis}
              </span>
            </div>
          </div>

          <div className='flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1'>
            Max response time:
            <span className='ml-1 font-medium text-gray-900 dark:text-white text-base'>
              {summary.maxResponseTime > 0
                ? `${summary.maxResponseTime}ms`
                : '-'}
            </span>
          </div>

          <div className='flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1'>
            Max payload size:
            <span className='ml-1 font-medium text-gray-900 dark:text-white text-base'>
              {summary.maxPayloadSize > 0 ? `${summary.maxPayloadSize}KB` : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
