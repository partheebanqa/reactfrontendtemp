import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface JsonTreeViewerProps {
  json: any;
  level?: number;
  path?: string;
}

const JsonTreeViewer: React.FC<JsonTreeViewerProps> = ({ 
  json, 
  level = 0, 
  path = ''
}) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  
  const toggleExpand = (key: string) => {
    setExpanded(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const renderValue = (key: string, value: any, currentPath: string) => {
    const type = typeof value;
    const isArray = Array.isArray(value);
    const isObject = type === 'object' && value !== null && !isArray;
    const valueKey = `${currentPath}-${key}`;
    
    // Null and primitive values
    if (value === null) {
      return <span className="text-gray-500 italic">null</span>;
    }
    
    if (type !== 'object' || value === null) {
      if (type === 'string') {
        return <span className="text-green-600">"{value}"</span>;
      }
      if (type === 'number') {
        return <span className="text-blue-600">{value}</span>;
      }
      if (type === 'boolean') {
        return <span className="text-purple-600 font-semibold">{value.toString()}</span>;
      }
      return <span>{String(value)}</span>;
    }
    
    // Arrays and objects
    const isExpanded = expanded[valueKey];
    const isEmpty = Object.keys(value).length === 0;
    
    if (isEmpty) {
      return isArray ? <span className="text-gray-500 italic">[]</span> : <span className="text-gray-500 italic">{'{}'}</span>;
    }
    
    return (
      <div>
        <div 
          className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 py-1 px-1 rounded transition-colors"
          onClick={() => toggleExpand(valueKey)}
        >
          <span className="text-gray-400 mr-1">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
          <span className={`${isArray ? 'text-blue-500' : 'text-purple-500'} font-medium`}>
            {isArray ? `Array[${Object.keys(value).length}]` : `Object`}
          </span>
        </div>
        
        {isExpanded && (
          <div className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-2 mt-1">
            {Object.keys(value).map((objKey) => {
              const newPath = currentPath ? `${currentPath}.${objKey}` : objKey;
              return (
                <div key={objKey} className="py-1">
                  <div className="flex items-start">
                    <span className="text-gray-800 dark:text-gray-300 font-medium mr-1">{objKey}:</span>
                    {renderValue(objKey, value[objKey], newPath)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };
  
  // For the root level
  if (level === 0) {
    return (
      <div className="font-mono text-sm bg-white dark:bg-gray-900 p-3 rounded-md border border-gray-200 dark:border-gray-700 custom-scrollbar">
        {typeof json === 'object' && json !== null ? (
          Object.keys(json).map((key) => {
            const currentPath = path ? `${path}.${key}` : key;
            return (
              <div key={key} className="py-1">
                <div className="flex items-start">
                  <span className="text-gray-800 dark:text-gray-300 font-medium mr-1">{key}:</span>
                  {renderValue(key, json[key], currentPath)}
                </div>
              </div>
            );
          })
        ) : (
          <span>{JSON.stringify(json)}</span>
        )}
      </div>
    );
  }
  
  return null;
};

export default JsonTreeViewer;