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
    | 'body'
    | 'headers'
    | 'cookies'
    | 'test-results'
    | 'schema'
    | 'actual-request'
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
    if (status >= 200 && status < 300) return 'text-success';
    if (status >= 300 && status < 400) return 'text-warning';
    if (status >= 400 && status < 500) return 'text-orange-600';
    if (status >= 500) return 'text-destructive';
    return 'text-muted-foreground';
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

  const parseRequestFromCurl = () => {
    if (responseData?.actualRequest) {
      return responseData.actualRequest;
    }

    if (!responseData?.requestCurl) return null;

    const curlCommand = responseData.requestCurl;
    const methodMatch = curlCommand.match(/-X '(\w+)'/);
    const urlMatch = curlCommand.match(/'(https?:\/\/[^']+)'/);
    const bodyMatch = curlCommand.match(/-d '({[^']+})'/);

    const headerMatches = curlCommand.matchAll(/-H '([^:]+):\s*([^']+)'/g);
    const headers: Record<string, string> = {};
    for (const match of headerMatches) {
      headers[match[1]] = match[2];
    }

    return {
      method: methodMatch?.[1] || 'GET',
      url: urlMatch?.[1] || '',
      headers,
      body: bodyMatch?.[1] ? JSON.parse(bodyMatch[1]) : null,
    };
  };
  const requestDetails = parseRequestFromCurl();

  const renderJsonValue = (node: JsonNode) => {
    const isExpanded = expandedNodes.has(node.path);
    const hasChildren = node.type === 'object' || node.type === 'array';
    const isAlreadyExtracted = !hasChildren && isValueExtracted(node.value);

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
        className='group hover:bg-accent transition-colors rounded'
        style={{ marginLeft: `${node.level * 20}px` }}
      >
        <div className='flex items-center px-2'>
          <div className='flex items-center flex-1 min-w-0'>
            {hasChildren && (
              <button
                onClick={() => toggleNode(node.path)}
                className='p-1 hover:bg-muted rounded mr-1 flex-shrink-0'
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <ChevronDown className='w-3 h-3 text-muted-foreground' />
                ) : (
                  <ChevronRight className='w-3 h-3 text-muted-foreground' />
                )}
              </button>
            )}
            {!hasChildren && <div className='w-5' />}
            <span className='text-primary font-medium mr-2 text-sm flex-shrink-0'>
              {node.key}:
            </span>
            {hasChildren ? (
              <span className='text-muted-foreground text-sm'>
                {node.type === 'array'
                  ? `[${Array.isArray(node.value) ? node.value.length : 0}]`
                  : `{${Object.keys(node.value || {}).length}}`}
              </span>
            ) : (
              <span
                className={`text-sm font-mono truncate ${
                  node.type === 'string'
                    ? 'text-success'
                    : node.type === 'number'
                    ? 'text-purple-600 dark:text-purple-400'
                    : node.type === 'boolean'
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-muted-foreground'
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
                className='p-1 text-muted-foreground hover:text-foreground rounded'
                title='Copy value'
              >
                {copiedItem === `copy-${node.path}` ? (
                  <CheckCircle className='w-3 h-3 text-success' />
                ) : (
                  <Copy className='w-3 h-3' />
                )}
              </button>
              {/* {isAlreadyExtracted ? (
                <div className='flex items-center space-x-1 px-2 py-1 bg-success/10 text-success rounded text-xs whitespace-nowrap'>
                  <CheckCircle className='w-3 h-3' />
                  <span>Extracted</span>
                </div>
              ) : (
                <button
                  onClick={() =>
                    handleExtractClick('response_body', node.path, node.value)
                  }
                  className='px-2 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90 transition-colors whitespace-nowrap flex items-center'
                  title='Extract as variable'
                >
                  <Plus className='w-3 h-3 mr-1' />
                  Extract
                </button>
              )} */}
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
      let nodesToShow = new Set<string>();
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        jsonNodes.forEach((node) => {
          const matchesKey = node.key.toLowerCase().includes(searchLower);
          const hasChildren = node.type === 'object' || node.type === 'array';
          const matchesValue =
            !hasChildren &&
            String(node.value).toLowerCase().includes(searchLower);
          const matchesPath = node.path.toLowerCase().includes(searchLower);

          if (matchesKey || matchesValue || matchesPath) {
            nodesToShow.add(node.path);
            let parentPath = node.parentPath;
            while (parentPath && parentPath !== 'root') {
              nodesToShow.add(parentPath);
              const parentNode = jsonNodes.find((n) => n.path === parentPath);
              if (parentNode) {
                parentPath = parentNode.parentPath;
              } else {
                break;
              }
            }
          }
        });
      }

      const visibleNodes = jsonNodes.filter((node) => {
        if (node.level === 0) return true;
        if (searchQuery) {
          return (
            nodesToShow.has(node.path) &&
            (node.parentPath === 'root' ||
              nodesToShow.has(node.parentPath) ||
              expandedNodes.has(node.parentPath))
          );
        }
        return expandedNodes.has(node.parentPath);
      });

      return (
        <div className='space-y-1 bg-card p-2 rounded-lg border border-border'>
          {visibleNodes.map((node) => renderJsonValue(node))}
        </div>
      );
    } catch (error) {
      console.error('JSON parsing error:', error);
      return (
        <div className='p-2 bg-muted rounded border'>
          <p className='text-muted-foreground text-sm'>
            Unable to parse response
          </p>
        </div>
      );
    }
  };

  const renderHeadersTab = () => (
    <div className='space-y-2'>
      {Object.entries(responseData?.headers || {}).map(([key, value]) => {
        const isAlreadyExtracted = isValueExtracted(value);
        return (
          <div
            key={key}
            className='group flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent bg-card'
          >
            <div className='flex-1 min-w-0 mr-4'>
              <div className='flex items-center space-x-2'>
                <Hash className='w-4 h-4 text-muted-foreground flex-shrink-0' />
                <span className='font-medium text-foreground text-sm'>
                  {key}
                </span>
              </div>
              <p className='text-sm text-muted-foreground font-mono mt-1 break-all'>
                {value}
              </p>
            </div>
            <div className='flex items-center space-x-2 flex-shrink-0'>
              <button
                onClick={() => handleCopy(value, `header-${key}`)}
                className='p-1 text-muted-foreground hover:text-foreground rounded'
                title='Copy value'
              >
                {copiedItem === `header-${key}` ? (
                  <CheckCircle className='w-4 h-4 text-success' />
                ) : (
                  <Copy className='w-4 h-4' />
                )}
              </button>
              {isAlreadyExtracted ? (
                <div className='flex items-center space-x-1 px-2 py-1 bg-success/10 text-success rounded text-xs whitespace-nowrap'>
                  <CheckCircle className='w-3 h-3' />
                  <span>Extracted</span>
                </div>
              ) : (
                <button
                  onClick={() =>
                    handleExtractClick('response_header', key, value)
                  }
                  className='px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors whitespace-nowrap flex items-center'
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

  const StatusSummary = () => {
    if (!responseData) return null;

    return (
      <div className='flex items-center space-x-4 text-sm'>
        <div className='flex items-center space-x-1'>
          <CheckCircle
            className={`h-4 w-4 ${getStatusColor(responseData.status)}`}
          />
          <span
            className={`font-medium ${getStatusColor(responseData.status)}`}
          >
            {responseData.status} {responseData.statusText || ''}
          </span>
        </div>
        <div className='flex items-center space-x-1'>
          <Clock className='h-4 w-4 text-muted-foreground' />
          <span className='font-medium text-foreground'>
            {responseData.metrics?.responseTime || 0}ms
          </span>
        </div>
        <div className='flex items-center space-x-1'>
          <HardDrive className='h-4 w-4 text-muted-foreground' />
          <span className='font-medium text-foreground'>
            {calculateResponseSize(responseData.body)}
          </span>
        </div>
      </div>
    );
  };

  const tabs = [
    {
      id: 'body',
      label: 'Body',
      hasIndicator: !!responseData?.bodySchema,
    },
    {
      id: 'headers',
      label: 'Headers',
      // count: Object.keys(responseData?.headers || {}).length,
    },
    { id: 'cookies', label: 'Cookies' },
    {
      id: 'test-results',
      label: 'Assertions(R)',
      hasIndicator:
        !!responseData?.assertionLogs && responseData.assertionLogs.length > 0,
    },
    {
      id: 'schema',
      label: 'Schema(R)',
      hasIndicator: !!responseData?.schemaValidation,
    },
    {
      id: 'actual-request',
      label: 'Actual Request',
      hasIndicator: !!responseData?.requestCurl,
    },
  ];

  if (!responseData) {
    return (
      <div className='flex-1 flex items-center justify-center bg-background p-2'>
        <div className='text-center'>
          <p className='text-muted-foreground mb-4'>No response yet</p>
          <p className='text-sm text-muted-foreground'>
            Send a request to see the response here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex-1 flex flex-col bg-background min-h-0 overflow-hidden'>
      <div className='bg-card border-b border-border flex-shrink-0'>
        <div className='flex items-center justify-between border-b border-border'>
          <nav className='flex space-x-8 px-4 whitespace-nowrap overflow-x-auto no-scrollbar'>
            {tabs.map((tab) => {
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.hasIndicator && (
                    <span className='ml-1 w-1.5 h-1.5 bg-blue-500 rounded-full' />
                  )}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className='ml-1 bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs'>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className='px-4'>
            <StatusSummary />
          </div>
        </div>

        {/* View toggles and action buttons */}
        <div className='flex items-center justify-between px-4 py-1'>
          <div className='flex items-center space-x-4'>
            <button className='flex items-center space-x-2 text-sm font-medium text-primary'>
              <CheckCircle className='w-4 h-4' />
              <span>Pretty</span>
            </button>
            <button className='flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground'>
              <Code className='w-4 h-4' />
              <span>Raw</span>
            </button>
            <button className='flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground'>
              <span>Preview</span>
            </button>
          </div>

          <div className='flex items-center space-x-2'>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className='p-2 rounded-md hover:bg-accent text-muted-foreground'
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
              className='p-2 rounded-md hover:bg-accent text-muted-foreground'
              title='Copy response'
            >
              {copiedItem === 'full-response' ? (
                <CheckCircle className='h-4 w-4 text-success' />
              ) : (
                <Copy className='h-4 w-4' />
              )}
            </button>
            <button
              onClick={downloadResponse}
              className='p-2 rounded-md hover:bg-accent text-muted-foreground'
              title='Download response'
            >
              <Download className='h-4 w-4' />
            </button>
          </div>
        </div>

        {showSearch && (
          <div className='px-4 py-2 border-b border-border'>
            <div className='flex items-center space-x-2'>
              <div className='flex-1 relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <input
                  type='text'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Search in response...'
                  className='w-full pl-10 pr-4 py-2 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground text-sm'
                  autoFocus
                />
              </div>
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className='p-2 rounded-md hover:bg-accent text-muted-foreground'
              >
                <X className='h-4 w-4' />
              </button>
            </div>
          </div>
        )}
      </div>

      {Object.keys(extractedVariables).length > 0 && (
        <div className='bg-success/10 border-b border-success/20 px-4 py-2 flex-shrink-0'>
          <div className='flex items-center justify-between mb-2'>
            <h4 className='font-medium text-success flex items-center space-x-2'>
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
                className='bg-card border border-success/20 rounded-lg p-2.5'
              >
                <div className='flex items-start gap-2'>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-1.5 mb-1'>
                      <span className='font-medium text-foreground text-sm truncate'>
                        {name}:
                      </span>
                      <button
                        onClick={() => handleCopy(name, `var-${name}`)}
                        className='p-1 text-primary hover:bg-primary/10 rounded flex-shrink-0'
                      >
                        {copiedItem === `var-${name}` ? (
                          <CheckCircle className='w-3 h-3 text-success' />
                        ) : (
                          <Copy className='w-3 h-3' />
                        )}
                      </button>
                    </div>
                    <div className='bg-muted px-2 rounded border text-xs font-mono overflow-x-auto text-muted-foreground'>
                      {typeof value === 'object'
                        ? JSON.stringify(value)
                        : String(value)}
                    </div>
                  </div>
                  <button
                    onClick={() => removeExtraction(name)}
                    className='p-1 text-destructive hover:bg-destructive/10 rounded flex-shrink-0'
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

      <div className='flex-1 overflow-auto p-2'>
        {activeTab === 'body' && (
          <div>
            <div className='flex items-center justify-between mb-2'></div>
            {renderJsonTree()}
          </div>
        )}

        {activeTab === 'headers' && renderHeadersTab()}

        {activeTab === 'cookies' && (
          <div className='text-center py-8 text-muted-foreground'>
            <Cookie className='w-12 h-12 text-muted mx-auto mb-3' />
            <p>No cookies found in response</p>
          </div>
        )}

        {activeTab === 'test-results' && responseData.assertionLogs && (
          <div className='space-y-2'>
            {responseData.assertionLogs.map((assertion) => (
              <div
                key={assertion.id}
                className={`border rounded-lg p-2 ${
                  assertion.status === 'passed'
                    ? 'bg-success/10 border-success/20'
                    : 'bg-destructive/10 border-destructive/20'
                }`}
              >
                <div className='flex items-center space-x-2'>
                  {assertion.status === 'passed' ? (
                    <CheckCircle className='h-5 w-5 text-success' />
                  ) : (
                    <X className='h-5 w-5 text-destructive' />
                  )}
                  <h4 className='font-medium'>{assertion.description}</h4>
                </div>
                {assertion.errorMessage && (
                  <p className='mt-2 text-sm text-destructive'>
                    {assertion.errorMessage}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'schema' && (
          <div className='p-4 overflow-auto h-full'>
            {responseData.schemaValidation ? (
              <div className='space-y-4'>
                <div
                  className={`border rounded-lg p-4 ${
                    responseData.schemaValidation.passed
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className='flex items-center space-x-2'>
                    {responseData.schemaValidation.passed ? (
                      <CheckCircle className='h-5 w-5 text-green-600 flex-shrink-0' />
                    ) : (
                      <X className='h-5 w-5 text-red-600 flex-shrink-0' />
                    )}
                    <div>
                      <h3
                        className={`font-medium ${
                          responseData.schemaValidation.passed
                            ? 'text-green-800 dark:text-green-300'
                            : 'text-red-800 dark:text-red-300'
                        }`}
                      >
                        Schema Validation{' '}
                        {responseData.schemaValidation.passed
                          ? 'Passed'
                          : 'Failed'}
                      </h3>
                      <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                        Schema: {responseData.schemaValidation.name}
                      </p>
                    </div>
                  </div>
                </div>

                {!responseData.schemaValidation.passed &&
                  responseData.schemaValidation.results?.length > 0 && (
                    <div className='border rounded-lg p-4 bg-white dark:bg-gray-900'>
                      <h4 className='font-medium text-sm mb-3 text-red-700 dark:text-red-400'>
                        Validation Errors:
                      </h4>
                      <ul className='space-y-2 text-sm'>
                        {responseData.schemaValidation.results.map(
                          (issue: any, idx: number) => (
                            <li
                              key={idx}
                              className='flex flex-col border-l-2 border-red-400 pl-2'
                            >
                              <span className='font-medium text-gray-800 dark:text-gray-200'>
                                {issue.field}
                              </span>
                              <span className='text-gray-600 dark:text-gray-400'>
                                {issue.description}
                              </span>
                              {issue.value !== undefined &&
                                issue.value !== null && (
                                  <span className='text-xs text-gray-400'>
                                    Value: {String(issue.value)}
                                  </span>
                                )}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            ) : (
              <div className='text-center py-8'>
                <div className='text-gray-500 dark:text-gray-400 mb-2'>
                  No schema validation results
                </div>
                <div className='text-sm text-gray-400'>
                  Schema validation will appear here when available
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'actual-request' && requestDetails && (
          <div className='space-y-4'>
            {/* Request URL */}
            <div className='bg-card border border-border rounded-lg p-4'>
              <h3 className='text-sm font-semibold text-foreground mb-3'>
                Request URL:
              </h3>
              <div className='flex items-center space-x-3'>
                <span className='px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded font-semibold text-sm'>
                  {requestDetails.method}
                </span>
                <span className='text-sm text-foreground font-mono flex-1 truncate'>
                  {requestDetails.url}
                </span>
                <button
                  onClick={() => handleCopy(requestDetails.url, 'request-url')}
                  className='p-1 text-muted-foreground hover:text-foreground rounded'
                  title='Copy URL'
                >
                  {copiedItem === 'request-url' ? (
                    <CheckCircle className='w-4 h-4 text-success' />
                  ) : (
                    <Copy className='w-4 h-4' />
                  )}
                </button>
              </div>
            </div>

            {/* Headers */}
            <div className='bg-card border border-border rounded-lg p-4'>
              <h3 className='text-sm font-semibold text-foreground mb-3'>
                Headers:
              </h3>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b border-border'>
                      <th className='text-left py-2 px-3 text-muted-foreground font-semibold'>
                        Name
                      </th>
                      <th className='text-left py-2 px-3 text-muted-foreground font-semibold'>
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(requestDetails.headers).map(
                      ([name, value]) => (
                        <tr
                          key={name}
                          className='border-b border-border hover:bg-accent transition-colors'
                        >
                          <td className='py-2 px-3 text-foreground font-medium'>
                            {name}
                          </td>
                          <td className='py-2 px-3 text-muted-foreground font-mono'>
                            {String(value)}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Body */}
            {requestDetails.body && (
              <div className='bg-card border border-border rounded-lg p-4'>
                <div className='flex items-center justify-between mb-3'>
                  <h3 className='text-sm font-semibold text-foreground'>
                    Body:
                  </h3>
                  <span className='text-xs text-muted-foreground bg-muted px-2 py-1 rounded'>
                    Body Type: application/json
                  </span>
                </div>
                <div className='bg-muted rounded-lg p-3 relative'>
                  <button
                    onClick={() =>
                      handleCopy(
                        JSON.stringify(requestDetails.body, null, 2),
                        'request-body'
                      )
                    }
                    className='absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground rounded'
                    title='Copy body'
                  >
                    {copiedItem === 'request-body' ? (
                      <CheckCircle className='w-4 h-4 text-success' />
                    ) : (
                      <Copy className='w-4 h-4' />
                    )}
                  </button>
                  <pre className='text-sm text-foreground font-mono overflow-x-auto'>
                    {JSON.stringify(requestDetails.body, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Extraction Modal */}
      {extractionModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2'>
          <div className='bg-card rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border border-border'>
            <div className='p-2 border-b border-border flex-shrink-0'>
              <h3 className='text-lg font-semibold text-foreground'>
                Extract Variable
              </h3>
              <p className='text-sm text-muted-foreground mt-1'>
                Configure how to extract and store this value
              </p>
            </div>
            <div className='p-2 space-y-3 overflow-y-auto flex-1'>
              <div>
                <label className='block text-sm font-medium text-foreground mb-1'>
                  Variable Name
                </label>
                <input
                  type='text'
                  value={variableName}
                  onChange={(e) => setVariableName(e.target.value)}
                  className='w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground font-mono text-sm focus:ring-2 focus:ring-ring focus:border-transparent'
                  placeholder='variable_name'
                  autoFocus
                />
                <p className='text-xs text-muted-foreground mt-1'>
                  Only letters, numbers, and underscores. Will be prefixed with
                  "E_"
                </p>
              </div>
              <div>
                <label className='block text-sm font-medium text-foreground mb-1'>
                  Source
                </label>
                <input
                  type='text'
                  value={extractionModal.source.replace(/_/g, ' ')}
                  readOnly
                  className='w-full px-3 py-2 border border-input rounded-lg bg-muted font-mono text-sm capitalize'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-foreground mb-1'>
                  Path
                </label>
                <input
                  type='text'
                  value={extractionModal.path}
                  readOnly
                  className='w-full px-3 py-2 border border-input rounded-lg bg-muted font-mono text-sm'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-foreground mb-1'>
                  Preview Value
                </label>
                <div className='p-3 bg-muted rounded-lg border border-border overflow-x-auto max-h-40'>
                  <code className='text-sm text-foreground whitespace-pre-wrap break-all'>
                    {typeof extractionModal.value === 'object'
                      ? JSON.stringify(extractionModal.value, null, 2)
                      : String(extractionModal.value)}
                  </code>
                </div>
              </div>
            </div>
            <div className='flex items-center justify-end space-x-3 p-2 border-t border-border flex-shrink-0'>
              <button
                onClick={() => {
                  setExtractionModal(null);
                  setVariableName('');
                }}
                className='px-4 py-2 border border-input rounded-lg hover:bg-accent transition-colors text-foreground'
              >
                Cancel
              </button>
              <button
                onClick={confirmExtraction}
                disabled={!variableName.trim()}
                className='px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors'
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
