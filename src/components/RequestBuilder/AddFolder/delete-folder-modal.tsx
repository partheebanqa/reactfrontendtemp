'use client';

import { X, Trash2 } from 'lucide-react';

type Props = {
  isOpen: boolean;
  folderName: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
};

export default function DeleteFolderModal({
  isOpen,
  folderName,
  onClose,
  onConfirm,
  loading,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <div className='bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700'>
        <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
          <h2 className='text-xl font-semibold'>Delete Folder</h2>
          <button
            onClick={onClose}
            className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            aria-label='Close delete folder'
            title='Close'
          >
            <X size={20} />
          </button>
        </div>

        <div className='p-4'>
          <p className='text-sm'>
            Are you sure you want to delete{' '}
            <span className='font-semibold'>
              "{folderName || 'this folder'}"
            </span>
            ? This action cannot be undone.
          </p>
        </div>

        <div className='flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2'
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
