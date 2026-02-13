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

      <div className='relative inline-block w-10 h-5 align-middle select-none'>
        <input
          type='checkbox'
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className='sr-only'
        />

        <label
          htmlFor={id}
          className={`block h-5 rounded-full cursor-pointer transition-colors duration-200 ${
            checked ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full shadow transform transition-transform duration-200 ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </label>
      </div>
    </div>
  );
};

export default ToggleSwitch;
