import React, { useState, useRef, useEffect } from 'react';

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
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type='text'
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={`inline-block min-w-16 px-2 py-1 text-sm border border-blue-500 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
      />
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
