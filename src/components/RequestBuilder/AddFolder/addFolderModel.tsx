'use client';

import { useState } from 'react';
import { Save, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Collection } from '@/shared/types/collection';

type Props = {
  isOpen: boolean;
  collection: Collection | null;
  onClose: () => void;
  onSave: (name: string) => Promise<void> | void;
  loading?: boolean;
};

export default function AddFolderModal({
  isOpen,
  collection,
  onClose,
  onSave,
  loading,
}: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Folder name is required.');
      return;
    }
    setError('');
    await onSave(trimmed);
  };

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <div className='bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700'>
        <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
          <h2 className='text-xl font-semibold'>
            Add Folder{collection ? ` to ${collection.name}` : ''}
          </h2>
          <button
            onClick={onClose}
            className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            aria-label='Close add folder'
            title='Close'
          >
            <X size={20} />
          </button>
        </div>

        <div className='p-4 space-y-4'>
          <div>
            <label className='block text-sm font-medium mb-1'>
              Folder Name
            </label>
            <Input
              type='text'
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim() !== '') setError('');
              }}
              id='folderName'
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 ${
                error
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder='New folder name'
            />
            {error && <p className='text-red-500 text-xs mt-1'>{error}</p>}
          </div>
        </div>

        <div className='flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className='px-4 py-2 bg-[#136fb0] text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2'
          >
            <Save size={16} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
