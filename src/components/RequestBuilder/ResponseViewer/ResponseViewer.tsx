'use client';

import type React from 'react';
import { useState, useMemo, useEffect } from 'react';
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
  Code,
  Hash,
  Cookie,
} from 'lucide-react';
import { useRequest } from '@/hooks/useRequest';
import AssertionModal from './AssertionModal';
import { useDataManagement } from '@/hooks/useDataManagement';
import { generateDynamicValueById } from '@/lib/request-utils';

interface JsonNode {
  key: string;
  value: any;
  path: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  level: number;
  parentPath: string;
  childCount?: number;
}

export interface Assertion {
  id: string | number;
  type: string;
  displayType?: string;
  category?: string;
  description: string;
  field?: string;
  path?: string;
  value?: any;
  expectedValue?: any;
  enabled?: boolean;
  isGeneral?: boolean;
  operator?: string;
  comparison?: string;
  expectedTime?: string;
  expectedSize?: string;
  scope?: 'full' | 'field';
}

const ResponseViewer = () => {
  const { responseData, assertions, setAssertions } = useRequest();
  const { variables, dynamicVariables } = useDataManagement();

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
  const [copiedItem, setCopiedItem] = useState('');
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [showAssertionModal, setShowAssertionModal] = useState(false);
  const [activeFieldPath, setActiveFieldPath] = useState('');
  const [activeFieldValue, setActiveFieldValue] = useState<any>(null);

  const formattedVariables = useMemo(() => {
    const formatted: Array<{ name: string; value: string }> = [];

    const isValidVar = (name: string) =>
      name.startsWith('S_') || name.startsWith('D_');

    // Format static variables
    if (Array.isArray(variables)) {
      variables.forEach((variable: any) => {
        const name = variable.name || variable.key || '';
        const value =
          variable.value ||
          variable.initialValue ||
          variable.currentValue ||
          '';
        if (name && isValidVar(name)) {
          formatted.push({ name, value: String(value) });
        }
      });
    }

    // Format dynamic variables
    if (Array.isArray(dynamicVariables)) {
      dynamicVariables.forEach((variable: any) => {
        const name = variable.name || '';
        if (name && isValidVar(name)) {
          const generatedValue = generateDynamicValueById(
            variable.generatorId || '',
            variable.parameters || {}
          );
          formatted.push({ name, value: String(generatedValue) });
        }
      });
    }

    return formatted;
  }, [variables, dynamicVariables]);

  useEffect(() => {
    if (responseData?.body) {
      const allPaths = new Set<string>();
      const collectPaths = (obj: any, path = 'root') => {
        allPaths.add(path);
        if (obj && typeof obj === 'object') {
          if (Array.isArray(obj)) {
            obj.forEach((_, idx) => {
              const newPath = path === 'root' ? `[${idx}]` : `${path}[${idx}]`;
              collectPaths(obj[idx], newPath);
            });
          } else {
            Object.keys(obj).forEach((key) => {
              const newPath = path === 'root' ? key : `${path}.${key}`;
              collectPaths(obj[key], newPath);
            });
          }
        }
      };
      collectPaths(responseData.body);
      setExpandedNodes(allPaths);
    }
  }, [responseData?.body]);

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300)
      return 'text-green-600 dark:text-green-400';
    if (status >= 300 && status < 400)
      return 'text-yellow-600 dark:text-yellow-400';
    if (status >= 400 && status < 500)
      return 'text-orange-600 dark:text-orange-400';
    if (status >= 500) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
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

  const getChildCount = (obj: any): number => {
    if (Array.isArray(obj)) return obj.length;
    if (obj && typeof obj === 'object') return Object.keys(obj).length;
    return 0;
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
          childCount: getChildCount(item),
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
          childCount: getChildCount(value),
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

  const handleAddAssertionClick = (
    fieldPath: string,
    value: any,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    setActiveFieldPath(fieldPath);
    setActiveFieldValue(value);
    setShowAssertionModal(true);
    setHoveredField(fieldPath);
  };

  const handleModalClose = () => {
    setShowAssertionModal(false);
    setHoveredField(null);
    setActiveFieldPath('');
    setActiveFieldValue(null);
  };

  const handleAssertionSelect = (assertionType: string, config?: any) => {
    if (assertionType === 'suggested-multiple' && config?.assertions) {
      const assertionsToEnable = config.assertions;
      const assertionIds = assertionsToEnable.map((a: any) => a.id);

      const updatedAssertions = assertions.map((a: any) =>
        assertionIds.includes(a.id) ? { ...a, enabled: true } : a
      );
      setAssertions(updatedAssertions);
    } else if (assertionType === 'suggested' && config?.assertion) {
      const assertion = config.assertion;
      const updatedAssertions = assertions.map((a: any) =>
        a.id === assertion.id ? { ...a, enabled: true } : a
      );
      setAssertions(updatedAssertions);
    } else {
      let description = '';
      let finalType = assertionType;

      if (config?.isGeneral) {
        switch (assertionType) {
          case 'response-time':
            description = `Response time should be ${
              config.comparison === 'less' ? 'less than' : 'more than'
            } ${config.value}ms`;
            break;
          case 'payload-size':
            description = `Payload size should be ${
              config.comparison === 'less' ? 'less than' : 'more than'
            } ${config.value}KB`;
            break;
          case 'status-code':
            description = `Response status should be ${config.value}`;
            break;
          case 'contains-text':
            description = `Response should contain text: "${config.value}"`;
            finalType = 'contains';
            break;
          case 'contains-number':
            description = `Response should contain number: ${config.value}`;
            finalType = 'contains';
            break;
          case 'contains-boolean':
            description = `Response should contain boolean: ${config.value}`;
            finalType = 'contains';
            break;
          case 'contains-static':
            description = `Response should contain static value: "${
              config.value
            }"${config.scope === 'field' ? ` in ${activeFieldPath}` : ''}`;
            finalType = 'contains';
            break;
          case 'contains-dynamic':
            description = `Response should contain dynamic variable: ${
              config.value
            }${config.scope === 'field' ? ` in ${activeFieldPath}` : ''}`;
            finalType = 'contains';
            break;
          case 'contains-extracted':
            description = `Response should contain extracted variable: ${config.value}`;
            finalType = 'contains';
            break;
          default:
            description = `General assertion: ${assertionType}`;
        }
      } else {
        const operatorLabels: Record<string, string> = {
          equals: 'equals',
          'not-equals': 'does not equal',
          'greater-than': 'is greater than',
          'less-than': 'is less than',
          contains: 'contains',
          'not-contains': 'does not contain',
          'array-length': 'has length',
        };

        const operatorText = operatorLabels[config.operator] || config.operator;
        description = `${activeFieldPath} ${operatorText} "${config.value}"`;
      }

      // Build the base assertion object
      const baseAssertion = {
        id: `manual-${Date.now()}`,
        type: finalType,
        displayType: assertionType,
        category: 'body',
        description,
        value: activeFieldValue,
        expectedValue: config.value,
        enabled: true,
        ...config,
      };

      // Only add field property if it's not a general assertion or if scope is 'field'
      const newAssertion =
        config?.isGeneral && config.scope !== 'field'
          ? baseAssertion
          : { ...baseAssertion, field: activeFieldPath };

      setAssertions([...assertions, newAssertion]);
    }
    handleModalClose();
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

  const renderJsonValue = (node: JsonNode, index: number) => {
    const isExpanded = expandedNodes.has(node.path);
    const hasChildren = node.type === 'object' || node.type === 'array';
    const isHovered = hoveredField === node.path;

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
        className='group flex items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'
        onMouseEnter={() => setHoveredField(node.path)}
        onMouseLeave={() => !showAssertionModal && setHoveredField(null)}
      >
        <div
          className='flex items-center flex-1 py-1 min-w-0'
          style={{ paddingLeft: `${node.level * 16 + 8}px` }}
        >
          <span className='w-8 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 text-right pr-3 select-none'>
            {index + 1}
          </span>
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
            {!hasChildren && <div className='w-5 flex-shrink-0' />}
            <span className='text-blue-600 dark:text-blue-400 font-mono text-sm mr-1'>
              {node.key}:
            </span>

            {hasChildren ? (
              <span className='text-gray-500 dark:text-gray-400 font-mono text-sm'>
                {node.type === 'array'
                  ? `[${Array.isArray(node.value) ? node.value.length : 0}]`
                  : `{${Object.keys(node.value || {}).length}}`}
              </span>
            ) : (
              <span
                className={`font-mono text-sm truncate ${
                  node.type === 'string'
                    ? 'text-green-600 dark:text-green-400'
                    : node.type === 'number'
                    ? 'text-orange-600 dark:text-orange-400'
                    : node.type === 'boolean'
                    ? 'text-purple-600 dark:text-purple-400'
                    : node.type === 'null'
                    ? 'text-gray-500 dark:text-gray-400 italic'
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                {node.type === 'string'
                  ? `"${node.value}"`
                  : String(node.value)}
              </span>
            )}

            {/* Inline action buttons - shown after value */}
            <div className='flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity'>
              {!hasChildren && (
                <button
                  onClick={() =>
                    handleCopy(String(node.value), `copy-${node.path}`)
                  }
                  className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
                  title='Copy value'
                >
                  {copiedItem === `copy-${node.path}` ? (
                    <CheckCircle className='w-3.5 h-3.5 text-green-500' />
                  ) : (
                    <Copy className='w-3.5 h-3.5' />
                  )}
                </button>
              )}
              <button
                onClick={(e) =>
                  handleAddAssertionClick(node.path, node.value, e)
                }
                className='px-1.5 py-0.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors'
              >
                + Assert
              </button>
            </div>
          </div>
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
      const nodesToShow = new Set<string>();
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

      const totalRows = jsonNodes.filter((n) => n.level === 0).length;

      return (
        <div className='flex flex-col h-full'>
          <div className='flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700'>
            <span className='text-xs text-gray-500 dark:text-gray-400'>
              {totalRows} {totalRows === 1 ? 'row' : 'rows'}
            </span>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => {
                  const allPaths = new Set<string>();
                  const collectPaths = (obj: any, path = 'root') => {
                    allPaths.add(path);
                    if (obj && typeof obj === 'object') {
                      if (Array.isArray(obj)) {
                        obj.forEach((_, idx) => {
                          const newPath =
                            path === 'root' ? `[${idx}]` : `${path}[${idx}]`;
                          collectPaths(obj[idx], newPath);
                        });
                      } else {
                        Object.keys(obj).forEach((key) => {
                          const newPath =
                            path === 'root' ? key : `${path}.${key}`;
                          collectPaths(obj[key], newPath);
                        });
                      }
                    }
                  };
                  collectPaths(responseData?.body);
                  setExpandedNodes(allPaths);
                }}
                className='text-xs text-blue-600 dark:text-blue-400 hover:underline'
              >
                Expand All
              </button>
              <button
                onClick={() => setExpandedNodes(new Set())}
                className='text-xs text-blue-600 dark:text-blue-400 hover:underline'
              >
                Collapse All
              </button>
            </div>
          </div>

          <div className='flex-1 overflow-auto'>
            {visibleNodes.map((node, index) => renderJsonValue(node, index))}
          </div>
        </div>
      );
    } catch (error) {
      console.error('JSON parsing error:', error);
      return (
        <div className='flex items-center justify-center h-full'>
          <div className='text-center text-gray-500 dark:text-gray-400'>
            Unable to parse response
          </div>
        </div>
      );
    }
  };

  const renderHeadersTab = () => (
    <div className='divide-y divide-gray-200 dark:divide-gray-700'>
      {Object.entries(responseData?.headers || {}).map(([key, value]) => (
        <div
          key={key}
          className='flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 group'
        >
          <div className='flex items-center gap-3 min-w-0 flex-1'>
            <div className='flex items-center gap-2 min-w-0'>
              <Hash className='w-4 h-4 text-gray-400 flex-shrink-0' />
              <span className='font-medium text-gray-900 dark:text-gray-100 truncate'>
                {key}
              </span>
            </div>
            <div className='text-gray-600 dark:text-gray-400 truncate'>
              {String(value)}
            </div>
          </div>
          <div className='flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
            <button
              onClick={() => handleCopy(value as string, `header-${key}`)}
              className='p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded'
              title='Copy value'
            >
              {copiedItem === `header-${key}` ? (
                <CheckCircle className='w-4 h-4 text-green-500' />
              ) : (
                <Copy className='w-4 h-4' />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const StatusSummary = () => {
    if (!responseData) return null;

    return (
      <div className='flex items-center gap-4 text-sm'>
        <div className='flex items-center gap-1.5'>
          <CheckCircle className='w-4 h-4 text-green-500' />
          <span className={getStatusColor(responseData.status)}>
            {responseData.status} {responseData.statusText || ''}
          </span>
        </div>
        <div className='flex items-center gap-1.5'>
          <Clock className='w-4 h-4 text-gray-400' />
          <span className='text-gray-600 dark:text-gray-400'>
            {responseData.metrics?.responseTime || 0}ms
          </span>
        </div>
        <div className='flex items-center gap-1.5'>
          <HardDrive className='w-4 h-4 text-gray-400' />
          <span className='text-gray-600 dark:text-gray-400'>
            {calculateResponseSize(responseData.body)}
          </span>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'body', label: 'Body' },
    { id: 'headers', label: 'Headers' },
    { id: 'cookies', label: 'Cookies' },
    {
      id: 'test-results',
      label: 'Test Results',
      hasIndicator:
        !!responseData?.assertionLogs && responseData.assertionLogs.length > 0,
    },
    {
      id: 'schema',
      label: 'Schema',
      hasIndicator: !!responseData?.schemaValidation,
    },
    {
      id: 'actual-request',
      label: 'Actual Request',
      hasIndicator: !!responseData?.requestCurl,
    },
  ];

  const requestDetails = parseRequestFromCurl();

  if (!responseData) {
    return (
      <div className='flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900'>
        <div className='text-center'>
          <div className='text-gray-500 dark:text-gray-400 text-lg font-medium'>
            No response yet
          </div>
          <div className='text-gray-400 dark:text-gray-500 text-sm mt-1'>
            Send a request to see the response here
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full bg-white dark:bg-gray-900'>
      <div className='flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4'>
        <div className='flex items-center'>
          <nav className='flex space-x-4'>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab.label}
                {tab.hasIndicator && (
                  <span className='w-2 h-2 bg-blue-500 rounded-full ml-1' />
                )}
              </button>
            ))}
          </nav>
          <div className='ml-6'>
            <StatusSummary />
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <div className='flex items-center border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden'>
            <button className='px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'>
              <Code className='w-4 h-4' />
              Pretty
            </button>
            <button className='px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'>
              <Code className='w-4 h-4' />
              Raw
            </button>
          </div>

          <div className='flex items-center gap-1'>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className='p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              title='Search in response'
            >
              <Search className='w-4 h-4' />
            </button>
            <button
              onClick={() =>
                handleCopy(
                  JSON.stringify(responseData.body, null, 2),
                  'full-response'
                )
              }
              className='p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              title='Copy response'
            >
              {copiedItem === 'full-response' ? (
                <CheckCircle className='w-4 h-4 text-green-500' />
              ) : (
                <Copy className='w-4 h-4' />
              )}
            </button>
            <button
              onClick={downloadResponse}
              className='p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              title='Download response'
            >
              <Download className='w-4 h-4' />
            </button>
          </div>
        </div>

        {showSearch && (
          <div className='absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-2 z-10'>
            <div className='flex items-center gap-2'>
              <div className='flex-1 relative'>
                <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                <input
                  type='text'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Search in response...'
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm'
                  autoFocus
                />
              </div>
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className='p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              >
                <X className='w-4 h-4' />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className='flex-1 overflow-hidden'>
        {activeTab === 'body' && renderJsonTree()}
        {activeTab === 'headers' && renderHeadersTab()}
        {activeTab === 'cookies' && (
          <div className='flex items-center justify-center h-full text-gray-500 dark:text-gray-400'>
            <Cookie className='w-8 h-8 mr-3 opacity-50' />
            <p>No cookies found in response</p>
          </div>
        )}

        {activeTab === 'test-results' &&
          Array.isArray(responseData.assertionLogs) && (
            <div className='p-4 space-y-2'>
              {responseData.assertionLogs.length === 0 ? (
                <div className='text-center text-gray-500 dark:text-gray-400 py-8'>
                  <p>No test results available</p>
                </div>
              ) : (
                responseData.assertionLogs.map(
                  (assertion: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        assertion.status === 'passed'
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      }`}
                    >
                      <div className='flex items-center gap-2'>
                        {assertion.status === 'passed' ? (
                          <CheckCircle className='w-4 h-4 text-green-500' />
                        ) : (
                          <X className='w-4 h-4 text-red-500' />
                        )}
                        <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                          {assertion.description}
                        </span>
                      </div>
                      {assertion.errorMessage && (
                        <div className='mt-2 text-xs text-red-600 dark:text-red-400 pl-6'>
                          {assertion.errorMessage}
                        </div>
                      )}
                    </div>
                  )
                )
              )}
            </div>
          )}

        {activeTab === 'schema' && (
          <div className='p-4'>
            {responseData.schemaValidation ? (
              <div className='space-y-4'>
                <div
                  className={`p-4 rounded-lg border ${
                    responseData.schemaValidation.passed
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className='flex items-center gap-3'>
                    {responseData.schemaValidation.passed ? (
                      <CheckCircle className='w-5 h-5 text-green-500' />
                    ) : (
                      <X className='w-5 h-5 text-red-500' />
                    )}
                    <div>
                      <div className='font-medium text-gray-900 dark:text-gray-100'>
                        Schema Validation{' '}
                        {responseData.schemaValidation.passed
                          ? 'Passed'
                          : 'Failed'}
                      </div>
                      <div className='text-sm text-gray-600 dark:text-gray-400'>
                        Schema: {responseData.schemaValidation.name}
                      </div>
                    </div>
                  </div>
                </div>

                {!responseData.schemaValidation.passed &&
                  responseData.schemaValidation.results?.length > 0 && (
                    <div className='space-y-2'>
                      <h4 className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                        Validation Errors:
                      </h4>
                      <div className='space-y-2'>
                        {responseData.schemaValidation.results.map(
                          (issue: any, idx: number) => (
                            <div
                              key={idx}
                              className='p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm'
                            >
                              <span className='font-mono text-red-700 dark:text-red-400'>
                                {issue.field}
                              </span>
                              <span className='text-gray-700 dark:text-gray-300 ml-2'>
                                {issue.description}
                              </span>
                              {issue.value !== undefined &&
                                issue.value !== null && (
                                  <span className='text-gray-500 dark:text-gray-400 ml-2'>
                                    Value: {String(issue.value)}
                                  </span>
                                )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 py-8'>
                <div className='text-lg font-medium'>
                  No schema validation results
                </div>
                <div className='text-sm mt-1'>
                  Schema validation will appear here when available
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'actual-request' && requestDetails && (
          <div className='p-4 space-y-4'>
            <div className='space-y-2'>
              <h4 className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                Request URL:
              </h4>
              <div className='flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg'>
                <span className='px-2 py-1 text-xs font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded'>
                  {requestDetails.method}
                </span>
                <span className='font-mono text-sm text-gray-700 dark:text-gray-300 flex-1 truncate'>
                  {requestDetails.url}
                </span>
                <button
                  onClick={() => handleCopy(requestDetails.url, 'request-url')}
                  className='p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded'
                  title='Copy URL'
                >
                  {copiedItem === 'request-url' ? (
                    <CheckCircle className='w-4 h-4 text-green-500' />
                  ) : (
                    <Copy className='w-4 h-4' />
                  )}
                </button>
              </div>
            </div>

            <div className='space-y-2'>
              <h4 className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                Headers:
              </h4>
              <div className='border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'>
                <table className='w-full text-sm'>
                  <thead className='bg-gray-50 dark:bg-gray-800'>
                    <tr>
                      <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                        Name
                      </th>
                      <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                    {Object.entries(requestDetails.headers).map(
                      ([name, value]) => (
                        <tr key={name}>
                          <td className='px-4 py-2 font-mono text-gray-700 dark:text-gray-300'>
                            {name}
                          </td>
                          <td className='px-4 py-2 font-mono text-gray-600 dark:text-gray-400'>
                            {String(value)}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {requestDetails.body && (
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <h4 className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                    Body:
                  </h4>
                  <span className='text-xs text-gray-500 dark:text-gray-400'>
                    Body Type: application/json
                  </span>
                </div>
                <div className='relative'>
                  <button
                    onClick={() =>
                      handleCopy(
                        JSON.stringify(requestDetails.body, null, 2),
                        'request-body'
                      )
                    }
                    className='absolute top-2 right-2 p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded'
                    title='Copy body'
                  >
                    {copiedItem === 'request-body' ? (
                      <CheckCircle className='w-4 h-4 text-green-500' />
                    ) : (
                      <Copy className='w-4 h-4' />
                    )}
                  </button>
                  <pre className='p-4 bg-gray-50 dark:bg-gray-800 rounded-lg font-mono text-sm text-gray-700 dark:text-gray-300 overflow-auto'>
                    {JSON.stringify(requestDetails.body, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AssertionModal
        fieldPath={activeFieldPath}
        fieldValue={activeFieldValue}
        isOpen={showAssertionModal}
        onSelect={handleAssertionSelect}
        onClose={handleModalClose}
        allAssertions={assertions}
        variables={formattedVariables.filter((v) => v.name.startsWith('S_'))}
        dynamicVariables={formattedVariables.filter((v) =>
          v.name.startsWith('D_')
        )}
        setAssertions={setAssertions}
      />
    </div>
  );
};

export default ResponseViewer;
