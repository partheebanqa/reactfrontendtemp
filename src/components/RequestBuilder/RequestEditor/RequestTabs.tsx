'use client';

import type React from 'react';
import { useState } from 'react';
import { X, Plus, FileTerminal } from 'lucide-react';
import type { CollectionRequest } from '@/shared/types/collection';
import { useCollectionStore, collectionActions } from '@/store/collectionStore';
import { useWorkspace } from '@/hooks/useWorkspace';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import CreateCollectionModal from '../CreateCollectionModel/CreateCollectionModel';
import { methodColor } from '@/lib/request-utils';

interface RequestTabsProps {
  onTabChange?: (request: CollectionRequest) => void;
  onSaveRequest?: (request: CollectionRequest) => Promise<void>;
  onCurlImport?: (parsedRequest: any) => void;
  onBeforeTabChange?: () => void;
}

const RequestTabs: React.FC<RequestTabsProps> = ({
  onTabChange,
  onSaveRequest,
  onCurlImport,
  onBeforeTabChange,
}) => {
  const { currentWorkspace } = useWorkspace();
  const { openedRequests, activeRequest, unsavedChanges } =
    useCollectionStore();
  const {
    handleCreateRequest,
    activeCollection,
    setActiveCollection,
    addCollectionMutation,
    collections,
  } = useCollection();
  const { toast } = useToast();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingCloseRequestId, setPendingCloseRequestId] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const [showCurlImport, setShowCurlImport] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);

  const handleTabClick = (request: CollectionRequest) => {
    onBeforeTabChange?.();

    if (request.collectionId) {
      const requestCollection = collections.find(
        (col) => col.id === request.collectionId,
      );
      if (requestCollection) {
        setActiveCollection(requestCollection);
      }
    }

    collectionActions.setActiveRequest(request);
    onTabChange?.(request);
  };

  const handleCloseTab = (
    e: React.MouseEvent,
    requestId: string | undefined,
  ) => {
    e.stopPropagation();
    if (requestId === undefined || requestId === null) return;

    const hasUnsavedChanges = unsavedChanges.has(requestId);

    if (hasUnsavedChanges) {
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

    if (request.id?.startsWith('temp-')) {
      setIsSaving(true);
      try {
        await onSaveRequest?.(request);
      } finally {
        setIsSaving(false);
        setShowConfirmDialog(false);
        setPendingCloseRequestId(undefined);
      }
      return;
    }

    setIsSaving(true);
    try {
      if (activeCollection && request.id) {
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
    onBeforeTabChange?.();
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

  const handleCreateNewRequest = async () => {
    if (!activeCollection && collections.length === 0) {
      setShowCollectionModal(true);
    } else {
      handleCreateRequest(activeCollection || undefined);
    }
  };

  const handleSaveCollection = async (collectionName: string) => {
    try {
      const newCollection = await addCollectionMutation.mutateAsync({
        name: collectionName,
        workspaceId: currentWorkspace?.id || '',
        isImportant: false,
      });
      if (newCollection) {
        await handleCreateRequest(newCollection);
        toast({
          title: 'Collection Created',
          description: 'New collection and request have been created',
        });
        setShowCollectionModal(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create collection',
        variant: 'destructive',
      });
    }
  };

  if (!openedRequests.length) return null;

  const requestToClose = openedRequests.find(
    (r) => r.id === pendingCloseRequestId,
  );

  return (
    <>
      <div className='flex items-center bg-gray-50 border-b border-gray-200 px-4 py-0 overflow-visible'>
        <div className='flex items-center overflow-x-auto scrollbar-thin'>
          {openedRequests.map((request) => {
            const isActive = activeRequest?.id === request.id;
            const hasUnsaved = request.id
              ? unsavedChanges.has(request.id)
              : false;
            return (
              <div key={request.id} className='flex items-center'>
                <button
                  onClick={() => handleTabClick(request)}
                  className={`group relative flex items-center gap-1 px-1 py-1
  transition-all border-b-2 whitespace-nowrap
  ${
    isActive
      ? 'border-blue-600 bg-white -mb-px'
      : 'border-transparent hover:bg-gray-50'
  }`}
                >
                  <span
                    className={`text-xs font-semibold ${methodColor(
                      request.method,
                    )}`}
                  >
                    {(() => {
                      const method = (request.method || 'GET').toUpperCase();
                      if (method === 'DELETE') return 'DEL';
                      return method;
                    })()}
                  </span>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={`text-xs md:text-sm flex items-center gap-1.5 max-w-[130px] truncate ${
                            isActive
                              ? 'text-blue-600 font-medium'
                              : 'text-gray-600'
                          }`}
                        >
                          {request.name
                            ? request.name.slice(0, 15)
                            : 'Untitled'}
                        </span>
                      </TooltipTrigger>
                      {hasUnsaved && (
                        <span className='w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0 relative -top-1.5'></span>
                      )}
                      <TooltipContent side='bottom'>
                        <p className='text-sm'>{request.name || 'Untitled'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => handleCloseTab(e, request.id)}
                          className='relative p-0.5 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-colors'
                        >
                          <X size={14} className='text-gray-500' />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side='bottom'>close</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </button>

                <div className='h-5 w-px bg-gray-200'></div>
              </div>
            );
          })}
        </div>

        <div className='flex items-center gap-1 ml-auto sticky right-0 bg-white py-1 px-2'>
          <button
            onClick={handleCreateNewRequest}
            className='p-2 hover:bg-gray-100 rounded transition-colors'
            title='New Request'
          >
            <Plus
              size={19}
              strokeWidth={2.5}
              className='text-[rgb(19,111,176)]'
            />
          </button>

          <button
            onClick={handleCurlImportClick}
            className='p-2 hover:bg-gray-100 rounded transition-colors'
            title='Import from cURL'
          >
            <FileTerminal size={18} className='text-[#136fb0]' />
          </button>
        </div>
      </div>

      {showConfirmDialog && requestToClose && (
        <AlertDialog open={showConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className='text-base font-medium'>
                Save Changes?
              </AlertDialogTitle>
              <AlertDialogDescription className='text-sm text-gray-600'>
                This request <b>{requestToClose.name || 'Untitled'}</b> has
                unsaved changes. Save these changes to avoid losing your work.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogAction
                onClick={handleDontSave}
                disabled={isSaving}
                className='text-gray-900 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
              >
                Don't save
              </AlertDialogAction>
              <AlertDialogCancel
                onClick={handleCancelClose}
                disabled={isSaving}
              >
                Cancel
              </AlertDialogCancel>

              <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save changes'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {showCollectionModal && (
        <CreateCollectionModal
          handleClose={() => setShowCollectionModal(false)}
          handleSaveCollection={handleSaveCollection}
          selectedCollection={null}
        />
      )}

      <ImportModal
        isOpen={showCurlImport}
        onClose={() => setShowCurlImport(false)}
        onCurlImport={handleCurlImportSubmit}
      />
    </>
  );
};

export default RequestTabs;
