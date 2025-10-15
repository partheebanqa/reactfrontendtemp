'use client';

import type React from 'react';
import { useState, useRef, useEffect } from 'react';

interface EditableNumberProps {
  value: number | string;
  onSave: (newValue: number | string) => void;
  className?: string;
  title?: string;
}

const EditableNumber: React.FC<EditableNumberProps> = ({
  value,
  onSave,
  className = '',
  title = 'Double-click to edit',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(String(value));
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(String(value));
  };

  const handleSave = () => {
    const numericValue = Number(editValue);
    if (!isNaN(numericValue)) {
      onSave(numericValue);
    } else {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(String(value));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className='inline-flex items-center gap-1'>
        <input
          ref={inputRef}
          type='number'
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`inline-block min-w-16 px-2 py-1 text-sm border border-blue-500 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
        />
        <button
          onClick={handleSave}
          className='px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors'
        >
          Save
        </button>
        <button
          onClick={handleCancel}
          className='px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors'
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <span
      onDoubleClick={handleDoubleClick}
      className={`inline-block px-1 py-0.5 rounded cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 border-b border-dashed border-blue-400 dark:border-blue-500 transition-colors ${className}`}
      title={title}
    >
      {value}
    </span>
  );
};

export default EditableNumber;
