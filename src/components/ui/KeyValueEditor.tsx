import { Trash2 } from 'lucide-react';
import React from 'react';
import TooltipContainer from './tooltip-container';

export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

interface KeyValueEditorProps {
  items: KeyValuePair[];
  onAdd: () => void;
  onUpdate: (index: number, field: keyof KeyValuePair, value: string | boolean) => void;
  onRemove: (index: number) => void;
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
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-base sm:text-lg font-medium text-gray-900 dark:text-white'>
          {title}
        </h3>
        <button
          onClick={onAdd}
          className='bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-md text-sm'
        >
          <span className='hidden sm:inline'>{addButtonLabel}</span>
          <span className='sm:hidden'>Add</span>
        </button>
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
                  placeholder='Keyas'
                  className='flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150'
                />
                <input
                  type='text'
                  value={item.value}
                  onChange={(e) => onUpdate(index, 'value', e.target.value)}
                  placeholder='Value'
                  className='flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-800 dark:text-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 transition-all duration-150'
                />
                <TooltipContainer text='Remove' position='bottom' children={
                    <button
                  onClick={() => onRemove(index)}
                  className='text-red-600 hover:text-red-700 px-2 py-1 whitespace-nowrap'
                >
                  <Trash2 className='h-4 w-4' />
                </button>
                } />
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

export default KeyValueEditor;
