import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useRequest } from '@/hooks/useRequest';

const ErrorNotification: React.FC = () => {
  const { requestData, isLoading, clearError, error } = useRequest();

  if (!error) return null;

  const handleClose = () => {
    clearError();
  };

  return (
    <div className='fixed top-20 right-4 z-50 max-w-md w-full'>
      <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-lg p-4'>
        <div className='flex items-start'>
          <div className='flex-shrink-0'>
            <AlertCircle className='h-5 w-5 text-red-400' />
          </div>

          <div className='ml-3 flex-1'>
            <h3 className='text-sm font-medium text-red-800 dark:text-red-200'>
              {error.title}
            </h3>

            {error.description && (
              <p className='mt-1 text-sm text-red-700 dark:text-red-300'>
                {error.description}
              </p>
            )}

            {error.suggestions && error.suggestions.length > 0 && (
              <div className='mt-2'>
                <p className='text-xs font-medium text-red-800 dark:text-red-200 mb-1'>
                  Suggestions:
                </p>
                <ul className='text-xs text-red-700 dark:text-red-300 space-y-1'>
                  {error.suggestions.map((suggestion, index) => (
                    <li key={index} className='flex items-start'>
                      <span className='mr-1'>•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className='ml-4 flex-shrink-0'>
            <button
              onClick={handleClose}
              className='inline-flex text-red-400 hover:text-red-600 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-md p-1'
              aria-label='Close error notification'
            >
              <X className='h-4 w-4' />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorNotification;
