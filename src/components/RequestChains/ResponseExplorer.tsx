'use client';
import { useEffect, useState } from 'react';
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
  AlertCircle,
  X,
  Wand2,
} from 'lucide-react';
import type { DataExtraction } from '@/shared/types/requestChain.model';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Button } from '../ui/button';
import AssertionModal from './RequestChainAssertionModel';
import {
  getOperatorsForFieldType,
  getFieldType,
  type FieldType,
  type Operator,
} from '@/lib/operators';
import ApiAssertionInterface from '../Shared/Assertion/ApiAssertionInterface';

interface ResponseExplorerProps {
  response?: {
    status?: number;
    statusCode: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
    size?: number;
    cookies?: Array<{ name: string; value: string }>;
    assertions?: any[];
    requestId?: string;
    requestCurl?: any;
  };
  onExtractVariable?: (name: string, value: any, path: string) => void;
  extractedVariables?: Record<string, any>;
  existingExtractions?: Array<{ name: string; path: string }>;
  onRemoveExtraction?: (name: string) => void;
  handleCopy?: (text: string) => void;
  copied?: boolean;
  chainId?: string;
  actualRequestUrl?: string;
  actualRequestHeaders?: Record<string, string>;
  actualRequestBody?: any;
  actualRequestMethod?: string;
  executionStatus?: string;
  errorMessage?: string;
  allAssertions?: any[];
  onAssertionsUpdate?: (assertions: any[]) => void;
  onApplyToAllRequests?: (name: string) => void;
  variables?: Array<{ name: string; value: string }>;
  dynamicVariables?: Array<{ name: string; value: string }>;
  requestIndex?: number;
  extractedVariablesByRequest?: Record<string, Record<string, any>>;
  chainRequests?: any[];
  requestExtractedVariables?: Record<string, any>;
  allDynamicVariables?: Array<{ name: string; value: string }>;
  allStaticVariables?: Array<{ name: string; value: string }>;
  allExtractedVariables?: Array<{ name: string; value: string }>;
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
  extractedVariables = {},
  existingExtractions = [],
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
  allAssertions = [],
  onAssertionsUpdate,
  onApplyToAllRequests,
  variables,
  dynamicVariables,
  requestIndex = 0,
  extractedVariablesByRequest = {},
  chainRequests = [],
  allDynamicVariables,
  allStaticVariables,
  allExtractedVariables,
}: ResponseExplorerProps) {
  const [activeTab, setActiveTab] = useState<
    'body' | 'headers' | 'cookies' | 'actualRequest' | 'assertions'
  >('body');

  console.log('reesponse:', response);

  const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  };

  const ensureAssertionIds = (assertions: any[]): any[] => {
    if (!assertions || !Array.isArray(assertions)) return [];

    return assertions.map((assertion) => {
      if (
        assertion.id &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          assertion.id,
        )
      ) {
        return assertion;
      }

      return {
        ...assertion,
        id: generateUUID(),
      };
    });
  };

  const [assertionModalOpen, setAssertionModalOpen] = useState(false);
  const [selectedAssertion, setSelectedAssertion] = useState<{
    path: string;
    value: any;
    fieldType?: FieldType;
    operators?: Operator[];
    filteredAssertions?: any[];
  } | null>(null);
  const [showAssertionUI, setShowAssertionUI] = useState(false);
  const [normalizedAssertions, setNormalizedAssertions] = useState<any[]>([]);

  console.log('normalizedAssertions123:', normalizedAssertions);

  // Ensure all assertions have unique IDs
  useEffect(() => {
    if (allAssertions && allAssertions.length > 0) {
      const assertionsWithIds = ensureAssertionIds(allAssertions);
      setNormalizedAssertions(assertionsWithIds);

      // Optionally update parent component with normalized assertions
      if (
        onAssertionsUpdate &&
        JSON.stringify(assertionsWithIds) !== JSON.stringify(allAssertions)
      ) {
        onAssertionsUpdate(assertionsWithIds);
      }
    } else {
      setNormalizedAssertions([]);
    }
  }, [allAssertions]); // Remove onAssertionsUpdate from dependencies to avoid infinite loop

  const getValueByPath = (obj: any, path: string): any => {
    if (!obj || !path) return undefined;

    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object') {
        if (key.includes('[') && key.includes(']')) {
          const arrayKey = key.substring(0, key.indexOf('['));
          const index = Number.parseInt(
            key.substring(key.indexOf('[') + 1, key.indexOf(']')),
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
      const variableName = extraction.name;
      if (!extraction.path || !variableName) {
        return;
      }

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
                'Failed to parse response body for variable extraction',
              );
              return;
            }
            break;
        }

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
    new Set(['root']),
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
    level = 0,
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
    value: any,
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

  const filterAssertionsByField = (
    allAssertions: any[],
    fieldPath: string,
    fieldValue: any,
  ): any[] => {
    const normalizedPath = fieldPath.toLowerCase();
    const isHeader = normalizedPath.startsWith('headers.');
    const fieldType = typeof fieldValue;
    const isArray = Array.isArray(fieldValue);

    const cleanFieldPath = normalizedPath.replace(/^headers\./, '');

    return allAssertions.filter((assertion) => {
      const generalAssertionTypes = [
        'status_equals',
        'response_time',
        'payload_size',
      ];

      const generalCategories = ['status', 'performance'];

      if (
        generalAssertionTypes.includes(assertion.type) ||
        generalCategories.includes(assertion.category)
      ) {
        return false;
      }

      if (isHeader) {
        if (
          assertion.category !== 'headers' &&
          assertion.category !== 'HeaderGuard™'
        ) {
          return false;
        }

        const assertionField = assertion.field?.toLowerCase();

        if (assertion.category === 'HeaderGuard™') {
          return assertionField === cleanFieldPath;
        }

        if (assertion.category === 'headers') {
          if (
            assertion.type === 'header_present' ||
            assertion.type === 'header_equals'
          ) {
            return assertionField === cleanFieldPath;
          }

          if (assertion.type === 'header_contains') {
            return assertionField === cleanFieldPath;
          }
        }

        return false;
      }

      if (assertion.category === 'body') {
        const assertionField = assertion.field?.toLowerCase();

        if (assertionField && assertionField !== normalizedPath) {
          return false;
        }
        switch (assertion.type) {
          case 'field_present':
            return true;

          case 'field_type':
            if (assertion.expectedValue) {
              return (
                assertion.expectedValue === fieldType ||
                (isArray && assertion.expectedValue === 'array')
              );
            }
            return true;

          case 'field_not_empty':
            return fieldType === 'string' || isArray;

          case 'field_equals':
          case 'field_contains':
            if (assertion.expectedValue !== undefined) {
              const expectedType = typeof assertion.expectedValue;
              if (fieldType === 'string' && expectedType === 'string')
                return true;
              if (fieldType === 'number' && expectedType === 'number')
                return true;
              if (fieldType === 'boolean' && expectedType === 'boolean')
                return true;
            }
            return true;

          case 'field_pattern':
            return fieldType === 'string';

          case 'field_range':
          case 'field_greater_than':
          case 'field_less_than':
            return fieldType === 'number';

          case 'field_null':
            return true;

          case 'array_length':
          case 'array_present':
            return isArray;

          default:
            return true;
        }
      }

      return false;
    });
  };

  const getExtractedVariablesForAssertion = (): Array<{
    name: string;
    value: string;
  }> => {
    const availableVars: Array<{ name: string; value: string }> = [];

    if (requestIndex !== undefined && requestIndex > 0) {
      for (let i = 0; i < requestIndex; i++) {
        const reqId = chainRequests[i]?.id;
        if (reqId && extractedVariablesByRequest[reqId]) {
          Object.entries(extractedVariablesByRequest[reqId]).forEach(
            ([name, value]) => {
              if (!availableVars.some((v) => v.name === name)) {
                availableVars.push({
                  name,
                  value: String(value),
                });
              }
            },
          );
        }
      }
    }

    return availableVars;
  };

  const handleAssertClick = (path: string, value: any) => {
    const fieldType = getFieldType(value);
    const operators = getOperatorsForFieldType(fieldType);

    const filteredAssertions = filterAssertionsByField(
      normalizedAssertions,
      path,
      value,
    );

    setSelectedAssertion({
      path,
      value,
      fieldType,
      operators,
      filteredAssertions,
    });
    setAssertionModalOpen(true);
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
    const jwtRegex = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
    return jwtRegex.test(value);
  };

  const renderJsonValue = (node: JsonNode, isVisible: boolean) => {
    if (!isVisible) return null;
    const isExpanded = expandedNodes.has(node.path);
    const hasChildren = node.type === 'object' || node.type === 'array';
    const isAlreadyExtracted = existingExtractions.some(
      (e) => e.path === node.path,
    );

    return (
      <div
        key={node.path}
        className='group/item hover:bg-blue-50 transition-colors'
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
          <div className='flex items-center space-x-1 opacity-0 group-hover/item:opacity-100 transition-opacity'>
            {!hasChildren && (
              <>
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
              </>
            )}
            <button
              onClick={() => handleAssertClick(node.path, node.value)}
              className='px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-colors'
              title='Add assertion'
            >
              <Wand2 className='w-3 h-3 mr-1 inline' />
              Assert
            </button>
          </div>
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
            <pre className='text-xs text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto scrollbar-thin'>
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
                  response?.body,
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
            (e) => e.source === 'response_header' && e.path === key,
          );
          return (
            <div
              key={key}
              className='group/header flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50'
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
              <div className='flex items-center space-x-2 ml-4 opacity-0 group-hover/header:opacity-100 transition-opacity'>
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
                <button
                  onClick={() => handleAssertClick(`headers.${key}`, value)}
                  className='px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors'
                  title='Add assertion'
                >
                  <Wand2 className='w-4 h-4 mr-1 inline' />
                  Assert
                </button>
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
      response?.cookies.length > 0 ? (
        response?.cookies.map((cookie) => {
          const { name, value } = cookie;
          if (!name || value === undefined || value === null) return null;
          const isAlreadyExtracted = existingExtractions.some(
            (e) => e.source === 'response_cookie' && e.path === name,
          );
          return (
            <div
              key={name}
              className='group/cookie flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50'
            >
              <div className='flex-1 min-w-0'>
                <div className='flex items-center space-x-2'>
                  <Cookie className='w-4 h-4 text-gray-400' />
                  <span className='font-medium text-gray-900 text-sm'>
                    {name}
                  </span>
                </div>
                <p className='text-sm text-gray-600 font-mono mt-1 break-all'>
                  {value}
                </p>
              </div>
              <div className='flex items-center space-x-2 ml-4 opacity-0 group-hover/cookie:opacity-100 transition-opacity'>
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
                      handleExtractClick('response_cookie', name, value)
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
      (a) => a.status === 'passed',
    ).length;
    const failedCount = response.assertions.length - passedCount;

    return (
      <div className='space-y-4'>
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
                      className={`font-medium  ${
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
                        <span className='text-xs bg-white px-2 py-1 rounded border text-sm font-mono flex-1 overflow-x-auto scrollbar-thin whitespace-nowrap'>
                          Expected: {assertion.expectedValue}
                        </span>
                      )}
                      {assertion.operator && (
                        <span className='text-xs bg-white px-2 py-1 rounded border text-sm font-mono flex-1 overflow-x-auto scrollbar-thin whitespace-nowrap'>
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
        <div>
          <h4 className='text-sm font-semibold text-gray-700 mb-3'>
            Request URL:
          </h4>
          <div className='flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg'>
            <span
              className={`px-2 py-1 ${getMethodColor(
                actualRequestMethod || 'GET',
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
                        : JSON.stringify(actualRequestBody, null, 2),
                    )
                  }
                  className='p-1 text-gray-400 hover:text-gray-600 rounded'
                  title='Copy body'
                >
                  <Copy className='w-4 h-4' />
                </button>
              </div>
              <pre className='text-sm text-gray-900 font-mono overflow-x-auto scrollbar-thin'>
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
          <nav className='flex space-x-6'>
            {[
              {
                id: 'body',
                label: 'Response Body',
                count: 0,
              },
              {
                id: 'headers',
                label: 'Headers',
                count:
                  response?.headers && typeof response?.headers === 'object'
                    ? Object.keys(response.headers).length
                    : 0,
              },
              {
                id: 'cookies',
                label: 'Cookies',
                count:
                  response?.cookies && typeof response?.cookies === 'object'
                    ? response?.cookies.length
                    : 0,
              },
              {
                id: 'actualRequest',
                label: 'Actual Request',
                count: actualRequestBody?.length,
              },
              {
                id: 'assertions',
                label: 'Assertions(R)',
                count: response?.assertions ? response.assertions.length : 0,
              },
            ].map((tab) => {
              const count = tab.count ?? 0;
              const showBlueDot =
                ['assertions', 'actualRequest'].includes(tab.id) && count > 0;
              const showCountBadge =
                ['headers', 'cookies'].includes(tab.id) && count > 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`pt-4 pb-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.label}</span>

                  {showBlueDot && (
                    <span
                      className='inline-block w-1.5 h-1.5 rounded-full bg-[#136fb0]'
                      aria-label={`${count} item${count !== 1 ? 's' : ''}`}
                    />
                  )}

                  {showCountBadge && (
                    <span className='ml-1 bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 text-xs'>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className='flex items-center gap-4'>
            <button
              onClick={() => setShowAssertionUI(true)}
              className='flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700 px-4 py-2 hover:bg-blue-50 rounded-lg transition-colors'
            >
              <CheckCircle className='w-4 h-4' />
              <span>Manage Assertions</span>
            </button>

            {response && (
              <div className='flex items-center space-x-4 text-sm text-gray-600'>
                {/* {response.status && (
                  <span
                    className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
                      response.status >= 200 && response.status < 300
                        ? 'bg-green-100 text-green-700'
                        : response.status >= 400
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    <CheckCircle className='w-4 h-4' />
                    <span>
                      {response.status} {response.statusText || 'OK'}
                    </span>
                  </span>
                )} */}

                {response.assertions &&
                  response.assertions.length > 0 &&
                  response.assertions[0].responseTime && (
                    <span className='font-medium'>
                      {response.assertions[0].responseTime}ms
                    </span>
                  )}

                {response?.size && (
                  <span className='font-medium'>
                    {(response?.size / 1024).toFixed(2)} KB
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className='p-6 max-h-96 overflow-auto scrollbar-thin'>
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
                  (e) => e.name === name,
                );
                const isJwt =
                  typeof value === 'string' &&
                  /[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/.test(
                    value,
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
                              onClick={() => handleCopy?.(name)}
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
                                  Apply auth to all requests
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
                        <span className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded border text-sm font-mono flex-1 overflow-x-auto scrollbar-thin whitespace-nowrap'>
                          {extraction?.path}
                        </span>
                        <button
                          onClick={() => onRemoveExtraction?.(name)}
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
                        <span className='bg-gray-50 px-2 py-1 rounded border text-sm font-mono flex-1 overflow-x-auto scrollbar-thin whitespace-nowrap'>
                          {extraction?.path}
                        </span>
                      </p>

                      <div className='bg-gray-50 px-2 py-1 rounded border text-sm font-mono overflow-x-auto scrollbar-thin whitespace-nowrap'>
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
                <code className='bg-blue-100 px-1 rounded overflow-x-auto scrollbar-thin whitespace-nowrap inline-block'>{`{{variableName}}`}</code>
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
                  className='w-full px-3 py-1.5 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm overflow-x-auto scrollbar-thin whitespace-nowrap'
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
                  className='flex-1 px-3 py-1.5 border border-gray-300 rounded-lg bg-gray-50 text-sm overflow-x-auto scrollbar-thin whitespace-nowrap'
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
                  className='flex-1 px-3 py-1.5 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm overflow-x-auto scrollbar-thin whitespace-nowrap'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Preview Value
                </label>
                <div className='p-2 bg-gray-50 rounded-lg border overflow-x-auto scrollbar-thin'>
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
                  className='w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm overflow-x-auto scrollbar-thin whitespace-nowrap'
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

      {selectedAssertion && (
        <AssertionModal
          isOpen={assertionModalOpen}
          onClose={() => {
            setAssertionModalOpen(false);
            setSelectedAssertion(null);
          }}
          initialField={selectedAssertion.path}
          initialValue={selectedAssertion.value}
          suggestedAssertions={
            selectedAssertion.filteredAssertions || normalizedAssertions
          }
          availableOperators={selectedAssertion.operators}
          fieldType={selectedAssertion.fieldType}
          allAssertions={normalizedAssertions}
          setAssertions={onAssertionsUpdate}
          variables={variables}
          dynamicVariables={dynamicVariables}
          extractedVariables={getExtractedVariablesForAssertion()}
          onSelect={(assertionType: string, config?: any) => {
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
                  description = `Response should contain static value: "${config.value}"`;
                  finalType = 'contains';
                  break;
                case 'contains_dynamic':
                  description = `Response should contain dynamic variable: ${config.value}`;
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
                contains: 'contains',
                field_not_contains: 'does not contain',
                array_length: 'has length',
                field_null: 'is null',
                field_not_null: 'is not null',
                field_is_true: 'is true',
                field_is_false: 'is false',
                exists: 'exists',
                field_not_present: 'does not exist',
              };
              const operatorText =
                operatorLabels[config.operator] || config.operator;
              description = `${selectedAssertion.path} ${operatorText}${
                config.expectedValue ? ` "${config.expectedValue}"` : ''
              }`;
            }

            const normalizeFieldPath = (path: string) => {
              if (path.startsWith('headers.')) {
                return path.replace(/^headers\./, '').toLowerCase();
              }
              return path;
            };

            const baseAssertion = {
              id: generateUUID(),
              type: finalType,
              displayType: assertionType,
              category: config?.isGeneral
                ? 'general'
                : selectedAssertion.path.startsWith('headers.')
                  ? 'headers'
                  : 'body',
              description,
              value: selectedAssertion.value,
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
                    field: normalizeFieldPath(selectedAssertion.path),
                  };

            const updatedAssertions = [...normalizedAssertions, newAssertion];
            if (onAssertionsUpdate) {
              onAssertionsUpdate(updatedAssertions);
            }
            setAssertionModalOpen(false);
            setSelectedAssertion(null);
          }}
        />
      )}

      {/* API Assertion Interface Modal - Add this before the final closing </div> */}
      {showAssertionUI && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col'>
            {/* Header */}
            <div className='flex items-center justify-between p-4 border-b border-gray-200'>
              <h2 className='text-xl font-bold text-gray-900'>
                API Assertions Manager
              </h2>
              <button
                onClick={() => setShowAssertionUI(false)}
                className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
              >
                <X className='w-5 h-5 text-gray-500' />
              </button>
            </div>

            {/* Content */}
            <div className='flex-1 overflow-auto'>
              <ApiAssertionInterface
                assertions={normalizedAssertions}
                responseData={response}
                onUpdateAssertions={onAssertionsUpdate}
                mode='add'
                onAddAssertionsToRequest={(assertions) => {
                  if (onAssertionsUpdate) {
                    onAssertionsUpdate(assertions);
                  }
                  setShowAssertionUI(false);
                }}
                allDynamicVariables={allDynamicVariables}
                allStaticVariables={allStaticVariables}
                allExtractedVariables={allExtractedVariables}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
