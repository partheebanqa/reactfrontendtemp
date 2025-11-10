'use client';

import { useState, useMemo } from 'react';
import {
  Copy,
  Download,
  Search,
  X,
  CheckCircle,
  Clock,
  HardDrive,
  ChevronDown,
  ChevronRight,
  Plus,
  Code,
  Hash,
  Cookie,
  Trash2,
  Info,
} from 'lucide-react';
import { useRequest } from '@/hooks/useRequest';

interface JsonNode {
  key: string;
  value: any;
  path: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  level: number;
  parentPath: string;
}

const ResponseViewer = () => {
  const { responseData } = useRequest();
  const [activeTab, setActiveTab] = useState<
    'body' | 'headers' | 'cookies' | 'test-results' | 'schema'
  >('body');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(['root'])
  );
  const [extractedVariables, setExtractedVariables] = useState<
    Record<string, any>
  >({});
  const [extractionModal, setExtractionModal] = useState<{
    isOpen: boolean;
    source: 'response_body' | 'response_header' | 'response_cookie';
    path: string;
    value: any;
    suggestedName: string;
  } | null>(null);
  const [variableName, setVariableName] = useState<string>('');
  const [copiedItem, setCopiedItem] = useState<string>('');

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 300 && status < 400) return 'text-yellow-600';
    if (status >= 400 && status < 500) return 'text-orange-600';
    if (status >= 500) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const kb = bytes / k;
    return Number.parseFloat(kb.toFixed(2)) + ' KB';
  };

  const calculateResponseSize = (data: any): string => {
    try {
      const size = new Blob([JSON.stringify(data)]).size;
      return formatBytes(size);
    } catch {
      return formatBytes(0);
    }
  };

  const handleCopy = (text: string, itemId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(itemId);
    setTimeout(() => setCopiedItem(''), 2000);
  };

  const downloadResponse = () => {
    if (!responseData) return;
    const blob = new Blob([JSON.stringify(responseData.body, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'response.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sanitizeVariableName = (name: string): string => {
    return name
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_');
  };

  const parseJsonToNodes = (
    obj: any,
    parentPath = 'root',
    level = 0
  ): JsonNode[] => {
    const nodes: JsonNode[] = [];
    if (obj === null) {
      return [
        {
          key: 'null',
          value: null,
          path: parentPath,
          type: 'null',
          level,
          parentPath: '',
        },
      ];
    }
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const currentPath =
          parentPath === 'root' ? `[${index}]` : `${parentPath}[${index}]`;
        const itemType = Array.isArray(item)
          ? 'array'
          : item === null
          ? 'null'
          : typeof item === 'object'
          ? 'object'
          : typeof item;
        nodes.push({
          key: `[${index}]`,
          value: item,
          path: currentPath,
          type: itemType as JsonNode['type'],
          level,
          parentPath,
        });
        if (typeof item === 'object' && item !== null) {
          nodes.push(...parseJsonToNodes(item, currentPath, level + 1));
        }
      });
    } else if (typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath =
          parentPath === 'root' ? key : `${parentPath}.${key}`;
        const valueType = Array.isArray(value)
          ? 'array'
          : value === null
          ? 'null'
          : typeof value === 'object'
          ? 'object'
          : typeof value;
        nodes.push({
          key,
          value,
          path: currentPath,
          type: valueType as JsonNode['type'],
          level,
          parentPath,
        });
        if (typeof value === 'object' && value !== null) {
          nodes.push(...parseJsonToNodes(value, currentPath, level + 1));
        }
      });
    }
    return nodes;
  };

  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const handleExtractClick = (
    source: 'response_body' | 'response_header' | 'response_cookie',
    path: string,
    value: any
  ) => {
    const suggestedName =
      path.split('.').pop()?.replace(/[[\]]/g, '') || 'extractedValue';
    const sanitizedName = sanitizeVariableName(suggestedName);
    setVariableName(sanitizedName);
    setExtractionModal({
      isOpen: true,
      source,
      path,
      value,
      suggestedName: sanitizedName,
    });
  };

  const confirmExtraction = () => {
    if (extractionModal && variableName) {
      const sanitized = sanitizeVariableName(variableName);
      const finalVariableName = `E_${sanitized}`;
      setExtractedVariables({
        ...extractedVariables,
        [finalVariableName]: extractionModal.value,
      });
      setExtractionModal(null);
      setVariableName('');
    }
  };

  const removeExtraction = (name: string) => {
    const newExtracted = { ...extractedVariables };
    delete newExtracted[name];
    setExtractedVariables(newExtracted);
  };

  const isValueExtracted = (value: any): boolean => {
    return Object.values(extractedVariables).some(
      (extractedVal) => JSON.stringify(extractedVal) === JSON.stringify(value)
    );
  };

  const renderJsonValue = (node: JsonNode) => {
    const isExpanded = expandedNodes.has(node.path);
    const hasChildren = node.type === 'object' || node.type === 'array';
    const isAlreadyExtracted = !hasChildren && isValueExtracted(node.value);

    // Search filtering
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesKey = node.key.toLowerCase().includes(searchLower);
      const matchesValue =
        !hasChildren && String(node.value).toLowerCase().includes(searchLower);
      const matchesPath = node.path.toLowerCase().includes(searchLower);

      if (!matchesKey && !matchesValue && !matchesPath) {
        return null;
      }
    }

    return (
      <div
        key={node.path}
        className='group hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors rounded'
        style={{ marginLeft: `${node.level * 20}px` }}
      >
        <div className='flex items-center px-2'>
          <div className='flex items-center flex-1 min-w-0'>
            {hasChildren && (
              <button
                onClick={() => toggleNode(node.path)}
                className='p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded mr-1 flex-shrink-0'
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <ChevronDown className='w-3 h-3 text-gray-500' />
                ) : (
                  <ChevronRight className='w-3 h-3 text-gray-500' />
                )}
              </button>
            )}
            {!hasChildren && <div className='w-5' />}
            <span className='text-blue-600 dark:text-blue-400 font-medium mr-2 text-sm flex-shrink-0'>
              {node.key}:
            </span>
            {hasChildren ? (
              <span className='text-gray-500 text-sm'>
                {node.type === 'array'
                  ? `[${Array.isArray(node.value) ? node.value.length : 0}]`
                  : `{${Object.keys(node.value || {}).length}}`}
              </span>
            ) : (
              <span
                className={`text-sm font-mono truncate ${
                  node.type === 'string'
                    ? 'text-green-600 dark:text-green-400'
                    : node.type === 'number'
                    ? 'text-purple-600 dark:text-purple-400'
                    : node.type === 'boolean'
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {node.type === 'string'
                  ? `"${node.value}"`
                  : String(node.value)}
              </span>
            )}
          </div>
          {!hasChildren && (
            <div className='flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2'>
              <button
                onClick={() =>
                  handleCopy(String(node.value), `copy-${node.path}`)
                }
                className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded'
                title='Copy value'
              >
                {copiedItem === `copy-${node.path}` ? (
                  <CheckCircle className='w-3 h-3 text-green-600' />
                ) : (
                  <Copy className='w-3 h-3' />
                )}
              </button>
              {isAlreadyExtracted ? (
                <div className='flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs whitespace-nowrap'>
                  <CheckCircle className='w-3 h-3' />
                  <span>Extracted</span>
                </div>
              ) : (
                <button
                  onClick={() =>
                    handleExtractClick('response_body', node.path, node.value)
                  }
                  className='px-2 py-1 bg-[#136fb0] text-white rounded text-xs hover:bg-blue-700 transition-colors whitespace-nowrap flex items-center'
                  title='Extract as variable'
                >
                  <Plus className='w-3 h-3 mr-1' />
                  Extract
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const jsonNodes = useMemo(() => {
    if (!responseData?.body) return [];
    return parseJsonToNodes(responseData.body);
  }, [responseData?.body]);

  const renderJsonTree = () => {
    try {
      const visibleNodes = jsonNodes.filter((node) => {
        // Root level nodes are always considered for rendering
        if (node.level === 0) return true;
        // Check if parent is expanded
        return expandedNodes.has(node.parentPath);
      });

      return (
        <div className='space-y-1 bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700'>
          {visibleNodes.map((node) => renderJsonValue(node))}
        </div>
      );
    } catch (error) {
      console.error('[v0] JSON parsing error:', error);
      return (
        <div className='p-4 bg-gray-50 dark:bg-gray-800 rounded border'>
          <p className='text-gray-600 dark:text-gray-400 text-sm'>
            Unable to parse response
          </p>
        </div>
      );
    }
  };

  const renderHeadersTab = () => (
    <div className='space-y-2'>
      {Object.entries(responseData.headers).map(([key, value]) => {
        const isAlreadyExtracted = isValueExtracted(value);
        return (
          <div
            key={key}
            className='group flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-900'
          >
            <div className='flex-1 min-w-0 mr-4'>
              <div className='flex items-center space-x-2'>
                <Hash className='w-4 h-4 text-gray-400 flex-shrink-0' />
                <span className='font-medium text-gray-900 dark:text-white text-sm'>
                  {key}
                </span>
              </div>
              <p className='text-sm text-gray-600 dark:text-gray-400 font-mono mt-1 break-all'>
                {value}
              </p>
            </div>
            <div className='flex items-center space-x-2 flex-shrink-0'>
              <button
                onClick={() => handleCopy(value, `header-${key}`)}
                className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded'
                title='Copy value'
              >
                {copiedItem === `header-${key}` ? (
                  <CheckCircle className='w-4 h-4 text-green-600' />
                ) : (
                  <Copy className='w-4 h-4' />
                )}
              </button>
              {isAlreadyExtracted ? (
                <div className='flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs whitespace-nowrap'>
                  <CheckCircle className='w-3 h-3' />
                  <span>Extracted</span>
                </div>
              ) : (
                <button
                  onClick={() =>
                    handleExtractClick('response_header', key, value)
                  }
                  className='px-3 py-1 bg-[#136fb0] text-white rounded text-sm hover:bg-blue-700 transition-colors whitespace-nowrap flex items-center'
                >
                  <Plus className='w-4 h-4 mr-1' />
                  Extract
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const StatusSummary = () => (
    <div className='flex items-center space-x-4 text-sm'>
      <div className='flex items-center space-x-1'>
        <CheckCircle
          className={`h-4 w-4 ${getStatusColor(responseData.status)}`}
        />
        <span className={`font-medium ${getStatusColor(responseData.status)}`}>
          {responseData.status} {responseData.statusText}
        </span>
      </div>
      <div className='flex items-center space-x-1'>
        <Clock className='h-4 w-4 text-gray-500' />
        <span className='font-medium text-gray-900 dark:text-white'>
          {responseData.metrics?.responseTime || 0}ms
        </span>
      </div>
      <div className='flex items-center space-x-1'>
        <HardDrive className='h-4 w-4 text-gray-500' />
        <span className='font-medium text-gray-900 dark:text-white'>
          {calculateResponseSize(responseData.body)}
        </span>
      </div>
    </div>
  );

  const tabs = [
    { id: 'body', label: 'Body', icon: Code },
    {
      id: 'headers',
      label: 'Headers',
      icon: Hash,
      count: Object.keys(responseData?.headers || {}).length,
    },
    { id: 'cookies', label: 'Cookies', icon: Cookie },
    { id: 'test-results', label: 'Test Results' },
    { id: 'schema', label: 'Schema' },
  ];

  if (!responseData) {
    return (
      <div className='flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4'>
        <div className='text-center'>
          <p className='text-gray-500 dark:text-gray-400 mb-4'>
            No response yet
          </p>
          <p className='text-sm text-gray-400'>
            Send a request to see the response here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 min-h-0 overflow-hidden'>
      {/* Header with tabs and status */}
      <div className='bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-shrink-0'>
        <div className='flex items-center justify-between px-4 py-3'>
          <StatusSummary />
          <div className='flex items-center space-x-2'>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className='p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
              title='Search in response'
            >
              <Search className='h-4 w-4' />
            </button>
            <button
              onClick={() =>
                handleCopy(
                  JSON.stringify(responseData.body, null, 2),
                  'full-response'
                )
              }
              className='p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
              title='Copy response'
            >
              {copiedItem === 'full-response' ? (
                <CheckCircle className='h-4 w-4 text-green-600' />
              ) : (
                <Copy className='h-4 w-4' />
              )}
            </button>
            <button
              onClick={downloadResponse}
              className='p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
              title='Download response'
            >
              <Download className='h-4 w-4' />
            </button>
          </div>
        </div>

        <nav className='flex space-x-8 px-4 border-b border-gray-200 dark:border-gray-700'>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {Icon && <Icon className='w-4 h-4' />}
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className='ml-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5 text-xs'>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {showSearch && (
          <div className='px-4 py-3 border-b border-gray-200 dark:border-gray-700'>
            <div className='flex items-center space-x-2'>
              <div className='flex-1 relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <input
                  type='text'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Search in response...'
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm'
                  autoFocus
                />
              </div>
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className='p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
              >
                <X className='h-4 w-4' />
              </button>
            </div>
          </div>
        )}
      </div>

      {Object.keys(extractedVariables).length > 0 && (
        <div className='bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 px-4 py-3 flex-shrink-0'>
          <div className='flex items-center justify-between mb-2'>
            <h4 className='font-medium text-green-900 dark:text-green-300 flex items-center space-x-2'>
              <CheckCircle className='w-4 h-4' />
              <span>
                Extracted Variables ({Object.keys(extractedVariables).length})
              </span>
            </h4>
          </div>
          <div className='flex flex-col gap-1.5 max-h-32 overflow-y-auto'>
            {Object.entries(extractedVariables).map(([name, value]) => (
              <div
                key={name}
                className='bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-lg p-2.5'
              >
                <div className='flex items-start gap-2'>
                  {/* Left side: variable name and value stacked */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-1.5 mb-1'>
                      <span className='font-medium text-gray-900 dark:text-white text-sm truncate'>
                        {name}:
                      </span>
                      <button
                        onClick={() => handleCopy(name, `var-${name}`)}
                        className='p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded flex-shrink-0'
                      >
                        {copiedItem === `var-${name}` ? (
                          <CheckCircle className='w-3 h-3 text-green-600' />
                        ) : (
                          <Copy className='w-3 h-3' />
                        )}
                      </button>
                    </div>
                    <div className='bg-gray-50 dark:bg-gray-900 px-2 rounded border text-xs font-mono overflow-x-auto text-gray-700 dark:text-gray-300'>
                      {typeof value === 'object'
                        ? JSON.stringify(value)
                        : String(value)}
                    </div>
                  </div>
                  {/* Right side: delete button */}
                  <button
                    onClick={() => removeExtraction(name)}
                    className='p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex-shrink-0'
                    title='Remove extraction'
                  >
                    <Trash2 className='w-3 h-3' />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className='flex-1 overflow-auto p-4'>
        {activeTab === 'body' && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between mb-2'>
              <div className='flex items-center space-x-2'>
                <h3 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  Response Body
                </h3>
                <div className='relative group'>
                  <Info className='w-4 h-4 text-gray-400 cursor-help' />
                  <div className='absolute left-0 bottom-full mb-2 w-64 p-3 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50'>
                    <p className='font-medium mb-1'>
                      How to extract variables:
                    </p>
                    <ul className='list-disc list-inside space-y-1'>
                      <li>Hover over any value in the JSON</li>
                      <li>Click the "Extract" button</li>
                      <li>Give it a name and confirm</li>
                      <li>Use the variable in future requests</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            {renderJsonTree()}
          </div>
        )}

        {activeTab === 'headers' && renderHeadersTab()}

        {activeTab === 'cookies' && (
          <div className='text-center py-8 text-gray-500'>
            <Cookie className='w-12 h-12 text-gray-300 mx-auto mb-3' />
            <p>No cookies found in response</p>
          </div>
        )}

        {activeTab === 'test-results' && responseData.assertionLogs && (
          <div className='space-y-4'>
            {responseData.assertionLogs.map((assertion) => (
              <div
                key={assertion.id}
                className={`border rounded-lg p-4 ${
                  assertion.status === 'passed'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className='flex items-center space-x-2'>
                  {assertion.status === 'passed' ? (
                    <CheckCircle className='h-5 w-5 text-green-600' />
                  ) : (
                    <X className='h-5 w-5 text-red-600' />
                  )}
                  <h4 className='font-medium'>{assertion.description}</h4>
                </div>
                {assertion.errorMessage && (
                  <p className='mt-2 text-sm text-red-700 dark:text-red-300'>
                    {assertion.errorMessage}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'schema' && (
          <div className='text-center py-8 text-gray-500'>
            <Code className='w-12 h-12 text-gray-300 mx-auto mb-3' />
            <p>No schema validation configured</p>
          </div>
        )}
      </div>

      {/* Extraction Modal */}
      {extractionModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col'>
            <div className='p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Extract Variable
              </h3>
              <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                Configure how to extract and store this value
              </p>
            </div>
            <div className='p-4 space-y-3 overflow-y-auto flex-1'>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Variable Name
                </label>
                <input
                  type='text'
                  value={variableName}
                  onChange={(e) => setVariableName(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='variable_name'
                  autoFocus
                />
                <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                  Only letters, numbers, and underscores. Will be prefixed with
                  "E_"
                </p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Source
                </label>
                <input
                  type='text'
                  value={extractionModal.source.replace(/_/g, ' ')}
                  readOnly
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 font-mono text-sm capitalize'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Path
                </label>
                <input
                  type='text'
                  value={extractionModal.path}
                  readOnly
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 font-mono text-sm'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Preview Value
                </label>
                <div className='p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto max-h-40'>
                  <code className='text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-all'>
                    {typeof extractionModal.value === 'object'
                      ? JSON.stringify(extractionModal.value, null, 2)
                      : String(extractionModal.value)}
                  </code>
                </div>
              </div>
            </div>
            <div className='flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0'>
              <button
                onClick={() => {
                  setExtractionModal(null);
                  setVariableName('');
                }}
                className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300'
              >
                Cancel
              </button>
              <button
                onClick={confirmExtraction}
                disabled={!variableName.trim()}
                className='px-4 py-2 bg-[#136fb0] text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors'
              >
                Extract Variable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponseViewer;
