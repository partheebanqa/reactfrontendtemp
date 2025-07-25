import React, { forwardRef } from 'react';
import { sanitizeText } from '../../utils/security';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export const CustomTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, required, className = '', ...props }, ref) => {
    const textareaId = `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Handle input sanitization
    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const { value } = e.target;
      
      // Apply sanitization for security
      e.target.value = sanitizeText(value, 2000);
      
      // Call original onChange if provided
      if (props.onChange) {
        props.onChange(e);
      }
    };
    
    return (
      <div className="space-y-1">
        <label 
          htmlFor={textareaId}
          className="block text-sm font-medium text-cyan-100"
        >
          {label}
          {required && <span className="text-pink-300 ml-1" aria-label="required">*</span>}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          rows={4}
          className={`
            w-full px-0 py-3 bg-transparent text-white placeholder-purple-300 
            border-0 border-b-2 border-purple-400 focus:border-cyan-300 
            focus:outline-none focus:ring-0 transition-colors duration-200 resize-none
            ${error ? 'border-red-400' : ''}
            ${className}
          `}
          onChange={handleTextareaChange}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${textareaId}-error` : undefined}
          spellCheck="true"
          {...props}
        />
        {error && (
          <p 
            id={`${textareaId}-error`}
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

CustomTextarea.displayName = 'Textarea';