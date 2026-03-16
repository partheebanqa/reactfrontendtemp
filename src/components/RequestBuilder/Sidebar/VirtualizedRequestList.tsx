import React, { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Key, MoreVertical } from 'lucide-react';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import SortableRequest from './sortable-request';
import type { CollectionRequest } from '@/shared/types/collection';

interface VirtualizedRequestListProps {
  requests: CollectionRequest[];
  collectionId: string;
  activeRequestId?: string;
  isAuthRequest: (requestId: string, collectionId: string) => boolean;
  selectRequest: (request: CollectionRequest, collection: any) => void;
  getMethodColor: (method: string) => string;
  setMenuPosition: (position: any) => void;
  setSelectedRequest: (request: CollectionRequest) => void;
  setSelectedCollection: (collection: any) => void;
  setRequestId: (id: string) => void;
  setShowMenu: (id: string) => void;
  collection: any;
  isMobile: boolean;
  toggleSidebar: () => void;
  depth?: number;
}

const VirtualizedRequestList: React.FC<VirtualizedRequestListProps> = ({
  requests,
  collectionId,
  activeRequestId,
  isAuthRequest,
  selectRequest,
  getMethodColor,
  setMenuPosition,
  setSelectedRequest,
  setSelectedCollection,
  setRequestId,
  setShowMenu,
  collection,
  isMobile,
  toggleSidebar,
  depth = 0,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  console.log('coming to virtual request');

  const filteredRequests = useMemo(
    () => requests.filter((r: any) => !r.folderId),
    [requests],
  );

  const virtualizer = useVirtualizer({
    count: filteredRequests.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32, // Estimated height of each request item
    overscan: 1, // Render 5 extra items above and below viewport
  });

  return (
    <div
      ref={parentRef}
      className='overflow-y-auto scrollbar-thin'
      style={{
        height: `${Math.min(virtualizer.getTotalSize(), 600)}px`,
        contain: 'strict',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const request = filteredRequests[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <SortableRequest
                request={request}
                depth={depth}
                collectionId={collectionId}
              >
                <div
                  className={`group flex items-center justify-between p-[6px] rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    activeRequestId === request.id
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : ''
                  } ${
                    isAuthRequest(request?.id, collectionId)
                      ? 'border-2 border-blue-500 rounded-lg'
                      : ''
                  }`}
                >
                  <div
                    className='flex items-center space-x-2 flex-1 min-w-0'
                    onClick={() => {
                      selectRequest(request, collection);
                      if (isMobile) {
                        toggleSidebar();
                      }
                    }}
                  >
                    {isAuthRequest(request.id, collectionId) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Key className='h-3 w-3 text-blue-600 flex-shrink-0' />
                          </TooltipTrigger>
                          <TooltipContent side='top'>Auto Auth</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <span
                      className={`text-xs font-medium ${getMethodColor(
                        request.method,
                      )} flex-shrink-0`}
                    >
                      {request.method}
                    </span>
                    <span className='text-xs md:text-sm text-gray-900 dark:text-white truncate min-w-0 max-w-[150px]'>
                      {request.name}
                    </span>
                  </div>
                  <div className='flex items-center opacity-0 group-hover:opacity-100 transition-opacity relative'>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            draggable={false}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = (
                                e.currentTarget as HTMLButtonElement
                              ).getBoundingClientRect();
                              setMenuPosition({
                                top: rect.bottom,
                                left: rect.left,
                                anchorTop: rect.top,
                              });
                              setSelectedRequest(request);
                              setSelectedCollection(collection);
                              setRequestId(request.id || '');
                              setShowMenu(`request-${request.id}`);
                            }}
                            className='p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
                          >
                            <MoreVertical className='h-3 w-3' />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side='top'>
                          Request Actions
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </SortableRequest>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(VirtualizedRequestList);
