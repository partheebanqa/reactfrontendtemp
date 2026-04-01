import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface TestCaseItemProps {
  title: string;
  description: string;
  type: string;
  expanded?: boolean;
}

export const TestCaseItem: React.FC<TestCaseItemProps> = ({
  title,
  description,
  type,
  expanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);

  return (
    <div className='bg-white rounded-lg border border-gray-200 shadow-sm'>
      <div
        className='flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors'
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className='flex items-center space-x-3'>
          {isExpanded ? (
            <ChevronDown className='text-gray-400' size={20} />
          ) : (
            <ChevronRight className='text-gray-400' size={20} />
          )}
          <div>
            <h3 className='font-medium text-gray-900'>{title}</h3>
            {description && (
              <p className='text-sm text-gray-600 mt-1'>{description}</p>
            )}
          </div>
        </div>
        <div className='flex items-center space-x-3'>
          <span className='px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded'>
            {type}
          </span>
          {isExpanded && (
            <button className='text-blue-600 text-sm hover:text-blue-800 transition-colors'>
              Functional
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className='px-4 pb-4 border-t border-gray-100'>
          <div className='mt-4 p-4 bg-gray-50 rounded-lg'>
            <p className='text-sm text-gray-600'>
              Test configuration and parameters would be displayed here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
