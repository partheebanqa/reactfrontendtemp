import React, { useState, KeyboardEvent } from 'react';

interface EditableTextProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
  fontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

const EditableTextWithoutIcon: React.FC<EditableTextProps> = ({
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
    xs: 'text-xs',
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
    <div
      className={`${className} flex items-center`}
      onDoubleClick={!isEditing ? handleStartEdit : undefined}
    >
      {isEditing ? (
        <input
          type='text'
          value={editedValue}
          onChange={(e) => setEditedValue(e.target.value)}
          className={`${fontSizeClass} ${fontWeightClass} bg-transparent border-b-2 border-blue-500 focus:outline-none text-gray-900 dark:text-white min-w-0`}
          placeholder={placeholder}
          autoFocus
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <h2
          className={`${fontSizeClass} ${fontWeightClass} text-gray-900 dark:text-white border-b border-gray-300 dark:border-gray-600 cursor-text`}
        >
          {value || placeholder}
        </h2>
      )}
    </div>
  );
};

export default EditableTextWithoutIcon;
