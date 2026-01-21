import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}

export const CustomSelect = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, required, className = '', ...props }, ref) => {
    const selectId = `select-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="space-y-1">
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-cyan-100"
        >
          {label}
          {required && <span className="text-pink-300 ml-1" aria-label="required">*</span>}
        </label>
        <div className="relative">
          <select
            ref={ref}
            id={selectId}

            className={`
              w-full px-0 py-3 pr-8 bg-transparent text-white 
              border-0 border-b-2 border-white focus:border-cyan-300 
              focus:outline-none focus:ring-0 transition-colors duration-200
              appearance-none cursor-pointer
              ${error ? 'border-red-400' : ''}
              ${className}
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${selectId}-error` : undefined}
            {...props}
          >
            <option value="" disabled className="bg-purple-800 text-white">
              Select {label}
            </option>
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                className="bg-purple-800 text-white"
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-0 top-1/2 transform -translate-y-1/2 text-purple-300 pointer-events-none"
            size={20}
          />
        </div>
        {error && (
          <p
            id={`${selectId}-error`}
            className="text-red-300 text-sm mt-1"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

CustomSelect.displayName = 'Select';