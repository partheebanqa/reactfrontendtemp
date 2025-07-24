import React from 'react';

interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  id,
  checked,
  onChange,
  label,
  description,
}) => {
  return (
    <div className='flex items-center justify-between'>
      <div>
        {label && (
          <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
            {label}
          </h4>
        )}
        {description && (
          <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
            {description}
          </p>
        )}
      </div>
      <div className='relative inline-block w-10 mr-2 align-middle select-none'>
        <input
          type='checkbox'
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className='sr-only'
        />
        <label
          htmlFor={id}
          className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
            checked ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'
          }`}
        >
          <span
            className={`dot block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${
              checked ? 'translate-x-4' : 'translate-x-0'
            }`}
          ></span>
        </label>
      </div>
    </div>
  );
};

export default ToggleSwitch;
