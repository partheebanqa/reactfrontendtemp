'use client';

import type React from 'react';
import { useState, useEffect } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Check,
  ChevronRight,
  ChevronDown,
  Info,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RequestHeader {
  key: string;
  value: string;
  enabled: boolean;
}

interface RequestParam {
  key: string;
  value: string;
  enabled: boolean;
}

interface Request {
  id: string;
  method: string;
  name: string;
  url: string;
  bodyType?: string;
  bodyRawContent?: string;
  authorizationType?: string;
  authorization?: any;
  headers?: RequestHeader[];
  params?: RequestParam[];
}

interface ExtractedField {
  variableName: string;
  value: any;
  source: string;
  path: string;
}

interface ExtractedVariable {
  name: string;
  path: string;
  source: string;
  type: string;
}

interface RequestTestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: Request;
  onSaveExtractVariables?: (
    requestId: string,
    extractVariables: ExtractedVariable[]
  ) => void;
  existingExtractedVariables?: ExtractedVariable[];
}

export const RequestTestDialog: React.FC<RequestTestDialogProps> = ({
  isOpen,
  onClose,
  request,
  onSaveExtractVariables,
  existingExtractedVariables = [],
}) => {
  const [url, setUrl] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [method, setMethod] = useState('GET');
  const [headers, setHeaders] = useState<RequestHeader[]>([]);
  const [params, setParams] = useState<RequestParam[]>([]);
  const [body, setBody] = useState('');
  const [bodyType, setBodyType] = useState('raw');
  const [authType, setAuthType] = useState('none');
  const [authToken, setAuthToken] = useState('');

  // response state can hold either string or object
  const [response, setResponse] = useState<any>(null);
  const [responseHeaders, setResponseHeaders] = useState<
    Record<string, string>
  >({});
  const [responseView, setResponseView] = useState<'body' | 'headers'>('body');
  const [bodyView, setBodyView] = useState<'json' | 'text'>('json');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  // Initialize state when request changes or dialog opens
  useEffect(() => {
    if (isOpen && request) {
      console.log('Initializing RequestTestDialog with request:', request);

      setUrl(request.url || '');
      setMethod(request.method || 'GET');

      // Enhanced body initialization with multiple possible field names
      const requestBody =
        request.bodyRawContent ||
        request.body ||
        request.bodyContent ||
        (request as any).body_raw_content ||
        '';

      console.log('Setting body content:', {
        bodyRawContent: request.bodyRawContent,
        body: (request as any).body,
        bodyContent: (request as any).bodyContent,
        body_raw_content: (request as any).body_raw_content,
        finalBody: requestBody,
      });

      setBody(requestBody);
      setBodyType(request.bodyType || 'raw');
      setAuthType(request.authorizationType || 'none');
      setAuthToken(request.authorization?.token || '');

      // Initialize headers with better fallback handling
      if (Array.isArray(request.headers) && request.headers.length > 0) {
        setHeaders(request.headers);
      } else {
        setHeaders([{ key: '', value: '', enabled: true }]);
      }

      // Initialize params with better fallback handling
      if (Array.isArray(request.params) && request.params.length > 0) {
        setParams(request.params);
      } else {
        setParams([{ key: '', value: '', enabled: true }]);
      }

      // Convert existing extracted variables to ExtractedField format for display
      if (existingExtractedVariables && existingExtractedVariables.length > 0) {
        const convertedFields: ExtractedField[] =
          existingExtractedVariables.map((variable) => ({
            variableName: variable.name,
            value: `Extracted from ${variable.source}`, // We don't have the actual value, just show info
            source: variable.source,
            path: variable.path,
          }));
        setExtractedFields(convertedFields);
      } else {
        setExtractedFields([]);
      }

      // Reset response data
      setResponse(null);
      setResponseHeaders({});
      setExpandedPaths(new Set());
    }
  }, [isOpen, request, existingExtractedVariables]);

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (
    index: number,
    field: 'key' | 'value' | 'enabled',
    value: string | boolean
  ) => {
    const updatedHeaders = [...headers];
    updatedHeaders[index] = { ...updatedHeaders[index], [field]: value };
    setHeaders(updatedHeaders);
  };

  const addParam = () => {
    setParams([...params, { key: '', value: '', enabled: true }]);
  };

  const removeParam = (index: number) => {
    setParams(params.filter((_, i) => i !== index));
  };

  const updateParam = (
    index: number,
    field: 'key' | 'value' | 'enabled',
    value: string | boolean
  ) => {
    const updatedParams = [...params];
    updatedParams[index] = { ...updatedParams[index], [field]: value };
    setParams(updatedParams);
  };

  const buildUrl = () => {
    let finalUrl = url;
    const enabledParams = params.filter((p) => p.enabled && p.key);

    if (enabledParams.length > 0) {
      const searchParams = new URLSearchParams();
      enabledParams.forEach((param) => {
        if (param.key && param.value) {
          searchParams.append(param.key, param.value);
        }
      });
      finalUrl = `${url}?${searchParams.toString()}`;
    }

    return finalUrl;
  };

  const toggleExpanded = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const extractField = (
    path: string,
    value: any,
    source: 'response_body' | 'response_header'
  ) => {
    // Extract just the final property name from the path
    const pathParts = path.split(/[\.\[\]]+/).filter(Boolean);
    const finalProperty = pathParts[pathParts.length - 1];
    const variableName = `E_${finalProperty}`;

    const newExtraction: ExtractedField = {
      variableName,
      value,
      source,
      path,
    };

    // Check if already extracted
    const isAlreadyExtracted = extractedFields.some(
      (field) => field.path === path && field.source === source
    );
    if (!isAlreadyExtracted) {
      setExtractedFields((prev) => [...prev, newExtraction]);
    }
  };

  const isFieldExtracted = (
    path: string,
    source: 'response_body' | 'response_header'
  ) => {
    return extractedFields.some(
      (field) => field.path === path && field.source === source
    );
  };

  const isPrimitive = (value: any): boolean => {
    return (
      value === null ||
      value === undefined ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    );
  };

  const getValueDisplay = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'number') return value.toString();
    if (Array.isArray(value)) return `Array[${value.length}]`;
    if (typeof value === 'object') return 'Object';
    return String(value);
  };

  const renderJsonField = (
    key: string | number,
    value: any,
    path = '',
    source: 'response_body' | 'response_header' = 'response_body',
    depth = 0
  ): React.ReactNode => {
    const isArrayIndex = typeof key === 'number';
    const currentPath = path
      ? isArrayIndex
        ? `${path}[${key}]`
        : `${path}.${key}`
      : String(key);

    const isExpanded = expandedPaths.has(currentPath);
    const indent = depth * 16;

    // Handle arrays
    if (Array.isArray(value)) {
      return (
        <div key={currentPath} style={{ marginLeft: `${indent}px` }}>
          <div className='group relative hover:bg-gray-50 px-2 py-1 rounded'>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => toggleExpanded(currentPath)}
                className='p-1 hover:bg-gray-200 rounded'
              >
                {isExpanded ? (
                  <ChevronDown className='w-3 h-3' />
                ) : (
                  <ChevronRight className='w-3 h-3' />
                )}
              </button>
              <span>
                <span className='text-blue-600 font-medium'>
                  {isArrayIndex ? `[${key}]` : `"${key}"`}
                </span>
                <span className='text-gray-600 ml-2'>
                  Array[{value.length}]
                </span>
              </span>
            </div>
            <button
              onClick={() => extractField(currentPath, value, source)}
              className='absolute top-1/2 right-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity'
              title={`Extract ${key}`}
            >
              {isFieldExtracted(currentPath, source) ? (
                <div className='flex items-center gap-1'>
                  <Check className='w-3 h-3 text-green-500' />
                  <span className='text-xs text-green-500'>Extracted</span>
                </div>
              ) : (
                <div className='flex items-center gap-1 bg-blue-900 text-white px-2 py-1 rounded hover:bg-blue-800 text-xs transition'>
                  Extract
                </div>
              )}
            </button>
          </div>

          {isExpanded && (
            <div className='border-l-2 border-gray-200 ml-4'>
              {value.map((item: any, index: number) =>
                renderJsonField(index, item, currentPath, source, depth + 1)
              )}
            </div>
          )}
        </div>
      );
    }

    // Handle objects
    if (typeof value === 'object' && value !== null) {
      const entries = Object.entries(value);
      return (
        <div key={currentPath} style={{ marginLeft: `${indent}px` }}>
          <div className='group relative hover:bg-gray-50 px-2 py-1 rounded'>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => toggleExpanded(currentPath)}
                className='p-1 hover:bg-gray-200 rounded'
              >
                {isExpanded ? (
                  <ChevronDown className='w-3 h-3' />
                ) : (
                  <ChevronRight className='w-3 h-3' />
                )}
              </button>
              <span>
                <span className='text-blue-600 font-medium'>
                  {isArrayIndex ? `[${key}]` : `"${key}"`}
                </span>
              </span>
            </div>
            <button
              onClick={() => extractField(currentPath, value, source)}
              className='absolute top-1/2 right-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity'
              title={`Extract ${key}`}
            >
              {isFieldExtracted(currentPath, source) ? (
                <div className='flex items-center gap-1'>
                  <Check className='w-3 h-3 text-green-500' />
                  <span className='text-xs text-green-500'>Extracted</span>
                </div>
              ) : (
                <div className='flex items-center gap-1 bg-blue-900 text-white px-2 py-1 rounded hover:bg-blue-800 text-xs transition'>
                  Extract
                </div>
              )}
            </button>
          </div>

          {isExpanded && (
            <div className='border-l-2 border-gray-200 ml-4'>
              {entries.map(([subKey, subValue]) =>
                renderJsonField(
                  subKey,
                  subValue,
                  currentPath,
                  source,
                  depth + 1
                )
              )}
            </div>
          )}
        </div>
      );
    }

    // Handle primitive values
    return (
      <div
        key={currentPath}
        style={{ marginLeft: `${indent}px` }}
        className='group relative hover:bg-gray-50 px-2 py-1 rounded'
      >
        <span>
          <span className='text-blue-600 font-medium'>
            {isArrayIndex ? `[${key}]` : `"${key}"`}
          </span>
          <span className='text-gray-600'>: </span>
          <span className='text-green-600'>{getValueDisplay(value)}</span>
        </span>
        <button
          onClick={() => extractField(currentPath, value, source)}
          className='absolute top-1/2 right-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity'
          title={`Extract ${key}`}
        >
          {isFieldExtracted(currentPath, source) ? (
            <div className='flex items-center gap-1'>
              <Check className='w-3 h-3 text-green-500' />
              <span className='text-xs text-green-500'>Extracted</span>
            </div>
          ) : (
            <div className='flex items-center gap-1 bg-blue-900 text-white px-2 py-1 rounded hover:bg-blue-800 text-xs transition'>
              Extract
            </div>
          )}
        </button>
      </div>
    );
  };

  const renderHeaderField = (key: string, value: string) => {
    return (
      <div
        key={key}
        className='group relative hover:bg-gray-50 px-2 py-1 rounded'
      >
        <span className='block pr-20'>
          <span className='text-blue-600 font-medium break-all'>{key}</span>:
          <span className='text-green-600 ml-2 break-all'>{value}</span>
        </span>
        <button
          onClick={() => extractField(key, value, 'response_header')}
          className='absolute top-1/2 right-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity'
          title={`Extract ${key}`}
        >
          {isFieldExtracted(key, 'response_header') ? (
            <div className='flex items-center gap-1'>
              <Check className='w-3 h-3 text-green-500' />
              <span className='text-xs text-green-500'>Extracted</span>
            </div>
          ) : (
            <button className='flex items-center gap-1 bg-blue-900 text-white px-2 py-1 rounded hover:bg-blue-800 text-xs transition'>
              Extract
            </button>
          )}
        </button>
      </div>
    );
  };

  const renderTextWithExtractButtons = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'object') {
        return (
          <div className='text-sm'>
            {Array.isArray(parsed) ? (
              <div>
                <div className='text-blue-600 font-medium mb-2'>
                  Array[{parsed.length}]
                </div>
                {parsed.map((item, index) =>
                  renderJsonField(index, item, '', 'response_body', 0)
                )}
              </div>
            ) : (
              <div>
                <div className='text-blue-600 font-medium mb-2'>Object</div>
                {Object.entries(parsed).map(([key, value]) =>
                  renderJsonField(key, value, '', 'response_body', 0)
                )}
              </div>
            )}
          </div>
        );
      }
    } catch {
      // Not JSON, treat as plain text
    }

    const lines = text.split('\n');
    return (
      <div className='text-sm font-mono'>
        {lines.map((line, index) => (
          <div
            key={index}
            className='group relative hover:bg-gray-50 px-2 py-1 rounded'
          >
            <span className='block pr-20'>{line}</span>
            {line.trim() && (
              <button
                onClick={() =>
                  extractField(`line_${index}`, line.trim(), 'response_body')
                }
                className='absolute top-1/2 right-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity'
                title={`Extract line ${index + 1}`}
              >
                {isFieldExtracted(`line_${index}`, 'response_body') ? (
                  <div className='flex items-center gap-1'>
                    <Check className='w-3 h-3 text-green-500' />
                    <span className='text-xs text-green-500'>Extracted</span>
                  </div>
                ) : (
                  <button className='flex items-center gap-1 bg-blue-900 text-white px-2 py-1 rounded hover:bg-blue-800 text-xs transition'>
                    Extract
                  </button>
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  const sendRequest = async () => {
    setIsLoading(true);
    setResponse('');
    setResponseHeaders({});
    setExpandedPaths(new Set()); // Reset expanded paths on new request

    try {
      const finalBodyType = bodyType ?? 'raw';

      // Mock response for demonstration
      const mockResponse = {
        data: {
          responses: [
            {
              body: JSON.stringify({
                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
                user: {
                  id: '12345',
                  email: 'user@example.com',
                  name: 'John Doe',
                  role: 'admin',
                },
                expires_in: 3600,
                refresh_token: 'refresh_123456789',
              }),
              headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer token_here',
                'X-RateLimit-Remaining': '99',
                'Set-Cookie': 'session=abc123; HttpOnly',
              },
            },
          ],
        },
      };

      const firstResponse = mockResponse?.data?.responses?.[0];

      let parsedBody: unknown = firstResponse?.body;
      try {
        parsedBody = JSON.parse(firstResponse.body);
      } catch {
        // leave as raw string if not JSON
      }

      setResponse(parsedBody);
      setResponseHeaders(firstResponse?.headers || {});
    } catch (error) {
      const errorMessage = `Error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      setResponse(errorMessage);
      setResponseHeaders({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveVariables = () => {
    if (onSaveExtractVariables) {
      // Filter out existing variables (those without actual response values)
      const newExtractedFields = extractedFields.filter(
        (field) => field.value !== `Extracted from ${field.source}`
      );

      if (newExtractedFields.length > 0) {
        const formattedVariables: ExtractedVariable[] = newExtractedFields.map(
          (field) => ({
            name: field.variableName,
            path: field.path,
            source: field.source,
            type:
              typeof field.value === 'string'
                ? 'string'
                : typeof field.value === 'number'
                ? 'number'
                : typeof field.value === 'boolean'
                ? 'boolean'
                : Array.isArray(field.value)
                ? 'array'
                : typeof field.value === 'object'
                ? 'object'
                : 'string',
          })
        );

        console.log('Saving variables from RequestTestDialog:', {
          requestId: request.id,
          variables: formattedVariables,
        });

        onSaveExtractVariables(request.id, formattedVariables);
      }

      setExtractedFields([]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] w-[90vw] overflow-hidden flex flex-col'>
        <DialogHeader>
          <div className='flex items-center gap-2'>
            <DialogTitle className='flex items-center gap-2'>
              <span>Add Authentication extraction</span>
              <span className='text-sm text-gray-500'>: {request.name}</span>
            </DialogTitle>

            <Tooltip>
              <TooltipTrigger asChild>
                <Info className='w-4 h-4 text-gray-500 cursor-pointer' />
              </TooltipTrigger>
              <TooltipContent
                side='bottom'
                align='start'
                className='max-w-sm text-xs p-2 leading-relaxed text-gray-600'
              >
                <p>Step 1: Send the request with your login credentials.</p>
                <p>
                  Step 2: On a successful response, you'll get the option to
                  extract the authorization token from the request body or
                  header.
                </p>
                <p>Step 3: Save the extracted variables.</p>
                <p>
                  Note: This token will be used for other api's in the test
                  suite to execute the functional testcases.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </DialogHeader>

        <div className='flex-1 flex flex-col min-h-0 overflow-hidden'>
          <div className='flex gap-2 mb-3 items-center'>
            <Select
              value={method}
              onValueChange={(value) => setMethod(value as typeof method)}
            >
              <SelectTrigger className='w-28'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='GET'>GET</SelectItem>
                <SelectItem value='POST'>POST</SelectItem>
                <SelectItem value='PUT'>PUT</SelectItem>
                <SelectItem value='PATCH'>PATCH</SelectItem>
                <SelectItem value='DELETE'>DELETE</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder='Enter request URL'
              className='flex-1'
            />
            <Button onClick={sendRequest} disabled={isLoading}>
              <Send className='w-4 h-4 mr-2' />
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>

          <div className='flex-1 flex flex-col min-h-0 overflow-hidden'>
            <Tabs
              defaultValue='params'
              className='flex-1 flex flex-col min-h-0'
            >
              <TabsList className='grid w-full grid-cols-6'>
                <TabsTrigger value='params'>Params</TabsTrigger>
                <TabsTrigger value='headers'>Headers</TabsTrigger>
                <TabsTrigger value='body'>Body</TabsTrigger>
                <TabsTrigger value='auth'>Auth</TabsTrigger>
                <TabsTrigger value='tests'>Tests</TabsTrigger>
                <TabsTrigger value='settings'>Settings</TabsTrigger>
              </TabsList>

              <div className='flex-1 overflow-hidden min-h-0'>
                {/* Params */}
                <TabsContent
                  value='params'
                  className='h-full overflow-auto data-[state=active]:flex data-[state=active]:flex-col'
                >
                  <div className='space-y-2'>
                    {params.map((param, index) => (
                      <div key={index} className='flex items-center gap-2'>
                        <Input
                          placeholder='Key'
                          value={param.key}
                          onChange={(e) =>
                            updateParam(index, 'key', e.target.value)
                          }
                          className='flex-1'
                        />
                        <Input
                          placeholder='Value'
                          value={param.value}
                          onChange={(e) =>
                            updateParam(index, 'value', e.target.value)
                          }
                          className='flex-1'
                        />
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => removeParam(index)}
                          disabled={params.length === 1}
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </div>
                    ))}
                    <Button variant='outline' onClick={addParam} size='sm'>
                      <Plus className='w-4 h-4 mr-2' />
                      Add Parameter
                    </Button>
                  </div>
                </TabsContent>

                {/* Headers */}
                <TabsContent
                  value='headers'
                  className='h-full overflow-auto data-[state=active]:flex data-[state=active]:flex-col'
                >
                  <div className='space-y-2'>
                    {headers.map((header, index) => (
                      <div key={index} className='flex items-center gap-2'>
                        <Input
                          placeholder='Key'
                          value={header.key}
                          onChange={(e) =>
                            updateHeader(index, 'key', e.target.value)
                          }
                          className='flex-1'
                        />
                        <Input
                          placeholder='Value'
                          value={header.value}
                          onChange={(e) =>
                            updateHeader(index, 'value', e.target.value)
                          }
                          className='flex-1'
                        />
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => removeHeader(index)}
                          disabled={headers.length === 1}
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </div>
                    ))}
                    <Button variant='outline' onClick={addHeader} size='sm'>
                      <Plus className='w-4 h-4 mr-2' />
                      Add Header
                    </Button>
                  </div>
                </TabsContent>

                {/* Body */}
                <TabsContent value='body' className='h-full overflow-auto'>
                  <div className='space-y-4'>
                    <div>
                      <Label>Body Type</Label>
                      <Select
                        value={bodyType}
                        onValueChange={(value) =>
                          setBodyType(value as typeof bodyType)
                        }
                      >
                        <SelectTrigger className='w-48'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='none'>None</SelectItem>
                          <SelectItem value='raw'>Raw</SelectItem>
                          <SelectItem value='form-data'>Form Data</SelectItem>
                          <SelectItem value='x-www-form-urlencoded'>
                            x-www-form-urlencoded
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {bodyType === 'raw' && (
                      <div>
                        <Label>Content</Label>
                        <Textarea
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          placeholder='Enter request body (JSON, XML, text, etc.)'
                          className='min-h-[120px] font-mono'
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Auth */}
                <TabsContent value='auth' className='h-full overflow-auto'>
                  <div className='space-y-4'>
                    <div>
                      <Label>Authentication Type</Label>
                      <Select
                        value={authType}
                        onValueChange={(value) =>
                          setAuthType(value as typeof authType)
                        }
                      >
                        <SelectTrigger className='w-48'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='none'>No Auth</SelectItem>
                          <SelectItem value='bearer'>Bearer Token</SelectItem>
                          <SelectItem value='basic'>Basic Auth</SelectItem>
                          <SelectItem value='api-key'>API Key</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {authType === 'bearer' && (
                      <div className='relative'>
                        <Label>Token</Label>
                        <div className='relative'>
                          <Input
                            type={showToken ? 'text' : 'password'}
                            value={authToken}
                            onChange={(e) => setAuthToken(e.target.value)}
                            placeholder='Enter bearer token'
                            className='pr-10'
                          />
                          <button
                            type='button'
                            onClick={() => setShowToken(!showToken)}
                            className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700'
                          >
                            {showToken ? (
                              <EyeOff className='w-5 h-5' />
                            ) : (
                              <Eye className='w-5 h-5' />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Tests */}
                <TabsContent value='tests' className='h-full overflow-auto'>
                  <div className='text-center py-8 text-muted-foreground'>
                    <p>
                      Test scripts and assertions will be available in future
                      updates.
                    </p>
                  </div>
                </TabsContent>

                {/* Settings */}
                <TabsContent value='settings' className='h-full overflow-auto'>
                  <div className='text-center py-8 text-muted-foreground'>
                    <p>Request settings will be available in future updates.</p>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Scrollable bottom section for Response and Extracted Fields */}
          <div className='flex-shrink-0 overflow-y-auto max-h-96 border-t'>
            {/* Response Section */}
            {(response || Object.keys(responseHeaders).length > 0) && (
              <div className='pt-3'>
                <Label className='text-sm font-medium mb-2 block'>
                  Response
                </Label>

                <Tabs
                  value={responseView}
                  onValueChange={(val) =>
                    setResponseView(val as 'body' | 'headers')
                  }
                  className='flex-1 flex flex-col min-h-0'
                >
                  <div className='flex justify-between items-center mb-2'>
                    <TabsList className='grid w-fit grid-cols-2'>
                      <TabsTrigger value='body'>Body</TabsTrigger>
                      <TabsTrigger value='headers'>
                        Headers ({Object.keys(responseHeaders).length})
                      </TabsTrigger>
                    </TabsList>

                    {responseView === 'body' && (
                      <Select
                        value={bodyView}
                        onValueChange={(val) =>
                          setBodyView(val as 'json' | 'text')
                        }
                      >
                        <SelectTrigger className='w-24 h-7 text-xs'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='json'>JSON</SelectItem>
                          <SelectItem value='text'>Text</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <TabsContent
                    value='body'
                    className='mt-0 data-[state=active]:flex data-[state=active]:flex-col'
                  >
                    <div className='rounded-md border p-2 bg-muted max-h-64 overflow-auto'>
                      <div className='overflow-x-auto overflow-y-auto'>
                        {(() => {
                          if (
                            bodyView === 'json' &&
                            typeof response === 'object'
                          ) {
                            return (
                              <div className='text-sm'>
                                {Array.isArray(response) ? (
                                  <div>
                                    <div className='text-blue-600 font-medium mb-2'>
                                      Array[{response.length}]
                                    </div>
                                    {response.map((item, index) =>
                                      renderJsonField(
                                        index,
                                        item,
                                        '',
                                        'response_body',
                                        0
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    <div className='text-blue-600 font-medium mb-2'>
                                      Object
                                    </div>
                                    {Object.entries(response).map(
                                      ([key, value]) =>
                                        renderJsonField(
                                          key,
                                          value,
                                          '',
                                          'response_body',
                                          0
                                        )
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          }

                          return (
                            <div className='text-sm font-mono'>
                              {renderTextWithExtractButtons(
                                typeof response === 'string'
                                  ? response
                                  : JSON.stringify(response, null, 2)
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value='headers'
                    className='mt-0 data-[state=active]:flex data-[state=active]:flex-col'
                  >
                    <div className='rounded-md border p-2 bg-muted max-h-64 overflow-auto'>
                      <div className='text-sm space-y-1 overflow-x-auto'>
                        {Object.entries(responseHeaders).map(([key, value]) =>
                          renderHeaderField(key, value)
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {extractedFields.length > 0 && (
              <div className='mt-3 border-t pt-3'>
                <div className='flex justify-between items-center sticky top-0 bg-white pb-2'>
                  <Label className='text-sm font-medium'>
                    Extracted Fields ({extractedFields.length})
                  </Label>
                  <Button size='sm' onClick={handleSaveVariables}>
                    Save Variables
                  </Button>
                </div>
                <div className='mt-2 space-y-2'>
                  {extractedFields.map((field, index) => (
                    <div
                      key={index}
                      className={`border rounded p-2 text-sm ${
                        field.value === `Extracted from ${field.source}`
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div
                        className={`font-medium ${
                          field.value === `Extracted from ${field.source}`
                            ? 'text-blue-800'
                            : 'text-green-800'
                        }`}
                      >
                        {field.variableName}
                      </div>
                      <div className='text-gray-600'>
                        <span className='font-medium'>Value:</span>{' '}
                        {String(field.value)} |
                        <span className='font-medium'> Source:</span>{' '}
                        {field.source} |
                        <span className='font-medium'> Path:</span> {field.path}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
