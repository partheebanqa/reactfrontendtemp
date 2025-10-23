'use client';

import type React from 'react';
import { X } from 'lucide-react';
import type { CollectionRequest } from '@/shared/types/collection';
import { useCollectionStore, collectionActions } from '@/store/collectionStore';

interface RequestTabsProps {
  onTabChange?: (request: CollectionRequest) => void;
}

const RequestTabs: React.FC<RequestTabsProps> = ({ onTabChange }) => {
  console.log('onTabChange123:');

  const { openedRequests, activeRequest, unsavedChanges } =
    useCollectionStore();

  const handleTabClick = (request: CollectionRequest) => {
    collectionActions.setActiveRequest(request);
    onTabChange?.(request);
  };

  const handleCloseTab = (
    e: React.MouseEvent,
    requestId: string | undefined
  ) => {
    e.stopPropagation();
    if (requestId) {
      collectionActions.closeRequest(requestId);
    }
  };

  if (openedRequests.length === 0) {
    return null;
  }

  return (
    <div className='border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-x-auto'>
      <div className='flex items-center gap-1 px-2 py-0'>
        {openedRequests.map((request) => {
          const isActive = activeRequest?.id === request.id;
          const hasUnsavedChanges = unsavedChanges.has(request.id || '');

          return (
            <div
              key={request.id}
              onClick={() => handleTabClick(request)}
              className={`
                flex items-center gap-2 px-3 py-2 cursor-pointer
                border-b-2 transition-all duration-200 whitespace-nowrap
                ${
                  isActive
                    ? 'border-red-500 bg-gray-50 dark:bg-gray-800'
                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                }
              `}
            >
              {hasUnsavedChanges && (
                <div className='w-2 h-2 rounded-full bg-red-500 flex-shrink-0' />
              )}

              <span className='text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]'>
                {request.name || 'Untitled'}
              </span>

              <button
                onClick={(e) => handleCloseTab(e, request.id)}
                className='p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0'
                aria-label='Close tab'
              >
                <X className='w-3 h-3 text-gray-500 dark:text-gray-400' />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RequestTabs;
