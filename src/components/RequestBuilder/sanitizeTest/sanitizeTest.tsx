'use client';

import type React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
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

interface RequestWithStatus extends CollectionRequest {
  status?: number;
  responseTime?: number;
  isSelected: boolean;
}

interface SanitizeTestRunnerProps {
  collection: Collection;
}

export const SanitizeTestRunner: React.FC<SanitizeTestRunnerProps> = ({
  collection,
}) => {
  console.log(
    '[v0] SanitizeTestRunner mounted with collection:',
    collection.name
  );

  const [requests, setRequests] = useState<RequestWithStatus[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState(
    'No Environment - sd'
  );
  const [isRunning, setIsRunning] = useState(false);

  // Initialize requests from collection
  useEffect(() => {
    console.log('[v0] Initializing requests from collection:', collection.name);
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
    console.log('[v0] Found', allRequests.length, 'requests in collection');

    setRequests(
      allRequests.map((req) => ({
        ...req,
        isSelected: true,
      }))
    );
  }, [collection]);

  const handleClose = () => {
    console.log('[v0] Closing SanitizeTestRunner');
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
        isSelected: true,
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
    // TODO: Implement actual test running logic
    // This would call the API for each selected request
    setTimeout(() => {
      setIsRunning(false);
    }, 2000);
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

  const getStatusBadge = (status?: number, responseTime?: number) => {
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
    const maxPayloadSize = 0; // TODO: Calculate from responses

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
    <div className='fixed inset-0 bg-white dark:bg-gray-900 z-50 flex'>
      {/* Main content area */}
      <div className='flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700'>
        {/* Header */}
        <div className='border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
              {collection.name}{' '}
              <span className='text-gray-500 text-sm'>(collection name)</span>
            </h2>
            <Select
              value={selectedEnvironment}
              onValueChange={setSelectedEnvironment}
            >
              <SelectTrigger className='w-[250px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='No Environment - sd'>
                  No Environment - sd
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <button
            onClick={handleClose}
            className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Request list */}
        <div className='flex-1 overflow-auto'>
          <div className='p-4'>
            {requests.map((request, index) => (
              <div
                key={request.id || index}
                className='flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              >
                <span className='text-sm text-gray-500 w-8'>{index + 1}</span>
                <input
                  type='checkbox'
                  checked={request.isSelected}
                  onChange={() => handleToggleRequest(index)}
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
                {getStatusBadge(request.status, request.responseTime)}
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
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
            className='bg-blue-600 hover:bg-blue-700 text-white px-6'
          >
            {isRunning ? 'Running...' : 'Run optra'}
          </Button>
        </div>
      </div>

      {/* Summary panel */}
      <div className='w-80 bg-gray-50 dark:bg-gray-800 p-6'>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-6'>
          Quick sanity summary for({collection.name})
        </h3>
        <div className='space-y-4'>
          <div>
            <div className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
              Total :
            </div>
            <div className='text-2xl font-semibold text-gray-900 dark:text-white'>
              {summary.total}
            </div>
          </div>
          <div>
            <div className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
              Pass:
            </div>
            <div className='text-2xl font-semibold text-green-600'>
              {summary.pass}
            </div>
          </div>
          <div>
            <div className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
              Fail:
            </div>
            <div className='text-2xl font-semibold text-red-600'>
              {summary.fail}
            </div>
          </div>
          <div>
            <div className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
              Skipped:
            </div>
            <div className='text-2xl font-semibold text-gray-900 dark:text-white'>
              {summary.skipped}
            </div>
          </div>
          <div className='pt-4 border-t border-gray-200 dark:border-gray-700'>
            <div className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
              Auth api's
            </div>
            <div className='text-lg font-medium text-gray-900 dark:text-white'>
              {summary.authApis}
            </div>
          </div>
          <div>
            <div className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
              Max response time :
            </div>
            <div className='text-lg font-medium text-gray-900 dark:text-white'>
              {summary.maxResponseTime > 0
                ? `${summary.maxResponseTime}ms`
                : '-'}
            </div>
          </div>
          <div>
            <div className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
              Max payload size:
            </div>
            <div className='text-lg font-medium text-gray-900 dark:text-white'>
              {summary.maxPayloadSize > 0 ? `${summary.maxPayloadSize}KB` : '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
