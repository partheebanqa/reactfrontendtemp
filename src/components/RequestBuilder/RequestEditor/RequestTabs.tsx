'use client';

'use browser';

import type React from 'react';
import { useState } from 'react';
import { X, Plus, FileTerminal } from 'lucide-react';
import type { CollectionRequest } from '@/shared/types/collection';
import { useCollectionStore, collectionActions } from '@/store/collectionStore';
import { useCollection } from '@/hooks/useCollection';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ImportModal from './ImportModal';
import { useToast } from '@/hooks/useToast';

interface RequestTabsProps {
  onTabChange?: (request: CollectionRequest) => void;
  onSaveRequest?: (request: CollectionRequest) => Promise<void>;
  onCurlImport?: (parsedRequest: any) => void;
}

const RequestTabs: React.FC<RequestTabsProps> = ({
  onTabChange,
  onSaveRequest,
  onCurlImport,
}) => {
  const { openedRequests, activeRequest, unsavedChanges } =
    useCollectionStore();
  const { handleCreateRequest, activeCollection } = useCollection();
  const { toast } = useToast();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingCloseRequestId, setPendingCloseRequestId] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const [showCurlImport, setShowCurlImport] = useState(false);

  const handleTabClick = (request: CollectionRequest) => {
    collectionActions.setActiveRequest(request);
    onTabChange?.(request);
  };

  const handleCloseTab = (e: React.MouseEvent, requestId?: string) => {
    e.stopPropagation();

    const request = openedRequests.find((r) => r.id === requestId);

    // If request doesn't exist or has no real database id, just close it
    if (!request || !request.id || request.id.startsWith('temp-')) {
      collectionActions.closeRequest(requestId);
      return;
    }

    const hasUnsavedChanges = unsavedChanges.has(requestId);

    if (hasUnsavedChanges && requestId) {
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

    const request = openedRequests.find((r) => r.id === pendingCloseRequestId);
    if (!request) return;

    // If request has no id, we can't save it - just close it
    if (!request.id) {
      collectionActions.closeRequest(pendingCloseRequestId);
      setShowConfirmDialog(false);
      setPendingCloseRequestId(undefined);
      return;
    }

    setIsSaving(true);
    try {
      if (activeCollection) {
        await onSaveRequest?.(request);
        collectionActions.markSaved(request.id);
      }
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

  const handleCurlImportClick = () => {
    setShowCurlImport(true);
  };

  const handleCurlImportSubmit = (parsedRequest: any) => {
    if (onCurlImport) {
      onCurlImport(parsedRequest);
    }
    setShowCurlImport(false);
    toast({
      title: 'cURL Imported Successfully',
      description: 'Request has been populated from cURL command',
    });
  };

  const methodColor = (method?: string) => {
    switch ((method || '').toUpperCase()) {
      case 'GET':
        return 'text-green-600';
      case 'POST':
        return 'text-yellow-600';
      case 'PUT':
        return 'text-blue-600';
      case 'DELETE':
        return 'text-red-600';
      case 'PATCH':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!openedRequests.length) return null;

  const requestToClose = openedRequests.find(
    (r) => r.id === pendingCloseRequestId
  );

  return (
    <>
      <div className='flex items-center bg-white border-b border-gray-200 px-4 py-0 overflow-x-auto'>
        {openedRequests.map((request) => {
          const isActive = activeRequest?.id === request.id;
          const hasUnsaved = unsavedChanges.has(request.id);

          return (
            <div key={request.id} className='flex items-center'>
              <button
                onClick={() => handleTabClick(request)}
                className={`
                  group relative flex items-center gap-2 px-3 py-2
                  transition-all border-b-2 whitespace-nowrap
                  ${
                    isActive
                      ? 'border-blue-600 bg-white'
                      : 'border-transparent hover:bg-gray-50'
                  }
                `}
              >
                <span
                  className={`text-xs font-semibold ${methodColor(
                    request.method
                  )}`}
                >
                  {(request.method || 'GET').toUpperCase()}
                </span>

                <span
                  className={`text-sm flex items-center gap-1.5 ${
                    isActive ? 'text-blue-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  {request.name || 'Untitled'}
                  {hasUnsaved && (
                    <span className='w-1.5 h-1.5 bg-orange-500 rounded-full'></span>
                  )}
                </span>

                <button
                  onClick={(e) => handleCloseTab(e, request.id)}
                  className='ml-1 p-0.5 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-colors'
                >
                  <X size={14} className='text-gray-500' />
                </button>
              </button>

              {/* Divider */}
              <div className='h-5 w-px bg-gray-200'></div>
            </div>
          );
        })}

        <div className='flex items-center ml-auto gap-1'>
          {activeCollection && (
            <>
              <button
                onClick={() =>
                  activeCollection && handleCreateRequest(activeCollection)
                }
                className='p-2 hover:bg-gray-100 rounded transition-colors'
                title='New Request'
              >
                <Plus size={18} className='text-gray-600' />
              </button>

              <button
                onClick={handleCurlImportClick}
                className='p-2 hover:bg-gray-100 rounded transition-colors'
                title='Import from cURL'
              >
                <FileTerminal size={18} className='text-[#136fb0]' />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmDialog && requestToClose && (
        <AlertDialog open={showConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className='text-base font-semibold'>
                DO YOU WANT TO SAVE?
              </AlertDialogTitle>
              <AlertDialogDescription className='text-sm text-gray-600'>
                This request <b>{requestToClose.name || 'Untitled'}</b> has
                unsaved changes. Save these changes to avoid losing your work.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              {/* Don't Save */}
              <AlertDialogAction
                onClick={handleDontSave}
                disabled={isSaving}
                className='text-gray-900 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
              >
                Don't save
              </AlertDialogAction>

              {/* Cancel */}
              <AlertDialogCancel
                onClick={handleCancelClose}
                disabled={isSaving}
              >
                Cancel
              </AlertDialogCancel>

              {/* Save */}
              <AlertDialogAction
                onClick={handleSaveChanges}
                disabled={isSaving}
                className='bg-orange-500 hover:bg-orange-600 text-white'
              >
                {isSaving ? 'Saving...' : 'Save changes'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* cURL Import Modal */}
      <ImportModal
        isOpen={showCurlImport}
        onClose={() => setShowCurlImport(false)}
        onCurlImport={handleCurlImportSubmit}
      />
    </>
  );
};

export default RequestTabs;
