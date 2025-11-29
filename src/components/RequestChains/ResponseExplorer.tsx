'use client';
import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Plus,
  Code,
  Hash,
  Cookie,
  CheckCircle,
  Trash2,
  Info,
  AlertCircle,
  X,
  Wand2,
} from 'lucide-react';
import type { DataExtraction } from '@/shared/types/requestChain.model';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Button } from '../ui/button';

interface ResponseExplorerProps {
  response?: {
    status: number;
    headers: Record<string, string>;
    body: string;
    cookies?: Record<string, string>;
    assertions?: Array<{
      status: 'passed' | 'failed';
      responseStatus?: number;
      responseTime?: number;
      responseSize?: number;
      description: string;
      expectedValue?: string;
      operator?: string;
      type?: string;
      category?: string;
      errorMessage?: string;
    }>;
  };
  onExtractVariable: (extraction: DataExtraction) => void;
  extractedVariables: Record<string, any>;
  existingExtractions: DataExtraction[];
  onRemoveExtraction: (variableName: string) => void;
  handleCopy: (value: string) => void;
  copied?: boolean;
  chainId: string;
  actualRequestUrl?: string;
  actualRequestHeaders?: Record<string, string>;
  actualRequestBody?: string;
  actualRequestMethod?: string;
  executionStatus?: 'success' | 'error';
  errorMessage?: string;
  executionLog?: {
    duration: number;
    response?: {
      size: number;
      status: number;
    };
  };
  onApplyToAllRequests?: (variableName: string) => void;
}

interface JsonNode {
  key: string;
  value: any;
  path: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  level: number;
}

