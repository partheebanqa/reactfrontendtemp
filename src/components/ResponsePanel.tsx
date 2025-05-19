import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Copy, Check, Code, Table, Maximize2, Minimize2 } from 'lucide-react';
import AssertionResults from './AssertionResults';

interface ResponsePanelProps {
  response: any;
}

const MAX_STRING_LENGTH = 100;
const MAX_ARRAY_ITEMS = 50;
const MAX_OBJECT_KEYS = 20;

const ResponsePanel: React.FC<ResponsePanelProps> = ({ response }) => {
  const [viewMode, setViewMode] = useState<'raw' | 'formatted'>('raw');
  const [copied, setCopied] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [fullscreen, setFullscreen] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [response]);

  const truncateValue = (value: any, path: string = ''): any => {
    if (value === null || value === undefined) return value;

    if (Array.isArray(value)) {
      if (!expandedPaths.has(path)) {
        return value.length > MAX_ARRAY_ITEMS
          ? `Array(${value.length} items)`
          : value.slice(0, MAX_ARRAY_ITEMS).map((item, i) => truncateValue(item, `${path}[${i}]`));
      }
      return value.map((item, i) => truncateValue(item, `${path}[${i}]`));
    }

    if (typeof value === 'object') {
      if (!expandedPaths.has(path)) {
        const keys = Object.keys(value);
        if (keys.length > MAX_OBJECT_KEYS) {
          return `Object(${keys.length} properties)`;
        }
        return Object.fromEntries(
          Object.entries(value)
            .slice(0, MAX_OBJECT_KEYS)
            .map(([k, v]) => [k, truncateValue(v, path ? `${path}.${k}` : k)])
        );
      }
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, truncateValue(v, path ? `${path}.${k}` : k)])
      );
    }

    if (typeof value === 'string' && value.length > MAX_STRING_LENGTH && !expandedPaths.has(path)) {
      return `${value.slice(0, MAX_STRING_LENGTH)}...`;
    }

    return value;
  };

  const togglePath = (path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderValue = (value: any, path: string = '', level: number = 0): JSX.Element => {
    if (value === null) return <span className="text-gray-500">null</span>;
    if (value === undefined) return <span className="text-gray-500">undefined</span>;

    if (Array.isArray(value)) {
      const isExpanded = expandedPaths.has(path);
      const displayValue = isExpanded ? value : value.slice(0, MAX_ARRAY_ITEMS);
      
      return (
        <div className="space-y-1">
          <div 
            className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 px-1 rounded"
            onClick={() => togglePath(path)}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span className="text-blue-600">Array({value.length})</span>
          </div>
          {isExpanded && (
            <div className="pl-4 border-l border-gray-200">
              {displayValue.map((item: any, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-gray-500">{i}:</span>
                  {renderValue(item, `${path}[${i}]`, level + 1)}
                </div>
              ))}
              {value.length > MAX_ARRAY_ITEMS && !isExpanded && (
                <div className="text-gray-500 italic">...{value.length - MAX_ARRAY_ITEMS} more items</div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'object') {
      const isExpanded = expandedPaths.has(path);
      const entries = Object.entries(value);
      const displayEntries = isExpanded ? entries : entries.slice(0, MAX_OBJECT_KEYS);

      return (
        <div className="space-y-1">
          <div 
            className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 px-1 rounded"
            onClick={() => togglePath(path)}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span className="text-blue-600">Object({entries.length} properties)</span>
          </div>
          {isExpanded && (
            <div className="pl-4 border-l border-gray-200">
              {displayEntries.map(([key, val]) => (
                <div key={key} className="flex items-start gap-2">
                  <span className="text-gray-500">{key}:</span>
                  {renderValue(val, path ? `${path}.${key}` : key, level + 1)}
                </div>
              ))}
              {entries.length > MAX_OBJECT_KEYS && !isExpanded && (
                <div className="text-gray-500 italic">...{entries.length - MAX_OBJECT_KEYS} more properties</div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'string') {
      if (value.length > MAX_STRING_LENGTH && !expandedPaths.has(path)) {
        return (
          <div 
            className="cursor-pointer hover:bg-gray-50 px-1 rounded inline-block"
            onClick={() => togglePath(path)}
          >
            <span className="text-gray-800">"{value.slice(0, MAX_STRING_LENGTH)}</span>
            <span className="text-blue-600">...</span>
            <span className="text-gray-500 text-xs ml-1">({value.length} chars)</span>
          </div>
        );
      }
      return <span className="text-gray-800">"{value}"</span>;
    }

    if (typeof value === 'number') {
      return <span className="text-green-600">{value}</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="text-purple-600">{String(value)}</span>;
    }

    return <span>{String(value)}</span>;
  };

  if (!response) return null;

  const containerClasses = fullscreen
    ? 'fixed inset-0 z-50 overflow-hidden flex flex-col shadow'
    : 'rounded-lg shadow';

  const contentMaxHeight = fullscreen
    ? 'calc(100vh - 120px)'  // Account for header in fullscreen mode
    : 'calc(100vh - 400px)'; // Normal mode height

  return (
    <div className={containerClasses}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold">Response</h2>
            {response.status && (
              <span className={`px-2 py-1 rounded text-sm ${
                response.status >= 200 && response.status < 300
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {response.status} {response.statusText}
              </span>
            )}
            {response.responseTime && (
              <span className="text-sm text-gray-500">
                {response.responseTime.toFixed(2)}s
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(prev => prev === 'raw' ? 'formatted' : 'raw')}
              className={`p-1.5 rounded-md hover:bg-gray-50 ${
                viewMode === 'raw' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
              title={viewMode === 'raw' ? 'Show formatted view' : 'Show raw view'}
            >
              {viewMode === 'raw' ? <Code size={16} /> : <Table size={16} />}
            </button>
            <button
              onClick={handleCopy}
              className="p-1.5 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-50"
              title="Copy response"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
            <button
              onClick={() => setFullscreen(prev => !prev)}
              className="p-1.5 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-50"
              title={fullscreen ? 'Exit fullscreen' : 'View fullscreen'}
            >
              {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>
      </div>

      {response.assertions && (
        <div className="p-4 border-b border-gray-200 text-bla">
          <AssertionResults results={response.assertions} />
        </div>
      )}

      <div className={`p-4 ${fullscreen ? 'flex-1 overflow-hidden' : ''}`}>
        <div 
          className={` p-4 rounded-lg overflow-auto text-sm font-mono`}
          style={{ maxHeight: contentMaxHeight }}
        >
          {viewMode === 'raw' ? (
            <pre className="whitespace-pre-wrap break-words">
              {JSON.stringify(response.data || response.error, null, 2)}
            </pre>
          ) : (
            <div className="space-y-1">
              {renderValue(response.data || response.error)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResponsePanel;