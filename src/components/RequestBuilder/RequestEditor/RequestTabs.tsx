'use client';

import type React from 'react';
import { useState } from 'react';
import { X } from 'lucide-react';
import type { CollectionRequest } from '@/shared/types/collection';
import { useCollectionStore, collectionActions } from '@/store/collectionStore';

interface RequestTabsProps {
  onTabChange?: (request: CollectionRequest) => void;
  onSaveRequest?: (request: CollectionRequest) => Promise<void>;
}

const RequestTabs: React.FC<RequestTabsProps> = ({
  onTabChange,
  onSaveRequest,
}) => {
  const { openedRequests, activeRequest, unsavedChanges } =
    useCollectionStore();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingCloseRequestId, setPendingCloseRequestId] = useState<
    string | undefined
  >(undefined);
  const [alwaysDiscard, setAlwaysDiscard] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleTabClick = (request: CollectionRequest) => {
    collectionActions.setActiveRequest(request);
    onTabChange?.(request);
  };

  const handleCloseTab = (
    e: React.MouseEvent,
    requestId: string | undefined
  ) => {
    e.stopPropagation();
    if (!requestId) return;

    const hasUnsavedChanges = unsavedChanges.has(requestId);

    if (hasUnsavedChanges && !alwaysDiscard) {
      setPendingCloseRequestId(requestId);
      setShowConfirmDialog(true);
    } else {
      collectionActions.closeRequest(requestId);
    }
  };

  const handleDontSave = () => {
    if (pendingCloseRequestId) {
      collectionActions.closeRequest(pendingCloseRequestId);
    }
    setShowConfirmDialog(false);
    setPendingCloseRequestId(undefined);
  };

  const handleSaveChanges = async () => {
    if (!pendingCloseRequestId) return;

    const requestToSave = openedRequests.find(
      (r) => r.id === pendingCloseRequestId
    );
    if (!requestToSave) return;

    setIsSaving(true);
    try {
      if (onSaveRequest) {
        await onSaveRequest(requestToSave);
      }
      collectionActions.markSaved(pendingCloseRequestId);
    } catch (error) {
      console.error('Failed to save request:', error);
    } finally {
      setIsSaving(false);
      setShowConfirmDialog(false);
      setPendingCloseRequestId(undefined);
    }
  };

  const handleCancelClose = () => {
    setShowConfirmDialog(false);
    setPendingCloseRequestId(undefined);
  };

  if (openedRequests.length === 0) {
    return null;
  }

  const requestToClose = openedRequests.find(
    (r) => r.id === pendingCloseRequestId
  );

  return (
    <>
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

      {showConfirmDialog && requestToClose && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-base font-semibold text-gray-900 dark:text-white'>
                DO YOU WANT TO SAVE?
              </h2>
              <button
                onClick={handleCancelClose}
                className='p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors'
                aria-label='Close dialog'
              >
                <X className='w-4 h-4 text-gray-500 dark:text-gray-400' />
              </button>
            </div>

            <p className='text-sm text-gray-600 dark:text-gray-400 mb-4'>
              This tab{' '}
              <span className='font-semibold'>{requestToClose.name}</span> has
              unsaved changes which will be lost if you choose to close it. Save
              these changes to avoid losing your work.
            </p>

            <div className='mb-6 flex items-start gap-3'>
              <input
                type='checkbox'
                id='always-discard'
                checked={alwaysDiscard}
                onChange={(e) => setAlwaysDiscard(e.target.checked)}
                className='mt-1 w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer'
              />
              <div className='flex-1'>
                <label
                  htmlFor='always-discard'
                  className='text-sm font-medium text-gray-900 dark:text-white cursor-pointer'
                >
                  Always discard unsaved changes when closing a tab
                </label>
                <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                  You'll no longer be prompted to save changes when closing a
                  tab. You can change this anytime from your Settings.
                </p>
              </div>
            </div>

            <div className='flex justify-end gap-3'>
              <button
                onClick={handleDontSave}
                disabled={isSaving}
                className='px-4 py-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm'
              >
                Don't save
              </button>
              <button
                onClick={handleCancelClose}
                disabled={isSaving}
                className='px-4 py-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm'
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm'
              >
                {isSaving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RequestTabs;
