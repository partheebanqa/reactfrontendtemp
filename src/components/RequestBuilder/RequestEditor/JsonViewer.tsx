import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface JsonViewerProps {
  data: any;
  view: 'pretty' | 'raw' | 'preview';
  isError?: boolean;
  searchQuery?: string;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data, view, isError = false, searchQuery = '' }) => {
  const formatJson = (data: any, viewType: string): string => {
    try {
      if (viewType === 'raw') {
        return JSON.stringify(data);
      }
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return String(data);
    }
  };

  const highlightSearchQuery = (text: string, query: string): string => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
  };

  const renderErrorResponse = (errorData: any) => {
    if (errorData?.error) {
      const error = errorData.error;
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">{error.type?.toUpperCase()} ERROR</h3>

          </div>

          <div className="rounded-lg p-2">
            {/* <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
              {error.message}
            </h4> */}
            <pre className="text-sm font-mono text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded overflow-auto whitespace-pre-wrap">
              {formatJson(errorData, view)}
            </pre>

            {/* {error.description && (
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                {error.description}
              </p>
            )} */}

            {error.suggestions && error.suggestions.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                  How to fix this:
                </p>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  {error.suggestions.map((suggestion: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2 mt-1">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {error.originalError && (
              <details className="mt-3">
                <summary className="text-sm font-medium text-red-800 dark:text-red-200 cursor-pointer">
                  Technical Details
                </summary>
                <pre className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-2 rounded overflow-auto">
                  {error.originalError}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return (
      <pre className="text-sm font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
        {formatJson(data, view)}
      </pre>
    );
  };

  const renderSuccessResponse = (data: any) => {
    const formattedData = formatJson(data, view);
    const highlightedData = highlightSearchQuery(formattedData, searchQuery);

    return (
      <pre
        className="text-sm font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-all sm:break-normal"
        dangerouslySetInnerHTML={{ __html: highlightedData }}
      />
    );
  };

  return (
    <div className="h-full overflow-auto">
      {isError ? renderErrorResponse(data) : renderSuccessResponse(data)}
    </div>
  );
};

export default JsonViewer;