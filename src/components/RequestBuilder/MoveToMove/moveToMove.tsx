'use client';

import type React from 'react';
import { useState } from 'react';
import { X, Folder, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Collection } from '@/shared/types/collection';

interface MoveToModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (targetCollectionId: string, targetFolderId?: string) => void;
  collections: Collection[];
  currentCollectionId: string;
  currentFolderId?: string;
  itemType: 'request' | 'folder';
  itemName: string;
}

const MoveToModal: React.FC<MoveToModalProps> = ({
  isOpen,
  onClose,
  onMove,
  collections,
  currentCollectionId,
  currentFolderId,
  itemType,
  itemName,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [selectedTarget, setSelectedTarget] = useState<{
    collectionId: string;
    folderId?: string;
  } | null>(null);

  if (!isOpen) return null;

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleMove = () => {
    if (selectedTarget) {
      onMove(selectedTarget.collectionId, selectedTarget.folderId);
      onClose();
    }
  };

  const isCurrentLocation = (collectionId: string, folderId?: string) => {
    return (
      collectionId === currentCollectionId &&
      (folderId || null) === (currentFolderId || null)
    );
  };

  const renderFolderTree = (
    folders: any[],
    parentCollectionId: string,
    level = 0
  ) => {
    return folders.map((folder: any) => {
      const isExpanded = expandedFolders.has(folder.id);
      const isCurrent = isCurrentLocation(parentCollectionId, folder.id);
      const isSelected =
        selectedTarget?.collectionId === parentCollectionId &&
        selectedTarget?.folderId === folder.id;

      return (
        <div key={folder.id} style={{ marginLeft: `${level * 16}px` }}>
          <div
            className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
              isSelected ? 'bg-blue-100 dark:bg-blue-900/30' : ''
            } ${isCurrent ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => {
              if (!isCurrent) {
                setSelectedTarget({
                  collectionId: parentCollectionId,
                  folderId: folder.id,
                });
              }
            }}
          >
            <div className='flex items-center space-x-2'>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(folder.id);
                }}
                className='p-1'
              >
                {isExpanded ? (
                  <ChevronDown className='h-4 w-4 text-gray-500' />
                ) : (
                  <ChevronRight className='h-4 w-4 text-gray-500' />
                )}
              </button>
              <Folder className='h-4 w-4 text-orange-500' />
              <span className='text-sm text-gray-900 dark:text-white'>
                {folder.name}
              </span>
              {isCurrent && (
                <span className='text-xs text-gray-500 ml-2'>(current)</span>
              )}
            </div>
          </div>

          {isExpanded &&
            folder.folders &&
            folder.folders.length > 0 &&
            renderFolderTree(folder.folders, parentCollectionId, level + 1)}
        </div>
      );
    });
  };

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <div className='bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700 max-h-[600px] flex flex-col'>
        <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
          <h2 className='text-xl font-semibold'>
            Move {itemType === 'request' ? 'Request' : 'Folder'}
          </h2>
          <button
            onClick={onClose}
            className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          >
            <X size={20} />
          </button>
        </div>

        <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            Moving: <span className='font-medium'>{itemName}</span>
          </p>
        </div>

        <div className='flex-1 overflow-y-auto p-4 space-y-2'>
          {collections.map((collection) => {
            const isCurrentRoot = isCurrentLocation(collection.id, undefined);
            const isSelectedRoot =
              selectedTarget?.collectionId === collection.id &&
              !selectedTarget?.folderId;

            return (
              <div key={collection.id} className='space-y-1'>
                <div
                  className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    isSelectedRoot ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                  } ${isCurrentRoot ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (!isCurrentRoot) {
                      setSelectedTarget({
                        collectionId: collection.id,
                        folderId: undefined,
                      });
                    }
                  }}
                >
                  <Folder className='h-4 w-4 text-orange-500' />
                  <span className='text-sm font-medium text-gray-900 dark:text-white'>
                    {collection.name}
                  </span>
                  {isCurrentRoot && (
                    <span className='text-xs text-gray-500 ml-2'>
                      (current)
                    </span>
                  )}
                </div>

                {(collection as any).folders &&
                  (collection as any).folders.length > 0 &&
                  renderFolderTree(
                    (collection as any).folders,
                    collection.id,
                    1
                  )}
              </div>
            );
          })}
        </div>

        <div className='flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={
              !selectedTarget ||
              isCurrentLocation(
                selectedTarget.collectionId,
                selectedTarget.folderId
              )
            }
          >
            Move Here
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MoveToModal;
