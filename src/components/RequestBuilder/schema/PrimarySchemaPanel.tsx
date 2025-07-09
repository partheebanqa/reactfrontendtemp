import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useSchema } from '@/contexts/RequestContext';
import JsonTreeViewer from './JsonTreeViewer';
import { useRequest } from '@/contexts/RequestContext';

const PrimarySchemaPanel: React.FC = () => {
  const { primarySchema, primarySchemaValidation } = useSchema();
  const { responseData } = useRequest();
  
  if (!primarySchema) return null;

  const hasValidationResults = primarySchemaValidation !== null;
  const hasDifferences = hasValidationResults && primarySchemaValidation.differences.length > 0;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
          <span className="font-medium">{primarySchema.name}</span>
        </div>
        
        {responseData && hasDifferences && (
          <div className="flex items-center text-amber-600 text-sm">
            <AlertTriangle size={16} className="mr-1" />
            <span>Schema differences detected</span>
          </div>
        )}
      </div>
      
      <div className="max-h-[calc(100vh-300px)] overflow-auto">
        <JsonTreeViewer json={primarySchema.content} />
      </div>
      
      {responseData && hasValidationResults && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <h3 className="font-medium text-gray-700 mb-2">Validation Results</h3>
          
          {hasDifferences ? (
            <div>
              <p className="text-sm text-gray-600 mb-2">
                {primarySchemaValidation.differences.length} differences found
              </p>
              <div className="space-y-2 max-h-48 overflow-auto">
                {primarySchemaValidation.differences.map((diff, index) => (
                  <div 
                    key={index} 
                    className={`text-sm p-2 rounded-md ${
                      diff.type === 'added' ? 'bg-green-50 text-green-700 border-l-2 border-green-500' : 
                      diff.type === 'removed' ? 'bg-red-50 text-red-700 border-l-2 border-red-500' : 
                      'bg-amber-50 text-amber-700 border-l-2 border-amber-500'
                    }`}
                  >
                    <span className="font-mono">
                      {diff.path}: {diff.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-green-50 p-3 rounded-md text-green-700 text-sm">
              Schema matches the response
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrimarySchemaPanel;