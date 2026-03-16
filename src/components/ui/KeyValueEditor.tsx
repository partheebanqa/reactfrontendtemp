'use client';

import { Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import TooltipContainer from './tooltip-container';
import { KeyValuePair } from '@/shared/types/request';

interface KeyValueEditorProps {
  items: KeyValuePair[];
  onAdd: () => void;
  onUpdate: (idOrIndex: string | number, field: Partial<KeyValuePair>) => void;
  onRemove: (idOrIndex: string | number) => void;
  title: string;
  addButtonLabel?: string;
  emptyMessage?: string;
}

const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  items,
  onAdd,
  onUpdate,
  onRemove,
  title,
  addButtonLabel = 'Add Item',
  emptyMessage = 'No items added yet. Click "Add Item" to add one.',
}) => {
  const handleFieldUpdate = (
    idOrIndex: string | number,
    fieldName: string,
    fieldValue: string | boolean,
  ) => {
    const index =
      typeof idOrIndex === 'number'
        ? idOrIndex
        : items.findIndex((i) => i.id === idOrIndex);
    onUpdate(index, { [fieldName]: fieldValue } as Partial<KeyValuePair>);
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h4 className='text-sm sm:text-lg font-medium text-gray-900 dark:text-white'>
          {title}
        </h4>
        <button
          onClick={onAdd}
          className='flex items-center space-x-2 px-3 py-1 text-sm text-[#136fb0] hover:bg-blue-50 rounded-lg transition-colors'
        >
          <Plus className='w-3 h-3' color='#136fb0' />
          <span className='hidden sm:inline'>{addButtonLabel}</span>
          <span className='text-xs sm:hidden'>Add</span>
        </button>
      </div>

      {items.length > 0 ? (
        <div className='space-y-2'>
          {items.map((item, index) => (
            <div
              key={item.id || index}
              className='flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2'
            >
              {item.enabled !== undefined && (
                <input
                  type='checkbox'
                  checked={item.enabled}
                  onChange={(e) =>
                    handleFieldUpdate(
                      item.id || index,
                      'enabled',
                      e.target.checked,
                    )
                  }
                  className='text-xs md:text-sm h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded sm:flex-shrink-0'
                />
              )}
              <div className='flex flex-1 space-x-2'>
                <input
                  type='text'
                  value={item.key}
                  onChange={(e) =>
                    handleFieldUpdate(item.id || index, 'key', e.target.value)
                  }
                  placeholder='Key'
                  className='text-xs md:text-sm flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150'
                />
                <input
                  type='text'
                  value={item.value}
                  onChange={(e) =>
                    handleFieldUpdate(item.id || index, 'value', e.target.value)
                  }
                  placeholder='Value'
                  className='text-xs md:text-sm flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150'
                />
                <TooltipContainer
                  text='Remove'
                  position='bottom'
                  children={
                    <button
                      onClick={() => onRemove(item.id || index)}
                      className='text-red-600 hover:text-red-700 px-2 py-1 whitespace-nowrap'
                    >
                      <Trash2 className='h-4 w-4' />
                    </button>
                  }
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='text-xs md:text-sm text-gray-500 dark:text-gray-400 text-center p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-md'>
          {emptyMessage}
        </div>
      )}
    </div>
  );
};

export default KeyValueEditor;
