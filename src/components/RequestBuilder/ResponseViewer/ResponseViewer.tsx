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
import { getCategoryForAssertionType } from '@/lib/assertion-utils';
import ApiAssertionInterface from './ApiAssertionInterface';

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
  dataType?: string;
}
interface ResponseViewerProps {
  isBottomLayout: boolean;
  usedStaticVariables?: Array<{ name: string; value: string }>;
  usedDynamicVariables?: Array<{ name: string; value: string }>;
  onRedirectToTab?: (tabName: string) => void;
  onSaveAssertions?: () => Promise<void>;
}

const ResponseViewer = ({
  isBottomLayout,
  usedStaticVariables = [],
  usedDynamicVariables = [],
  onRedirectToTab,
  onSaveAssertions,
}: ResponseViewerProps) => {
  const { responseData, assertions, setAssertions } = useRequest();

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
  const [copiedItem, setCopiedItem] = useState<string>('');
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [showAssertionModal, setShowAssertionModal] = useState(false);
  const [activeFieldPath, setActiveFieldPath] = useState<string>('');
  const [activeFieldValue, setActiveFieldValue] = useState<any>(null);
  const [showAssertionUI, setShowAssertionUI] = useState(false);

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
          case 'response_time':
            description = `Response time should be ${
              config.comparison === 'less' ? 'less than' : 'more than'
            } ${config.value}ms`;
            break;
          case 'payload_size':
            description = `Payload size should be ${
              config.comparison === 'less' ? 'less than' : 'more than'
            } ${config.value}KB`;
            break;
          case 'status_equals':
            description = `Response status should be ${config.value}`;
            break;
          case 'contains_text':
            description = `Response should contain text: "${config.value}"`;
            finalType = 'contains';
            break;
          case 'contains_static':
            description = `Response should contain static value: "${
              config.value
            }"${config.scope === 'field' ? ` in ${activeFieldPath}` : ''}`;
            finalType = 'contains';
            break;
          case 'contains_dynamic':
            description = `Response should contain dynamic variable: ${
              config.value
            }${config.scope === 'field' ? ` in ${activeFieldPath}` : ''}`;
            finalType = 'contains';
            break;
          case 'contains_extracted':
            description = `Response should contain extracted variable: ${config.value}`;
            finalType = 'contains';
            break;
          default:
            description = `General assertion: ${assertionType}`;
        }
      } else {
        const operatorLabels: Record<string, string> = {
          equals: 'equals',
          field_not_equals: 'does not equal',
          field_greater_than: 'is greater than',
          field_less_than: 'is less than',
          field_greater_equal: 'is at least',
          field_less_equal: 'is at most',
          contains: 'contains',
          field_not_contains: 'does not contain',
          array_length: 'has length',
          greater_than: 'has more than',
          less_than: 'has fewer than',
          greater_than_or_equal: 'has at least',
          less_than_or_equal: 'has at most',
          not_equals: 'does not have',
        };

        const operatorText = operatorLabels[config.operator] || config.operator;

        if (config.type === 'array_length') {
          description =
            config.description ||
            `${activeFieldPath} array ${operatorText} ${config.expectedValue} elements`;
        } else {
          description = `${activeFieldPath} ${operatorText} "${
            config.expectedValue || config.value
          }"`;
        }
      }

      const normalizeFieldPath = (path: string) => {
        if (path.startsWith('headers.')) {
          return path.replace(/^headers\./, '').toLowerCase();
        }
        return path;
      };

      const baseAssertion = {
        id: `manual-${Date.now()}`,
        type: finalType,
        displayType: assertionType,
        category: getCategoryForAssertionType(finalType),
        description,
        value: activeFieldValue,
        expectedValue: config.expectedValue || config.value,
        enabled: true,
        operator: config.operator,
        ...config,
      };

      const newAssertion =
        config?.isGeneral && config.scope !== 'field'
          ? baseAssertion
          : {
              ...baseAssertion,
              field: normalizeFieldPath(activeFieldPath),
            };

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
        className='group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative'
        onMouseEnter={() => setHoveredField(node.path)}
        onMouseLeave={() => !showAssertionModal && setHoveredField(null)}
      >
        <div className='flex items-center py-1 pr-2 font-mono text-sm border-l-2 border-transparent hover:border-blue-500'>
          <span className='text-gray-400 dark:text-gray-600 select-none text-xs w-12 text-center flex-shrink-0 absolute left-0'>
            {index + 1}
          </span>
          <div
            className='flex items-center flex-1 min-w-0'
            style={{ marginLeft: `${48 + node.level * 20}px` }}
          >
            {hasChildren && (
              <button
                onClick={() => toggleNode(node.path)}
                className='p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded mr-1 flex-shrink-0'
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <ChevronDown className='w-3 h-3 text-gray-600 dark:text-gray-400' />
                ) : (
                  <ChevronRight className='w-3 h-3 text-gray-600 dark:text-gray-400' />
                )}
              </button>
            )}
            {!hasChildren && <div className='w-5' />}
            <span className='text-blue-600 dark:text-blue-400 font-medium mr-2 text-sm flex-shrink-0'>
              {node.key}:
            </span>

            {hasChildren ? (
              <span className='text-gray-600 dark:text-gray-400 text-sm'>
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
        <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'>
          <div className='bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between'>
            <span className='text-xs font-medium text-gray-600 dark:text-gray-400'>
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

          <div className='max-h-[600px] overflow-y-auto scrollbar-thin'>
            {visibleNodes.map((node, index) => renderJsonValue(node, index))}
          </div>
        </div>
      );
    } catch (error) {
      console.error('JSON parsing error:', error);
      return (
        <div className='p-2 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700'>
          <p className='text-gray-600 dark:text-gray-400 text-sm'>
            Unable to parse response
          </p>
        </div>
      );
    }
  };

  const renderHeadersTab = () => (
    <div className='space-y-2'>
      {Object.entries(responseData?.headers || {}).map(([key, value]) => (
        <div
          key={key}
          className='group flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-900'
        >
          <div className='flex-1 min-w-0 mr-4'>
            <div className='flex items-center space-x-2'>
              <Hash className='w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0' />
              <span className='font-medium text-gray-900 dark:text-gray-100 text-sm'>
                {key}
              </span>
            </div>
            <p className='text-sm text-gray-600 dark:text-gray-400 font-mono mt-1 break-all'>
              {String(value)}
            </p>
          </div>
          <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0'>
            <button
              onClick={() => handleCopy(value as string, `header-${key}`)}
              className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
              title='Copy value'
            >
              {copiedItem === `header-${key}` ? (
                <CheckCircle className='w-3.5 h-3.5 text-green-500' />
              ) : (
                <Copy className='w-3.5 h-3.5' />
              )}
            </button>

            <button
              onClick={() => {
                setActiveFieldPath(`headers.${key}`);
                setActiveFieldValue(value);
                setShowAssertionModal(true);
              }}
              className='px-1.5 py-0.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors'
            >
              + Assert
            </button>
          </div>
        </div>
      ))}
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
          <Clock className='h-4 w-4 text-gray-600 dark:text-gray-400' />
          <span className='font-medium text-gray-900 dark:text-gray-100'>
            {responseData.metrics?.responseTime || 0}ms
          </span>
        </div>
        <div className='flex items-center space-x-1'>
          <HardDrive className='h-4 w-4 text-gray-600 dark:text-gray-400' />
          <span className='font-medium text-gray-900 dark:text-gray-100'>
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
      label: 'Assertions(R)',
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
      <div className='flex-1 flex items-center justify-center bg-white dark:bg-gray-900 p-2'>
        <div className='text-center'>
          <p className='text-gray-600 dark:text-gray-400 mb-4'>
            No response yet
          </p>
          <p className='text-sm text-gray-500'>
            Send a request to see the response here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex-1 flex flex-col bg-white dark:bg-gray-900 h-full overflow-hidden'>
      <div className='bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-shrink-0'>
        <div className='flex items-center justify-between border-b border-gray-200 dark:border-gray-700'>
          <nav className='flex space-x-6 px-4 whitespace-nowrap overflow-x-auto scrollbar-thin no-scrollbar'>
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
                <span>{tab.label}</span>
                {tab.hasIndicator && (
                  <span className='w-1.5 h-1.5 bg-blue-500 rounded-full' />
                )}
              </button>
            ))}
          </nav>

          <div className='px-4'>
            <StatusSummary />
          </div>
        </div>

        <div className='flex items-center space-x-4'>
          <button className='flex items-center space-x-2 text-sm font-medium text-blue-600'>
            <CheckCircle className='w-4 h-4' />
            <span>Pretty</span>
          </button>
          <button className='flex items-center space-x-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'>
            <Code className='w-4 h-4' />
            <span>Raw</span>
          </button>
          {/* ADD THIS NEW BUTTON */}
          <button
            onClick={() => setShowAssertionUI(true)}
            className='flex items-center space-x-2 text-sm font-medium dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-blue-600'
          >
            <CheckCircle className='w-4 h-4' />
            <span>Assertions</span>
          </button>
        </div>
        {showSearch && (
          <div className='px-4 py-2 border-b border-gray-200 dark:border-gray-700'>
            <div className='flex items-center space-x-2'>
              <div className='flex-1 relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-gray-400' />
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
                <X className='h-4 w-4' />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className='flex-1 overflow-auto p-4 scrollbar-thin'>
        {activeTab === 'body' && renderJsonTree()}
        {activeTab === 'headers' && renderHeadersTab()}
        {activeTab === 'cookies' && (
          <div className='text-center py-8 text-gray-600 dark:text-gray-400'>
            <Cookie className='w-12 h-12 text-gray-400 mx-auto mb-3' />
            <p>No cookies found in response</p>
          </div>
        )}

        {activeTab === 'test-results' &&
          Array.isArray(responseData.assertionLogs) && (
            <div className='space-y-2'>
              {responseData.assertionLogs.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>
                  <p>No test results available</p>
                </div>
              ) : (
                responseData.assertionLogs.map(
                  (assertion: any, idx: number) => (
                    <div
                      key={idx}
                      className={`border rounded-lg p-3 ${
                        assertion.status === 'passed'
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      }`}
                    >
                      <div className='flex items-center space-x-2'>
                        {assertion.status === 'passed' ? (
                          <CheckCircle className='h-5 w-5 text-green-600 dark:text-green-400' />
                        ) : (
                          <X className='h-5 w-5 text-red-600 dark:text-red-400' />
                        )}
                        <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                          {assertion.description}
                        </h4>
                      </div>
                      {assertion.errorMessage && (
                        <p className='mt-2 text-sm text-red-600 dark:text-red-400'>
                          {assertion.errorMessage}
                        </p>
                      )}
                    </div>
                  )
                )
              )}
            </div>
          )}

        {activeTab === 'schema' && (
          <div className='p-4 overflow-auto scrollbar-thin h-full'>
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
            <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4'>
              <h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                Request URL:
              </h3>
              <div className='flex items-center space-x-3'>
                <span className='px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded font-semibold text-sm'>
                  {requestDetails.method}
                </span>
                <span className='text-sm text-gray-900 dark:text-gray-100 font-mono flex-1 truncate'>
                  {requestDetails.url}
                </span>
                <button
                  onClick={() => handleCopy(requestDetails.url, 'request-url')}
                  className='p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded'
                  title='Copy URL'
                >
                  {copiedItem === 'request-url' ? (
                    <CheckCircle className='w-4 h-4 text-green-600' />
                  ) : (
                    <Copy className='w-4 h-4' />
                  )}
                </button>
              </div>
            </div>

            <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4'>
              <h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                Headers:
              </h3>
              <div className='overflow-x-auto scrollbar-thin'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b border-gray-200 dark:border-gray-700'>
                      <th className='text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-semibold'>
                        Name
                      </th>
                      <th className='text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-semibold'>
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(requestDetails.headers).map(
                      ([name, value]) => (
                        <tr
                          key={name}
                          className='border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
                        >
                          <td className='py-2 px-3 text-gray-900 dark:text-gray-100 font-medium'>
                            {name}
                          </td>
                          <td className='py-2 px-3 text-gray-600 dark:text-gray-400 font-mono'>
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
              <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4'>
                <div className='flex items-center justify-between mb-3'>
                  <h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                    Body:
                  </h3>
                  <span className='text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded'>
                    Body Type: application/json
                  </span>
                </div>
                <div className='bg-gray-100 dark:bg-gray-800 rounded-lg p-3 relative'>
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
                      <CheckCircle className='w-4 h-4 text-green-600' />
                    ) : (
                      <Copy className='w-4 h-4' />
                    )}
                  </button>
                  <pre className='text-sm text-gray-900 dark:text-gray-100 font-mono overflow-x-auto scrollbar-thin'>
                    {JSON.stringify(requestDetails.body, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* API Assertion Interface Modal */}
      {showAssertionUI && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col'>
            {/* Header */}
            <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
              <h2 className='text-xl font-bold text-gray-900 dark:text-gray-100'>
                API Assertions Manager
              </h2>
              <button
                onClick={() => setShowAssertionUI(false)}
                className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors'
              >
                <X className='w-5 h-5 text-gray-500' />
              </button>
            </div>

            {/* Content */}
            <div className='flex-1 overflow-auto'>
              <ApiAssertionInterface
                assertions={assertions}
                responseData={responseData} // Pass the actual response data
                onUpdateAssertions={setAssertions}
                onSaveAssertions={onSaveAssertions}
              />{' '}
            </div>
          </div>
        </div>
      )}

      <AssertionModal
        fieldPath={activeFieldPath}
        fieldValue={activeFieldValue}
        isOpen={showAssertionModal}
        onSelect={handleAssertionSelect}
        onClose={handleModalClose}
        allAssertions={assertions}
        variables={usedStaticVariables}
        dynamicVariables={usedDynamicVariables}
        setAssertions={setAssertions}
        onRedirectToTab={onRedirectToTab}
        onSave={onSaveAssertions}
      />
    </div>
  );
};

export default ResponseViewer;
