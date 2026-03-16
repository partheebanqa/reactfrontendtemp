import type React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import type { CollectionRequest } from '@/shared/types/collection';

interface SortableRequestProps {
  request: CollectionRequest;
  depth: number;
  children: React.ReactNode;
  collectionId: string; // Added collectionId prop
}

export default function SortableRequest({
  request,
  depth,
  children,
  collectionId, // Added collectionId parameter
}: SortableRequestProps) {
  const { attributes, listeners, setNodeRef, isDragging, isOver } = useSortable(
    {
      id: request.id || `temp-${request.name}`,
      data: {
        type: 'request',
        request,
        collectionId, // Include collectionId in data for drag operations
      },
      animateLayoutChanges: () => false,
    },
  );

  const style = {
    opacity: isDragging ? 0 : 1,
    pointerEvents: isDragging ? ('none' as const) : ('auto' as const),
  };

  return (
    <div className='relative'>
      {isOver && (
        <div
          className='absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 z-10 shadow-lg'
          style={{ marginLeft: `${depth * 16}px` }}
        />
      )}
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        {children}
      </div>
    </div>
  );
}
