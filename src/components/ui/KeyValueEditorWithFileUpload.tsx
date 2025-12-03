import { Trash2, File as FileIcon } from 'lucide-react';
import React, { useState } from 'react';
import TooltipContainer from './tooltip-container';
import { Button } from './button';
import { Input } from './input';

export interface KeyValuePairWithFile {
  key: string;
  value: string | File;
  enabled: boolean;
  type: 'text' | 'file';
  fileName?: string;
}

interface KeyValueEditorWithFileUploadProps {
  items: KeyValuePairWithFile[];
  onAdd: () => void;
  onUpdate: (
    index: number,
    field: keyof KeyValuePairWithFile,
    value: string | boolean | File | undefined
  ) => void;
  onRemove: (index: number) => void;
  title: string;
  addButtonLabel?: string;
  emptyMessage?: string;
}

const KeyValueEditorWithFileUpload: React.FC<
  KeyValueEditorWithFileUploadProps
> = ({
  items,
  onAdd,
  onUpdate,
  onRemove,
  title,
  addButtonLabel = 'Add Item',
  emptyMessage = 'No items added yet. Click "Add Item" to add one.',
}) => {
  const handleFileChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      onUpdate(index, 'value', file);
      onUpdate(index, 'fileName', file.name);
    }
  };

  const toggleItemType = (index: number) => {
    const currentType = items[index].type;
    const newType = currentType === 'text' ? 'file' : 'text';

    // Reset value when switching types
    if (newType === 'text') {
      onUpdate(index, 'value', '');
      onUpdate(index, 'fileName', undefined);
    } else {
      onUpdate(index, 'value', '');
    }

    onUpdate(index, 'type', newType);
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h4 className='text-base sm:text-lg font-medium text-gray-900 dark:text-white'>
          {title}
        </h4>
        <Button
          onClick={onAdd}

          // className='bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-md text-sm'
        >
          <span className='hidden sm:inline'>{addButtonLabel}</span>
          <span className='sm:hidden'>Add</span>
        </Button>
      </div>

      {items.length > 0 ? (
        <div className='space-y-2'>
          {items.map((item, index) => (
            <div
              key={index}
              className='flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2'
            >
              <input
                type='checkbox'
                checked={item.enabled}
                onChange={(e) => onUpdate(index, 'enabled', e.target.checked)}
                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded sm:flex-shrink-0'
              />
              <div className='flex flex-1 space-x-2'>
                <input
                  type='text'
                  value={item.key}
                  onChange={(e) => onUpdate(index, 'key', e.target.value)}
                  placeholder='Key'
                  className='flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150'
                />

                {item.type === 'text' ? (
                  <Input
                    type='text'
                    value={typeof item.value === 'string' ? item.value : ''}
                    onChange={(e) => onUpdate(index, 'value', e.target.value)}
                    placeholder='Value'
                    // className='flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150'
                  />
                ) : (
                  <div className='flex-1 flex items-center space-x-2 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white'>
                    <label className='flex-1 cursor-pointer overflow-hidden'>
                      <Input
                        type='file'
                        onChange={(e) => handleFileChange(index, e)}
                        className='hidden'
                      />
                      <div className='flex items-center'>
                        <FileIcon size={16} className='mr-2 text-gray-400' />
                        <span className='truncate text-sm'>
                          {item.fileName || 'Select a file...'}
                        </span>
                      </div>
                    </label>
                  </div>
                )}

                <Button
                  type='button'
                  onClick={() => toggleItemType(index)}
                  // className='bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md text-xs whitespace-nowrap'
                >
                  {item.type === 'text' ? 'File' : 'Text'}
                </Button>

                <TooltipContainer
                  text='Remove'
                  position='bottom'
                  children={
                    <Button
                      onClick={() => onRemove(index)}
                      // className='text-red-600 hover:text-red-700 px-2 py-1 whitespace-nowrap'
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  }
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='text-gray-500 dark:text-gray-400 text-center p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-md'>
          {emptyMessage}
        </div>
      )}
    </div>
  );
};

export default KeyValueEditorWithFileUpload;