export function ResponseExplorer({
  response,
  onExtractVariable,
  extractedVariables,
  existingExtractions,
  onRemoveExtraction,
  handleCopy,
  copied,
  chainId,
  actualRequestUrl,
  actualRequestHeaders,
  actualRequestBody,
  actualRequestMethod,
  executionStatus,
  errorMessage,
  executionLog,
  onApplyToAllRequests,
}: ResponseExplorerProps) {
  const [activeTab, setActiveTab] = useState<
    'body' | 'headers' | 'cookies' | 'actualRequest' | 'assertions'
  >('body');

  const getValueByPath = (obj: any, path: string): any => {
    if (!obj || !path) return undefined;

    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object') {
        if (key.includes('[') && key.includes(']')) {
          const arrayKey = key.substring(0, key.indexOf('['));
          const index = Number.parseInt(
            key.substring(key.indexOf('[') + 1, key.indexOf(']'))
          );
          if (current[arrayKey] && Array.isArray(current[arrayKey])) {
            return current[arrayKey][index];
          }
          return undefined;
        }
        return current[key];
      }
      return undefined;
    }, obj);
  };

  const getAutoExtractedVariables = () => {
    if (!existingExtractions || existingExtractions.length === 0) {
      return extractedVariables || {};
    }

    const autoExtracted: Record<string, any> = { ...extractedVariables };

    existingExtractions.forEach((extraction) => {
      const variableName = extraction.variableName || extraction.name;
      if (!extraction.path || !variableName) {
        return;
      }

      // Skip if already extracted
      if (autoExtracted[variableName] !== undefined) return;

      try {
        let sourceData;
        const source = extraction.source || 'response_body';

        switch (source) {
          case 'response_header':
            sourceData = response?.headers;
            break;
          case 'response_cookie':
            sourceData = response?.cookies;
            break;
          case 'response_body':
          default:
            try {
              sourceData = JSON.parse(response?.body || '');
            } catch {
              console.warn(
                'Failed to parse response body for variable extraction'
              );
              return;
            }
            break;
        }

        // Extract value using path
        if (sourceData && extraction.path) {
          const value = getValueByPath(sourceData, extraction.path);

          if (value !== undefined) {
            autoExtracted[variableName] = value;
          }
        }
      } catch (error) {
        console.error('Error auto-extracting variable:', error);
      }
    });

    return autoExtracted;
  };

  const finalExtractedVariables = getAutoExtractedVariables();

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(['root'])
  );
  const [extractionModal, setExtractionModal] = useState<{
    isOpen: boolean;
    source: 'response_body' | 'response_header' | 'response_cookie';
    path: string;
    value: any;
    suggestedName: string;
  } | null>(null);
  const [variableName, setVariableName] = useState<string>('');

  const sanitizeVariableName = (name: string): string => {
    return name
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_');
  };

  const parseJsonToNodes = (
    obj: any,
    parentPath = '',
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
        },
      ];
    }
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const currentPath = parentPath
          ? `${parentPath}[${index}]`
          : `[${index}]`;
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
        });
        if (typeof item === 'object' && item !== null) {
          nodes.push(...parseJsonToNodes(item, currentPath, level + 1));
        }
      });
    } else if (typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = parentPath ? `${parentPath}.${key}` : key;
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
    source: DataExtraction['source'],
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

  const handleVariableNameChange = (value: string) => {
    setVariableName(value);
  };

  const confirmExtraction = (inputVariableName: string, transform?: string) => {
    if (extractionModal && inputVariableName) {
      const sanitized = sanitizeVariableName(inputVariableName);
      const finalVariableName = `E_${sanitized}`;
      const extraction: DataExtraction = {
        variableName: finalVariableName,
        name: finalVariableName,
        source: extractionModal.source,
        path: extractionModal.path,
        value: extractionModal.value,
        transform,
      };
      onExtractVariable(extraction);
      setExtractionModal(null);
      setVariableName('');
    }
  };

  const isJWTToken = (value: any): boolean => {
    if (typeof value !== 'string') return false;
    // JWT format: header.payload.signature (three base64url encoded parts separated by dots)
    const jwtRegex = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
    return jwtRegex.test(value);
  };

  const renderJsonValue = (node: JsonNode, isVisible: boolean) => {
    if (!isVisible) return null;
    const isExpanded = expandedNodes.has(node.path);
    const hasChildren = node.type === 'object' || node.type === 'array';
    const isAlreadyExtracted = existingExtractions.some(
      (e) => e.path === node.path
    );

    return (
      <div
        key={node.path}
        className='group hover:bg-blue-50 transition-colors'
        style={{ marginLeft: `${node.level * 20}px` }}
      >
        <div className='flex items-center py-1 px-2 rounded'>
          <div className='flex items-center flex-1 min-w-0'>
            {hasChildren && (
              <button
                onClick={() => toggleNode(node.path)}
                className='p-1 hover:bg-gray-200 rounded mr-1'
              >
                {isExpanded ? (
                  <ChevronDown className='w-3 h-3 text-gray-500' />
                ) : (
                  <ChevronRight className='w-3 h-3 text-gray-500' />
                )}
              </button>
            )}
            <span className='text-blue-600 font-medium mr-2 text-sm'>
              {node.key}
            </span>
            {!hasChildren && (
              <span
                className={`text-sm font-mono ${
                  node.type === 'string'
                    ? 'text-green-600'
                    : node.type === 'number'
                    ? 'text-purple-600'
                    : node.type === 'boolean'
                    ? 'text-orange-600'
                    : 'text-gray-600'
                }`}
              >
                {node.type === 'string'
                  ? `"${node.value}"`
                  : String(node.value)}
              </span>
            )}
          </div>
          {!hasChildren && (
            <div className='flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity'>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(String(node.value))
                }
                className='p-1 text-gray-400 hover:text-gray-600 rounded'
                title='Copy value'
              >
                <Copy className='w-3 h-3' />
              </button>
              {isAlreadyExtracted ? (
                <div className='flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs'>
                  <CheckCircle className='w-3 h-3' />
                  <span>Extracted</span>
                </div>
              ) : (
                <button
                  onClick={() =>
                    handleExtractClick('response_body', node.path, node.value)
                  }
                  className='px-2 py-1 bg-[#136fb0] text-white rounded text-xs hover:bg-blue-700 transition-colors'
                  title='Extract as variable'
                >
                  <Plus className='w-3 h-3 mr-1 inline' />
                  Extract
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderJsonTree = () => {
    if (!response || response.body === undefined || response.body === null) {
      return (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <div className='flex items-start space-x-3'>
            <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
            <div className='flex-1'>
              <h4 className='font-medium text-red-900 mb-1'>
                No Response Data
              </h4>
              <p className='text-sm text-red-700'>
                The response body is empty or undefined. This may indicate a
                failed request or network error.
              </p>
            </div>
          </div>
        </div>
      );
    }

    try {
      let jsonData;
      let cleanBody = response.body;
      if (typeof cleanBody === 'string') {
        cleanBody = cleanBody.trim();
        cleanBody = cleanBody.replace(/^\uFEFF/, '');
      }
      try {
        jsonData = JSON.parse(cleanBody);
      } catch (firstError) {
        const jsonMatch =
          cleanBody.match(/\{.*\}/s) || cleanBody.match(/\[.*\]/s);
        if (jsonMatch) {
          jsonData = JSON.parse(jsonMatch[0]);
        } else {
          throw firstError;
        }
      }
      const nodes = parseJsonToNodes(jsonData);
      if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
        return (
          <div className='p-4 bg-gray-50 rounded border'>
            <p className='text-gray-600 text-sm'>
              Unable to parse response structure
            </p>
          </div>
        );
      }
      return (
        <div className='space-y-1'>
          {nodes.map((node) => {
            if (!node) return null;
            const parentPath =
              node.path.substring(0, node.path.lastIndexOf('.')) ||
              node.path.substring(0, node.path.lastIndexOf('[')) ||
              'root';
            const isVisible = node.level === 0 || expandedNodes.has(parentPath);
            return renderJsonValue(node, isVisible);
          })}
        </div>
      );
    } catch (error) {
      return (
        <div className='space-y-4'>
          <div className='p-4 bg-gray-50 rounded border'>
            <p className='text-gray-600 text-sm mb-2'>
              Response is not valid JSON
            </p>
            <pre className='text-xs text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto'>
              {response?.body}
            </pre>
          </div>
          <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
            <p className='text-sm text-blue-800 mb-2'>
              <strong>Manual Extraction:</strong> You can still extract
              variables from headers or cookies using the tabs above.
            </p>
            <button
              onClick={() =>
                handleExtractClick(
                  'response_body',
                  'raw_response',
                  response?.body
                )
              }
              className='px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors'
            >
              Extract Raw Response
            </button>
          </div>
        </div>
      );
    }
  };

  const renderHeadersTab = () => (
    <div className='space-y-2'>
      {response?.headers &&
        typeof response?.headers === 'object' &&
        Object.entries(response?.headers).map(([key, value]) => {
          if (!key || value === undefined || value === null) return null;
          const isAlreadyExtracted = existingExtractions.some(
            (e) => e.source === 'response_header' && e.path === key
          );
          return (
            <div
              key={key}
              className='group flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50'
            >
              <div className='flex-1 min-w-0'>
                <div className='flex items-center space-x-2'>
                  <Hash className='w-4 h-4 text-gray-400' />
                  <span className='font-medium text-gray-900 text-sm'>
                    {key}
                  </span>
                </div>
                <p className='text-sm text-gray-600 font-mono mt-1 break-all'>
                  {value}
                </p>
              </div>
              <div className='flex items-center space-x-2 ml-4'>
                <button
                  onClick={() => navigator.clipboard.writeText(value)}
                  className='p-1 text-gray-400 hover:text-gray-600 rounded'
                  title='Copy value'
                >
                  <Copy className='w-4 h-4' />
                </button>
                {isAlreadyExtracted ? (
                  <div className='flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs'>
                    <CheckCircle className='w-3 h-3' />
                    <span>Extracted</span>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      handleExtractClick('response_header', key, value)
                    }
                    className='px-3 py-1 bg-[#136fb0] text-white rounded text-sm hover:bg-blue-700 transition-colors'
                  >
                    <Plus className='w-4 h-4 mr-1 inline' />
                    Extract
                  </button>
                )}
              </div>
            </div>
          );
        })}
      {(!response?.headers ||
        typeof response?.headers !== 'object' ||
        Object.keys(response?.headers).length === 0) && (
        <div className='text-center py-8 text-gray-500'>
          <Hash className='w-12 h-12 text-gray-300 mx-auto mb-3' />
          <p>No headers found in response</p>
        </div>
      )}
    </div>
  );

  const renderCookiesTab = () => (
    <div className='space-y-2'>
      {response?.cookies &&
      typeof response?.cookies === 'object' &&
      Object.keys(response?.cookies).length > 0 ? (
        Object.entries(response?.cookies).map(([key, value]) => {
          if (!key || value === undefined || value === null) return null;
          const isAlreadyExtracted = existingExtractions.some(
            (e) => e.source === 'response_cookie' && e.path === key
          );
          return (
            <div
              key={key}
              className='group flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50'
            >
              <div className='flex-1 min-w-0'>
                <div className='flex items-center space-x-2'>
                  <Cookie className='w-4 h-4 text-gray-400' />
                  <span className='font-medium text-gray-900 text-sm'>
                    {key}
                  </span>
                </div>
                <p className='text-sm text-gray-600 font-mono mt-1 break-all'>
                  {value}
                </p>
              </div>
              <div className='flex items-center space-x-2 ml-4'>
                <button
                  onClick={() => navigator.clipboard.writeText(value)}
                  className='p-1 text-gray-400 hover:text-gray-600 rounded'
                  title='Copy value'
                >
                  <Copy className='w-4 h-4' />
                </button>
                {isAlreadyExtracted ? (
                  <div className='flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs'>
                    <CheckCircle className='w-3 h-3' />
                    <span>Extracted</span>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      handleExtractClick('response_cookie', key, value)
                    }
                    className='px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors'
                  >
                    <Plus className='w-4 h-4 mr-1 inline' />
                    Extract
                  </button>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className='text-center py-8 text-gray-500'>
          <Cookie className='w-12 h-12 text-gray-300 mx-auto mb-3' />
          <p>No cookies found in response</p>
        </div>
      )}
    </div>
  );

  const renderAssertionsTab = () => {
    if (!response?.assertions || response.assertions.length === 0) {
      return (
        <div className='text-center py-8 text-gray-500'>
          <CheckCircle className='w-12 h-12 text-gray-300 mx-auto mb-3' />
          <p>No assertions configured for this request</p>
        </div>
      );
    }

    const passedCount = response.assertions.filter(
      (a) => a.status === 'passed'
    ).length;
    const failedCount = response.assertions.length - passedCount;

    return (
      <div className='space-y-4'>
        {/* Summary */}
        <div className='flex items-center space-x-4 p-4 bg-gray-50 rounded-lg'>
          <div className='flex items-center space-x-2'>
            <CheckCircle className='w-5 h-5 text-green-600' />
            <span className='font-medium text-gray-900'>
              {passedCount} Passed
            </span>
          </div>
          {failedCount > 0 && (
            <div className='flex items-center space-x-2'>
              <X className='w-5 h-5 text-red-600' />
              <span className='font-medium text-gray-900'>
                {failedCount} Failed
              </span>
            </div>
          )}
        </div>

        <div className='space-y-2'>
          {response.assertions.map((assertion, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${
                assertion.status === 'passed'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className='flex items-start justify-between'>
                <div className='flex items-start space-x-3 flex-1'>
                  {assertion.status === 'passed' ? (
                    <CheckCircle className='w-5 h-5 text-green-600 flex-shrink-0 mt-0.5' />
                  ) : (
                    <X className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
                  )}
                  <div className='flex-1 min-w-0'>
                    <h4
                      className={`font-medium ${
                        assertion.status === 'passed'
                          ? 'text-green-900'
                          : 'text-red-900'
                      }`}
                    >
                      {assertion.description}
                    </h4>
                    {assertion.errorMessage && (
                      <p className='mt-2 text-sm text-red-700'>
                        {assertion.errorMessage}
                      </p>
                    )}
                    <div className='mt-2 flex flex-wrap gap-2'>
                      {assertion.expectedValue && (
                        <span className='text-xs bg-white px-2 py-1 rounded border'>
                          Expected: {assertion.expectedValue}
                        </span>
                      )}
                      {assertion.operator && (
                        <span className='text-xs bg-white px-2 py-1 rounded border'>
                          Operator: {assertion.operator}
                        </span>
                      )}
                      {assertion.category && (
                        <span className='text-xs bg-white px-2 py-1 rounded border capitalize'>
                          {assertion.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderActualRequestTab = () => {
    if (!actualRequestUrl) {
      return (
        <div className='text-center py-8 text-gray-500'>
          <Code className='w-12 h-12 text-gray-300 mx-auto mb-3' />
          <p>No request information available</p>
        </div>
      );
    }

    const getMethodColor = (method: string) => {
      switch (method.toUpperCase()) {
        case 'POST':
          return 'bg-blue-700 text-white';
        case 'GET':
          return 'bg-green-700 text-white';
        case 'PUT':
          return 'bg-orange-800 text-white';
        case 'DELETE':
          return 'bg-red-800 text-white';
        case 'PATCH':
          return 'bg-purple-500 text-white';
        default:
          return 'bg-gray-500 text-white';
      }
    };

    return (
      <div className='space-y-6'>
        {/* Request URL */}
        <div>
          <h4 className='text-sm font-semibold text-gray-700 mb-3'>
            Request URL:
          </h4>
          <div className='flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg'>
            <span
              className={`px-2 py-1 ${getMethodColor(
                actualRequestMethod || 'GET'
              )} text-xs font-semibold rounded`}
            >
              {actualRequestMethod}
            </span>
            <span className='text-sm font-mono text-gray-900 flex-1 break-all'>
              {actualRequestUrl}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(actualRequestUrl)}
              className='p-1 text-gray-400 hover:text-gray-600 rounded'
              title='Copy URL'
            >
              <Copy className='w-4 h-4' />
            </button>
          </div>
        </div>

        {/* Headers */}
        <div>
          <h4 className='text-sm font-semibold text-gray-700 mb-3'>Headers:</h4>
          <div className='border border-gray-200 rounded-lg overflow-hidden'>
            <table className='w-full'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr>
                  <th className='px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase'>
                    Name
                  </th>
                  <th className='px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase'>
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {actualRequestHeaders &&
                typeof actualRequestHeaders === 'object' ? (
                  Object.entries(actualRequestHeaders).map(([key, value]) => (
                    <tr key={key} className='hover:bg-gray-50'>
                      <td className='px-4 py-2 text-sm font-medium text-gray-900'>
                        {key}
                      </td>
                      <td className='px-4 py-2 text-sm text-gray-600 font-mono break-all'>
                        {value}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={2}
                      className='px-4 py-4 text-center text-sm text-gray-500'
                    >
                      No headers available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {actualRequestBody && (
          <div>
            <h4 className='text-sm font-semibold text-gray-700 mb-3'>Body:</h4>
            <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-xs text-gray-600'>
                  Body Type: application/json
                </span>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      typeof actualRequestBody === 'string'
                        ? actualRequestBody
                        : JSON.stringify(actualRequestBody, null, 2)
                    )
                  }
                  className='p-1 text-gray-400 hover:text-gray-600 rounded'
                  title='Copy body'
                >
                  <Copy className='w-4 h-4' />
                </button>
              </div>
              <pre className='text-sm text-gray-900 font-mono overflow-x-auto'>
                {typeof actualRequestBody === 'string'
                  ? actualRequestBody
                  : JSON.stringify(actualRequestBody, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className='space-y-6'>
      <div className='bg-white border border-gray-200 rounded-lg'>
        <div className='border-b border-gray-200 flex items-center justify-between px-6'>
          {/* LEFT: Tabs */}
          <nav className='flex space-x-8'>
            {[
              { id: 'body', label: 'Response Body' },
              { id: 'headers', label: 'Headers' },
              { id: 'cookies', label: 'Cookies' },
              { id: 'actualRequest', label: 'Actual Request' },
              { id: 'assertions', label: 'Assertions(R)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`pt-4 pb-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* RIGHT: Status panel */}
          {executionLog && (
            <div className='flex items-center space-x-4 text-sm text-gray-600'>
              {/* Status Badge */}
              <span className='flex items-center space-x-1 bg-green-100 text-green-700 px-2 py-1 rounded-full'>
                <CheckCircle className='w-4 h-4' />
                <span>{executionLog.response?.status} OK</span>
              </span>

              {/* Duration */}
              <span>{executionLog.duration}ms</span>

              {/* Size */}
              <span>
                {(executionLog.response?.size || 0 / 1024).toFixed(2)} KB
              </span>
            </div>
          )}
        </div>
        <div className='p-6 max-h-96 overflow-auto'>
          {activeTab === 'body' &&
            (executionStatus === 'error' && errorMessage ? (
              <div className='flex items-start space-x-3 text-red-600'>
                <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
                <div className='flex-1'>
                  <p className='font-mono text-sm'>{errorMessage}</p>
                </div>
              </div>
            ) : (
              renderJsonTree()
            ))}
          {activeTab === 'headers' && renderHeadersTab()}
          {activeTab === 'cookies' && renderCookiesTab()}
          {activeTab === 'actualRequest' && renderActualRequestTab()}
          {activeTab === 'assertions' && renderAssertionsTab()}
        </div>
      </div>
      {finalExtractedVariables &&
        typeof finalExtractedVariables === 'object' &&
        Object.keys(finalExtractedVariables).length > 0 && (
          <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
            <div className='flex items-center justify-between mb-4'>
              <h4 className='font-medium text-green-900 flex items-center space-x-2'>
                <CheckCircle className='w-5 h-5' />
                <span>
                  Extracted Variables (
                  {Object.keys(finalExtractedVariables).length})
                </span>
              </h4>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              {Object.entries(finalExtractedVariables).map(([name, value]) => {
                if (!name || value === undefined) return null;
                const extraction = existingExtractions?.find(
                  (e) => e.variableName === name || e.name === name
                );
                const isJwt =
                  typeof value === 'string' &&
                  /[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/.test(
                    value
                  );

                return (
                  <div
                    key={name}
                    className='bg-white border border-green-200 rounded-lg p-3'
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <div className='flex items-center space-x-2'>
                        <span className='font-medium text-gray-900'>
                          {name}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleCopy(name)}
                              className='p-1 text-blue-600 hover:bg-blue-50 rounded'
                            >
                              {copied ? (
                                <Copy className='w-3 h-3 text-green-600' />
                              ) : (
                                <Copy className='w-3 h-3' />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Copy variable name</TooltipContent>
                        </Tooltip>

                        {onApplyToAllRequests && isJwt && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => onApplyToAllRequests(name)}
                                className='flex items-center gap-1 p-1 text-purple-600 hover:bg-purple-50 rounded'
                              >
                                <Wand2 className='w-3 h-3' />
                                <span className='text-xs font-medium'>
                                  Apply Auth to all
                                </span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Apply to all subsequent requests
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <div className='flex items-center space-x-2'>
                        <span className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded border text-sm font-mono flex-1 overflow-x-auto whitespace-nowrap'>
                          {extraction?.path}
                        </span>
                        <button
                          onClick={() => onRemoveExtraction(name)}
                          className='p-1 text-red-600 hover:bg-red-50 rounded'
                          title='Remove extraction'
                        >
                          <Trash2 className='w-3 h-3' />
                        </button>
                      </div>
                    </div>
                    <div className='text-sm'>
                      <p className='text-gray-600 mb-1 flex items-center gap-2'>
                        <span>Path:</span>
                        <span className='bg-gray-50 px-2 py-1 rounded border text-sm font-mono flex-1 overflow-x-auto whitespace-nowrap'>
                          {extraction?.path}
                        </span>
                      </p>

                      <div className='bg-gray-50 px-2 py-1 rounded border text-sm font-mono overflow-x-auto whitespace-nowrap'>
                        {typeof value === 'object'
                          ? JSON.stringify(value)
                          : String(value)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <p className='text-sm text-blue-800'>
                <strong>💡 Usage:</strong> Use these variables in subsequent
                requests with the syntax:{' '}
                <code className='bg-blue-100 px-1 rounded overflow-x-auto whitespace-nowrap inline-block'>{`{{variableName}}`}</code>
              </p>
            </div>
          </div>
        )}

      {extractionModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-xl shadow-2xl w-full max-w-md'>
            <div className='p-4 border-b border-gray-200'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Extract Variable
              </h3>
              <p className='text-sm text-gray-500 mt-1'>
                Configure how to extract and store this value
              </p>
            </div>
            <div className='p-4 space-y-3'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Variable Name
                </label>
                <input
                  type='text'
                  value={variableName}
                  onChange={(e) => handleVariableNameChange(e.target.value)}
                  className='w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm overflow-x-auto whitespace-nowrap'
                  placeholder='variable_name'
                />
                <p className='text-xs text-gray-500 mt-1'>
                  Only letters, numbers, and underscores allowed.
                </p>
              </div>
              <div className='flex items-center space-x-2 w-full'>
                <label className='text-sm font-medium text-gray-700 w-16'>
                  Source
                </label>
                <input
                  type='text'
                  value={extractionModal.source
                    .replace('_', ' ')
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                  readOnly
                  className='flex-1 px-3 py-1.5 border border-gray-300 rounded-lg bg-gray-50 text-sm overflow-x-auto whitespace-nowrap'
                />
              </div>
              <div className='flex items-center space-x-2 w-full'>
                <label className='text-sm font-medium text-gray-700 w-16'>
                  Path
                </label>
                <input
                  type='text'
                  value={extractionModal.path}
                  readOnly
                  className='flex-1 px-3 py-1.5 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm overflow-x-auto whitespace-nowrap'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Preview Value
                </label>
                <div className='p-2 bg-gray-50 rounded-lg border overflow-x-auto'>
                  <code className='text-sm text-gray-900 whitespace-nowrap'>
                    {typeof extractionModal.value === 'object'
                      ? JSON.stringify(extractionModal.value, null, 2)
                      : String(extractionModal.value)}
                  </code>
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Transform (Optional)
                </label>
                <input
                  type='text'
                  id='transform'
                  className='w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm overflow-x-auto whitespace-nowrap'
                  placeholder='e.g., value.toUpperCase(), parseInt(value)'
                />
                <p className='text-xs text-gray-500 mt-1'>
                  JavaScript expression to transform the value (use 'value' as
                  variable)
                </p>
              </div>
            </div>
            <div className='flex items-center justify-end space-x-3 p-4 border-t border-gray-200'>
              <button
                onClick={() => {
                  setExtractionModal(null);
                  setVariableName('');
                }}
                className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
              >
                Cancel
              </button>
              <Button
                onClick={() => {
                  const transform = (
                    document.getElementById('transform') as HTMLInputElement
                  ).value;
                  if (variableName) {
                    confirmExtraction(variableName, transform || undefined);
                  }
                }}
                disabled={!variableName}
              >
                Extract Variable
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
