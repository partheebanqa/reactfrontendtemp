import React, { forwardRef } from 'react';
import { sanitizeText } from '../../utils/security';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export const CustomInput = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, required, className = '', ...props }, ref) => {
    const inputId = `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Handle input sanitization
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value, type } = e.target;
      
      // Apply basic sanitization for security
      if (type === 'text' || type === 'tel') {
        const maxLength = type === 'tel' ? 20 : 100;
        e.target.value = sanitizeText(value, maxLength);
      } else if (type === 'email') {
        e.target.value = value.slice(0, 254).replace(/[<>]/g, '');
      }
      
      // Call original onChange if provided
      if (props.onChange) {
        props.onChange(e);
      }
    };
    
    return (
      <div className="space-y-1">
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-cyan-100"
        >
          {label}
          {required && <span className="text-pink-300 ml-1" aria-label="required">*</span>}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-0 py-3 bg-transparent text-white placeholder-purple-300 
            border-0 border-b-2 border-purple-400 focus:border-cyan-300 
            focus:outline-none focus:ring-0 transition-colors duration-200
            ${error ? 'border-red-400' : ''}
            ${className}
          `}
          onChange={handleInputChange}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
          autoComplete={props.autoComplete || 'off'}
          spellCheck="false"
          {...props}
        />
        {error && (
          <p 
            id={`${inputId}-error`}
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

CustomInput.displayName = 'CustomInput';
