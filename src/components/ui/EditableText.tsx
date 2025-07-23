import React, { useState, KeyboardEvent } from 'react';
import { Check, X, Edit2 } from 'lucide-react';

interface EditableTextProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
  fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

const EditableText: React.FC<EditableTextProps> = ({
  value,
  onSave,
  className = '',
  placeholder = 'Enter text',
  fontSize = 'lg',
  fontWeight = 'semibold',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(value);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedValue(value);
  };

  const handleSave = () => {
    if (editedValue.trim()) {
      onSave(editedValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedValue(value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  const fontSizeClass = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
  }[fontSize];

  const fontWeightClass = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  }[fontWeight];

  return (
    <div className={`${className}`}>
      {isEditing ? (
        <div className='flex items-center space-x-2'>
          <input
            type='text'
            value={editedValue}
            onChange={(e) => setEditedValue(e.target.value)}
            className={`${fontSizeClass} ${fontWeightClass} bg-transparent border-b-2 border-blue-500 focus:outline-none text-gray-900 dark:text-white min-w-0`}
            placeholder={placeholder}
            autoFocus
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={handleSave}
            className='p-1 text-green-600 hover:text-green-700'
            title='Save'
          >
            <Check className='h-4 w-4' />
          </button>
          <button
            onClick={handleCancel}
            className='p-1 text-red-600 hover:text-red-700'
            title='Cancel'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
      ) : (
        <div className='flex items-center space-x-2'>
          <h2 className={`${fontSizeClass} ${fontWeightClass} text-gray-900 dark:text-white`}>
            {value || placeholder}
          </h2>
          <button
            onClick={handleStartEdit}
            className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            title='Edit'
          >
            <Edit2 className='h-4 w-4' />
          </button>
        </div>
      )}
    </div>
  );
};

export default EditableText;
