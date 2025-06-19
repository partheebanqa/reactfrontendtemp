import React from 'react';
import { Settings, Trash2 } from 'lucide-react';

interface ImportedRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  description?: string;
  testCases: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
  }>;
}

interface ImportedRequestItemProps {
  request: ImportedRequest;
  onConfigureTestCases: (request: ImportedRequest) => void;
  onRemove: (requestId: string) => void;
}

const ImportedRequestItem: React.FC<ImportedRequestItemProps> = ({
  request,
  onConfigureTestCases,
  onRemove
}) => {
  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-800';
      case 'POST': return 'bg-green-100 text-green-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'functional': return 'bg-blue-100 text-blue-800';
      case 'performance': return 'bg-purple-100 text-purple-800';
      case 'security': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'functional': return '🔧';
      case 'performance': return '⚡';
      case 'security': return '🛡️';
      default: return '📋';
    }
  };

  const testCasesByCategory = request.testCases.reduce((acc, testCase) => {
    if (!acc[testCase.category]) {
      acc[testCase.category] = 0;
    }
    acc[testCase.category]++;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getMethodColor(request.method)} mr-2`}>
              {request.method}
            </span>
            <h4 className="text-sm font-medium text-gray-900">{request.name}</h4>
          </div>
          <p className="text-xs text-gray-500 mb-2">{request.url}</p>
          {request.description && (
            <p className="text-xs text-gray-400 mb-3">{request.description}</p>
          )}
          
          {/* Test Cases Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Test Cases:</span>
              <button
                onClick={() => onConfigureTestCases(request)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Configure
              </button>
            </div>
            
            {request.testCases.length > 0 ? (
              <div className="space-y-1">
                {Object.entries(testCasesByCategory).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center">
                      <span className="mr-1">{getCategoryIcon(category)}</span>
                      <span className="capitalize text-gray-600">{category}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${getCategoryColor(category)}`}>
                      {count}
                    </span>
                  </div>
                ))}
                <div className="pt-1 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-gray-700">Total:</span>
                    <span className="text-gray-900">{request.testCases.length} test cases</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 italic bg-gray-50 p-2 rounded border border-dashed border-gray-200">
                No test cases selected. Click "Configure" to add test cases.
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => onConfigureTestCases(request)}
            className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50"
            title="Configure test cases"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={() => onRemove(request.id)}
            className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50"
            title="Remove request"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportedRequestItem;