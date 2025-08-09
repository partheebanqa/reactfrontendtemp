'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Code,
  Globe,
  Key,
  TestTube,
  Settings,
  GitBranch,
  ChevronDown,
  ChevronRight,
  TriangleAlert,
  Play,
  Copy,
  AlertTriangle,
  Shield,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type {
  APIRequest,
  DataExtraction,
  ExecutionLog,
  TestScript,
  Variable,
} from '@/shared/types/requestChain.model';
import { ResponseExplorer } from './ResponseExplorer';
import { useToast } from '@/hooks/use-toast';
import { parseCookies } from '@/lib/cookieUtils';
import {
  buildRequestPayload,
  executeRequest,
} from '@/services/executeRequest.service';

interface RequestEditorProps {
  request: APIRequest;
  globalVariables: Variable[];
  onUpdate: (updates: Partial<APIRequest>) => void;
  onSave?: () => void;
  compact?: boolean;
  chainName?: string;
  chainDescription?: string;
  chainEnabled?: boolean;
  environmentBaseUrl?: string; // New prop for environment base URL
}

interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export function RequestEditor({
  request,
  globalVariables,
  onUpdate,
  onSave,
  compact = false,
  chainName,
  chainDescription,
  chainEnabled,
  environmentBaseUrl, // New prop
}: RequestEditorProps) {
  const [showRequestUrl, setShowRequestUrl] = useState(true);
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'params' | 'headers' | 'body' | 'auth' | 'tests' | 'settings'
  >('params');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionLog | null>(
    null
  );
  const [showResponse, setShowResponse] = useState(false);
  const [extractedVariables, setExtractedVariables] = useState<
    Record<string, any>
  >({});

  console.log('extractedVariablesInRequestEditor:', extractedVariables);
  const [previousExtractions, setPreviousExtractions] = useState<
    DataExtraction[]
  >([]);
  const [extractionLogs, setExtractionLogs] = useState<any[]>([]);
  const [responseTab, setResponseTab] = useState<
    'body' | 'cookies' | 'headers' | 'test-results'
  >('body');

  const params = request.params || [];
  const headers = request.headers || [];
  const { toast } = useToast();

  const replaceVariables = (text: string, vars: Variable[]): string => {
    let result = text;
    vars.forEach((variable) => {
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      result = result.replace(regex, variable.value);
    });
    return result;
  };

  const getValueByPath = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object') {
        if (key.includes('[') && key.includes(']')) {
          const arrayKey = key.substring(0, key.indexOf('['));
          const index = Number.parseInt(
            key.substring(key.indexOf('[') + 1, key.indexOf(']'))
          );
          return current[arrayKey] && current[arrayKey][index];
        }
        return current[key];
      }
      return undefined;
    }, obj);
  };

  // FIXED: Updated extractDataFromResponse function to handle header case-insensitivity
  const extractDataFromResponse = (
    response: any,
    extractions: APIRequest['extractVariables']
  ): Record<string, any> => {
    const extracted: Record<string, any> = {};
    extractions.forEach((extraction) => {
      try {
        let value;
        if (extraction.source === 'response_body') {
          const jsonData =
            typeof response.body === 'string'
              ? JSON.parse(response.body)
              : response.body;
          value = getValueByPath(jsonData, extraction.path);
        } else if (extraction.source === 'response_header') {
          // FIXED: Handle case-insensitive header lookup
          const headers = response.headers || {};
          const headerKey = extraction.path.toLowerCase();

          // First try direct lowercase lookup
          value = headers[headerKey];

          // If not found, search through all headers case-insensitively
          if (value === undefined) {
            const foundKey = Object.keys(headers).find(
              (key) => key.toLowerCase() === headerKey
            );
            if (foundKey) {
              value = headers[foundKey];
            }
          }
        } else if (extraction.source === 'response_cookie') {
          value = response.cookies?.[extraction.path];
        }

        if (value !== undefined) {
          if (extraction.transform) {
            try {
              const transformFunction = new Function(
                'value',
                `return ${extraction.transform}`
              );
              value = transformFunction(value);
            } catch (transformError) {
              console.error(
                `Transform error for ${extraction.variableName}:`,
                transformError
              );
            }
          }
          extracted[extraction.variableName] = value;
        }
      } catch (error) {
        console.error(`Failed to extract ${extraction.variableName}:`, error);
      }
    });
    return extracted;
  };

  const handleExecute = async () => {
    if (!request.url) {
      toast({
        title: 'Error',
        description: 'Request URL is required',
        variant: 'destructive',
      });
      return;
    }

    setIsExecuting(true);
    try {
      const startTime = Date.now();
      const payload = buildRequestPayload(request, globalVariables);
      const previewUrl = getPreviewUrl();
      payload.request.url = previewUrl;

      const backendData = await executeRequest(payload);
      const result = backendData?.data?.responses?.[0];
      if (!result) throw new Error('No response from executor');

      const extractedData = extractDataFromResponse(
        {
          body: result.body,
          headers: result.headers,
          cookies: parseCookies(result.headers?.['set-cookie'] ?? ''),
        },
        request.extractVariables
      );

      const endTime = Date.now();
      const log: ExecutionLog = {
        id: Date.now().toString(),
        chainId: 'current-chain',
        requestId: request.id,
        status:
          result.statusCode >= 200 && result.statusCode < 300
            ? 'success'
            : 'error',
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration: result.metrics.responseTime,
        request: {
          method: request.method,
          url: previewUrl,
          headers: Object.fromEntries(
            request.headers.map((h) => [h.key, h.value])
          ),
          body: request.body ?? '',
        },
        response: {
          status: result.statusCode,
          headers: result.headers,
          body: result.body,
          size: result.metrics.bytesReceived,
          cookies: parseCookies(result.headers?.['set-cookie'] ?? ''),
        },
        extractedVariables: extractedData,
      };

      setExecutionResult(log);
      toast({
        title: 'Execution Complete',
        description: `Request completed with status ${result.statusCode}`,
        variant: log.status === 'success' ? 'default' : 'destructive',
      });
    } catch (error) {
      const endTime = Date.now();
      const errorLog: ExecutionLog = {
        id: Date.now().toString(),
        chainId: 'current-chain',
        requestId: request.id,
        status: 'error',
        startTime: new Date().toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration: 0,
        request: {
          method: request.method,
          url: getPreviewUrl(),
          headers: {},
          body: request.body,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      setExecutionResult(errorLog);
      toast({
        title: 'Execution Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Updated getPreviewUrl function to use environmentBaseUrl prop
  const getPreviewUrl = () => {
    const replacedUrl = replaceVariables(request.url, globalVariables);
    // Use the environmentBaseUrl prop instead of storeVariables
    const baseUrl = environmentBaseUrl?.trim();
    if (!baseUrl) return replacedUrl;

    try {
      const parsedOriginal = new URL(replacedUrl);
      const parsedBase = new URL(baseUrl);
      return `${parsedBase.origin}${parsedOriginal.pathname}${parsedOriginal.search}${parsedOriginal.hash}`;
    } catch {
      return `${baseUrl.replace(/\/$/, '')}/${replacedUrl.replace(/^\//, '')}`;
    }
  };

  const previewUrl = getPreviewUrl();

  const addKeyValuePair = (type: 'params' | 'headers') => {
    const newPair: KeyValuePair = {
      id: Date.now().toString(),
      key: '',
      value: '',
      enabled: true,
      description: '',
    };

    if (type === 'params') {
      onUpdate({ params: [...params, newPair] });
    } else {
      onUpdate({ headers: [...headers, newPair] });
    }
  };

  const updateKeyValuePair = (
    type: 'params' | 'headers',
    id: string,
    updates: Partial<KeyValuePair>
  ) => {
    if (type === 'params') {
      onUpdate({
        params: params.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      });
    } else {
      onUpdate({
        headers: headers.map((h) => (h.id === id ? { ...h, ...updates } : h)),
      });
    }
  };

  const removeKeyValuePair = (type: 'params' | 'headers', id: string) => {
    if (type === 'params') {
      onUpdate({ params: params.filter((p) => p.id !== id) });
    } else {
      onUpdate({ headers: headers.filter((h) => h.id !== id) });
    }
  };

  const tabs = [
    { id: 'params', label: 'Params', icon: FileText },
    { id: 'headers', label: 'Headers', icon: Code },
    { id: 'body', label: 'Body', icon: FileText },
    { id: 'auth', label: 'Auth', icon: Shield },
    { id: 'tests', label: 'Tests', icon: TestTube },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const formatResponseBody = (body: string, contentType?: string) => {
    try {
      if (
        contentType?.includes('application/json') ||
        body.trim().startsWith('{')
      ) {
        return JSON.stringify(JSON.parse(body), null, 2);
      }
    } catch {
      // Return as-is if not valid JSON
    }
    return body;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const addParam = () => {
    onUpdate({
      params: [...request.params, { key: '', value: '', enabled: true }],
    });
  };

  const updateParam = (
    index: number,
    updates: Partial<{ key: string; value: string; enabled: boolean }>
  ) => {
    const updatedParams = request.params.map((param, i) =>
      i === index ? { ...param, ...updates } : param
    );
    onUpdate({ params: updatedParams });
  };

  const removeParam = (index: number) => {
    onUpdate({
      params: request.params.filter((_, i) => i !== index),
    });
  };

  const handleExtractVariable = (extraction: DataExtraction) => {
    const currentExtractions = request.extractVariables || [];
    const existingChains = JSON.parse(
      localStorage.getItem('extractionLogs') || '[]'
    );

    let maxOrder = 0;
    for (const chain of existingChains) {
      for (const req of chain.chainRequests || []) {
        if (typeof req.order === 'number' && req.order > maxOrder) {
          maxOrder = req.order;
        }
      }
    }

    const nextOrder = maxOrder + 1;
    const extractionWithOrder = {
      ...extraction,
      order: nextOrder,
    };

    const updatedExtractions = [...currentExtractions, extractionWithOrder];

    const newRequest = {
      url: request.url,
      method: request.method,
      requestName: request.name,
      bodyType: request.bodyType,
      bodyRawContent: request.body,
      authorizationType: request.authType,
      authorization: {
        token: request.authToken,
        username: request.authUsername,
        password: request.authPassword,
        apiKey: request.authApiKey,
        apiValue: request.authApiValue,
        apiLocation: request.authApiLocation,
      },
      headers: request.headers,
      params: request.params,
      variables: request.variables || {},
      extractVariables: updatedExtractions,
      name: request.name,
      description: request.description,
      order: nextOrder,
    };

    const chainIndex = existingChains.findIndex(
      (chain: any) =>
        chain.name === chainName &&
        chain.description === chainDescription &&
        chain.isImportant === !!chainEnabled
    );

    if (chainIndex !== -1) {
      existingChains[chainIndex].chainRequests.push(newRequest);
    } else {
      const newChain = {
        name: chainName || '',
        description: chainDescription || '',
        isImportant: !!chainEnabled,
        chainRequests: [newRequest],
      };
      existingChains.push(newChain);
    }

    localStorage.setItem('extractionLogs', JSON.stringify(existingChains));
    setPreviousExtractions(updatedExtractions);
    onUpdate({ extractVariables: updatedExtractions });

    if (executionResult?.response) {
      const extracted = extractDataFromResponse(
        executionResult.response,
        updatedExtractions
      );
      setExtractedVariables(extracted);
    }
  };

  const handleRemoveExtraction = (variableName: string) => {
    const updatedExtractions = request.extractVariables.filter(
      (e) => e.variableName !== variableName
    );
    onUpdate({ extractVariables: updatedExtractions });

    const newExtracted = { ...extractedVariables };
    delete newExtracted[variableName];
    setExtractedVariables(newExtracted);
  };

  const [copied, setCopied] = useState(false);
  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({
        title: 'Copied to Clipboard',
        description: 'The value has been copied successfully.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const addHeader = () => {
    onUpdate({
      headers: [...request.headers, { key: '', value: '', enabled: true }],
    });
  };

  const updateHeader = (
    index: number,
    updates: Partial<{ key: string; value: string; enabled: boolean }>
  ) => {
    const updatedHeaders = request.headers.map((header, i) =>
      i === index ? { ...header, ...updates } : header
    );
    onUpdate({ headers: updatedHeaders });
  };

  const removeHeader = (index: number) => {
    onUpdate({
      headers: request.headers.filter((_, i) => i !== index),
    });
  };

  const addTest = (type: 'status' | 'responseTime' | 'jsonContent') => {
    let newTest: TestScript;
    const base = {
      id: Date.now().toString(),
      type,
      enabled: true,
    };

    if (type === 'status') {
      newTest = {
        ...base,
        operator: 'equal',
        expectedValue: '200',
        description: 'Status code should be equal to 200 (OK)',
      };
    } else if (type === 'responseTime') {
      newTest = {
        ...base,
        operator: 'lessThan',
        expectedValue: '200',
        description: 'Response time should be less than 200 ms',
      };
    } else {
      // type === 'jsonContent'
      newTest = {
        ...base,
        jsonPath: '$.property',
        operator: 'contain',
        expectedValue: 'expected value',
        description:
          'JSON value at path $.property should contain expected value',
      };
    }

    onUpdate({
      testScripts: [...(request.testScripts || []), newTest],
    });
  };

  const updateTest = (testId: string, updates: Partial<TestScript>) => {
    const updatedTests = (request.testScripts || []).map((test) =>
      test.id === testId ? { ...test, ...updates } : test
    );
    onUpdate({ testScripts: updatedTests });
  };

  const removeTest = (testId: string) => {
    onUpdate({
      testScripts: (request.testScripts || []).filter(
        (test) => test.id !== testId
      ),
    });
  };

  const KeyValueTable = ({
    type,
    items,
    addButtonText,
    emptyStateText,
  }: {
    type: 'params' | 'headers';
    items: KeyValuePair[];
    addButtonText: string;
    emptyStateText: string;
  }) => (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>
          {type === 'params' ? 'Params' : 'Headers'}
        </h3>
        <Button
          variant='link'
          size='sm'
          onClick={() => addKeyValuePair(type)}
          className='gap-2 text-primary'
        >
          <Plus className='w-4 h-4' />
          {addButtonText}
        </Button>
      </div>

      {items.length > 0 ? (
        <div className='space-y-2'>
          <div className='grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground border-b pb-2'>
            <div className='col-span-1'></div>
            <div className='col-span-4'>Key</div>
            <div className='col-span-4'>Value</div>
            <div className='col-span-2'>Description</div>
            <div className='col-span-1'></div>
          </div>
          {items.map((item) => (
            <div key={item.id} className='grid grid-cols-12 gap-2 items-center'>
              <div className='col-span-1 flex justify-center'>
                <Checkbox
                  checked={item.enabled}
                  onCheckedChange={(checked) =>
                    updateKeyValuePair(type, item.id, { enabled: !!checked })
                  }
                />
              </div>
              <div className='col-span-4'>
                <Input
                  value={item.key}
                  onChange={(e) =>
                    updateKeyValuePair(type, item.id, { key: e.target.value })
                  }
                  placeholder='Key'
                  className='h-8'
                />
              </div>
              <div className='col-span-4'>
                <Input
                  value={item.value}
                  onChange={(e) =>
                    updateKeyValuePair(type, item.id, { value: e.target.value })
                  }
                  placeholder='Value'
                  className='h-8'
                />
              </div>
              <div className='col-span-2'>
                <Input
                  value={item.description || ''}
                  onChange={(e) =>
                    updateKeyValuePair(type, item.id, {
                      description: e.target.value,
                    })
                  }
                  placeholder='Description'
                  className='h-8'
                />
              </div>
              <div className='col-span-1 flex justify-center'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => removeKeyValuePair(type, item.id)}
                  className='h-8 w-8 p-0 text-red-600 hover:text-red-700'
                >
                  <Trash2 className='w-3 h-3' />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center py-12'>
          <div className='w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4'>
            <Code className='w-8 h-8 text-muted-foreground' />
          </div>
          <p className='text-muted-foreground'>{emptyStateText}</p>
        </div>
      )}
    </div>
  );

  if (compact) {
    return (
      <div className='space-y-4'>
        {/* Request URL */}
        <div className='flex items-center space-x-2'>
          <Select
            value={request.method}
            onValueChange={(value) => onUpdate({ method: value as any })}
          >
            <SelectTrigger className='w-24'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='GET'>GET</SelectItem>
              <SelectItem value='POST'>POST</SelectItem>
              <SelectItem value='PUT'>PUT</SelectItem>
              <SelectItem value='DELETE'>DELETE</SelectItem>
              <SelectItem value='PATCH'>PATCH</SelectItem>
              <SelectItem value='HEAD'>HEAD</SelectItem>
              <SelectItem value='OPTIONS'>OPTIONS</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={request.url}
            onChange={(e) => onUpdate({ url: e.target.value })}
            placeholder='Enter request URL'
            className='flex-1'
          />
          <Button
            onClick={handleExecute}
            disabled={isExecuting}
            className='gap-2 bg-primary text-primary-foreground hover:bg-primary/90'
          >
            <Play className='w-4 h-4' />
            {isExecuting ? 'Running...' : 'Run'}
          </Button>
        </div>

        {/* Final URL Preview */}
        <div className='flex items-center space-x-2 mt-2 text-sm'>
          <span className='text-gray-600 dark:text-gray-400 font-medium'>
            Final URL Preview:
          </span>
          <span className='text-blue-600 dark:text-blue-400 font-mono break-all'>
            {previewUrl}
          </span>
        </div>

        {/* Tabs */}
        <div className='border-b border-gray-200'>
          <nav className='flex space-x-8 px-6'>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className='w-4 h-4' />
                  <span>{tab.label}</span>
                  {tab.id === 'tests' &&
                    request.testScripts &&
                    request.testScripts.length > 0 && (
                      <span className='ml-1 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full'>
                        {request.testScripts.length}
                      </span>
                    )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className='p-6'>
          {activeTab === 'params' && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-medium text-gray-900'>
                  Query Parameters
                </h3>
                <button
                  onClick={addParam}
                  className='flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                >
                  <Plus className='w-4 h-4' />
                  <span>Add Parameter</span>
                </button>
              </div>

              {request.params.length > 0 ? (
                <div className='space-y-2'>
                  {request.params.map((param, index) => (
                    <div key={index} className='flex items-center space-x-2'>
                      <input
                        type='text'
                        value={param.key}
                        onChange={(e) =>
                          updateParam(index, { key: e.target.value })
                        }
                        className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
                        placeholder='Key'
                      />
                      <input
                        type='text'
                        value={param.value}
                        onChange={(e) =>
                          updateParam(index, { value: e.target.value })
                        }
                        className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
                        placeholder='Value (use {{variableName}} for variables)'
                      />
                      <button
                        onClick={() =>
                          updateParam(index, { enabled: !param.enabled })
                        }
                        className={`p-2 rounded-lg transition-colors ${
                          param.enabled
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {param.enabled ? (
                          <Eye className='w-4 h-4' />
                        ) : (
                          <EyeOff className='w-4 h-4' />
                        )}
                      </button>
                      <button
                        onClick={() => removeParam(index)}
                        className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8 text-gray-500'>
                  <FileText className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                  <p>
                    No parameters added. Click "Add Parameter" to get started.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'headers' && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-medium text-gray-900'>Headers</h3>
                <button
                  onClick={addHeader}
                  className='flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                >
                  <Plus className='w-4 h-4' />
                  <span>Add Header</span>
                </button>
              </div>

              {request.headers.length > 0 ? (
                <div className='space-y-2'>
                  {request.headers.map((header, index) => (
                    <div key={index} className='flex items-center space-x-2'>
                      <input
                        type='text'
                        value={header.key}
                        onChange={(e) =>
                          updateHeader(index, { key: e.target.value })
                        }
                        className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
                        placeholder='Header name'
                      />
                      <input
                        type='text'
                        value={header.value}
                        onChange={(e) =>
                          updateHeader(index, { value: e.target.value })
                        }
                        className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
                        placeholder='Header value (use {{variableName}} for variables)'
                      />
                      <button
                        onClick={() =>
                          updateHeader(index, { enabled: !header.enabled })
                        }
                        className={`p-2 rounded-lg transition-colors ${
                          header.enabled
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {header.enabled ? (
                          <Eye className='w-4 h-4' />
                        ) : (
                          <EyeOff className='w-4 h-4' />
                        )}
                      </button>
                      <button
                        onClick={() => removeHeader(index)}
                        className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8 text-gray-500'>
                  <Code className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                  <p>No headers added. Click "Add Header" to get started.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'body' && (
            <div className='space-y-4'>
              <h3 className='text-lg font-medium text-gray-900'>
                Request Body
              </h3>
              <div className='flex items-center space-x-4'>
                <label className='flex items-center space-x-2'>
                  <input
                    type='radio'
                    name='bodyType'
                    value='none'
                    checked={request.bodyType === 'none'}
                    onChange={(e) =>
                      onUpdate({
                        bodyType: e.target.value as APIRequest['bodyType'],
                      })
                    }
                    className='text-blue-600'
                  />
                  <span className='text-sm'>None</span>
                </label>
                <label className='flex items-center space-x-2'>
                  <input
                    type='radio'
                    name='bodyType'
                    value='form-data'
                    checked={request.bodyType === 'form-data'}
                    onChange={(e) =>
                      onUpdate({
                        bodyType: e.target.value as APIRequest['bodyType'],
                      })
                    }
                    className='text-blue-600'
                  />
                  <span className='text-sm'>Form Data</span>
                </label>
                <label className='flex items-center space-x-2'>
                  <input
                    type='radio'
                    name='bodyType'
                    value='x-www-form-urlencoded'
                    checked={request.bodyType === 'x-www-form-urlencoded'}
                    onChange={(e) =>
                      onUpdate({
                        bodyType: e.target.value as APIRequest['bodyType'],
                      })
                    }
                    className='text-blue-600'
                  />
                  <span className='text-sm'>x-www-form-urlencoded</span>
                </label>
                <label className='flex items-center space-x-2'>
                  <input
                    type='radio'
                    name='bodyType'
                    value='raw'
                    checked={request.bodyType === 'raw'}
                    onChange={(e) =>
                      onUpdate({
                        bodyType: e.target.value as APIRequest['bodyType'],
                      })
                    }
                    className='text-blue-600'
                  />
                  <span className='text-sm'>Raw</span>
                </label>
              </div>

              {request.bodyType === 'raw' && (
                <div className='space-y-2'>
                  <div className='flex items-center justify-end'>
                    <select
                      value={request.rawBodyType || 'text'}
                      onChange={(e) =>
                        onUpdate({
                          rawBodyType: e.target.value as
                            | 'text'
                            | 'json'
                            | 'xml'
                            | 'html',
                        })
                      }
                      className='px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    >
                      <option value='text'>Text</option>
                      <option value='json'>JSON</option>
                      <option value='xml'>XML</option>
                      <option value='html'>HTML</option>
                    </select>
                  </div>
                  <textarea
                    value={request.body || ''}
                    onChange={(e) => onUpdate({ body: e.target.value })}
                    rows={8}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm'
                    placeholder='Enter request body... Use {{variableName}} for variables'
                  />
                </div>
              )}

              {request.bodyType !== 'none' && request.bodyType !== 'raw' && (
                <div className='text-center py-8 text-gray-500'>
                  <FileText className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                  <p>Form data editor coming soon...</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'auth' && (
            <div className='space-y-4'>
              <h3 className='text-lg font-medium text-gray-900'>
                Authentication
              </h3>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Auth Type
                  </label>
                  <select
                    value={request.authType || 'none'}
                    onChange={(e) =>
                      onUpdate({
                        authType: e.target.value as APIRequest['authType'],
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  >
                    <option value='none'>No Auth</option>
                    <option value='bearer'>Bearer Token</option>
                    <option value='basic'>Basic Auth</option>
                    <option value='apikey'>API Key</option>
                    <option value='oauth2'>OAuth 2.0</option>
                  </select>
                </div>

                {request.authType === 'bearer' && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Bearer Token
                    </label>
                    <input
                      type='text'
                      value={request.authToken || ''}
                      onChange={(e) => onUpdate({ authToken: e.target.value })}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      placeholder='Enter bearer token or use {{tokenVariable}}'
                    />
                  </div>
                )}

                {request.authType === 'basic' && (
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Username
                      </label>
                      <input
                        type='text'
                        value={request.authUsername || ''}
                        onChange={(e) =>
                          onUpdate({ authUsername: e.target.value })
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        placeholder='Username'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Password
                      </label>
                      <input
                        type='password'
                        value={request.authPassword || ''}
                        onChange={(e) =>
                          onUpdate({ authPassword: e.target.value })
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        placeholder='Password'
                      />
                    </div>
                  </div>
                )}

                {request.authType === 'apikey' && (
                  <div className='space-y-4'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Key
                        </label>
                        <input
                          type='text'
                          value={request.authApiKey || ''}
                          onChange={(e) =>
                            onUpdate({ authApiKey: e.target.value })
                          }
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          placeholder='API Key name'
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Value
                        </label>
                        <input
                          type='text'
                          value={request.authApiValue || ''}
                          onChange={(e) =>
                            onUpdate({ authApiValue: e.target.value })
                          }
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          placeholder='API Key value'
                        />
                      </div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Add to
                      </label>
                      <select
                        value={request.authApiLocation || 'header'}
                        onChange={(e) =>
                          onUpdate({
                            authApiLocation: e.target.value as
                              | 'header'
                              | 'query',
                          })
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      >
                        <option value='header'>Header</option>
                        <option value='query'>Query Params</option>
                      </select>
                    </div>
                  </div>
                )}

                {request.authType === 'oauth2' && (
                  <div className='text-center py-8 text-gray-500'>
                    <Shield className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                    <p>OAuth 2.0 configuration coming soon...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tests' && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-medium text-gray-900'>
                  Test Scripts
                </h3>
                <div className='flex space-x-2'>
                  <button
                    onClick={() => addTest('responseTime')}
                    className='flex items-center space-x-2 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    <Clock className='w-4 h-4' />
                    <span>Response Time</span>
                  </button>
                  <button
                    onClick={() => addTest('status')}
                    className='flex items-center space-x-2 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    <CheckCircle className='w-4 h-4' />
                    <span>Status Code</span>
                  </button>
                  <button
                    onClick={() => addTest('jsonContent')}
                    className='flex items-center space-x-2 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    <Code className='w-4 h-4' />
                    <span>JSON Content</span>
                  </button>
                </div>
              </div>

              {request.testScripts && request.testScripts.length > 0 ? (
                <div className='space-y-3'>
                  {request.testScripts.map((test) => (
                    <div
                      key={test.id}
                      className='border border-gray-200 rounded-lg p-4'
                    >
                      <div className='flex items-center justify-between mb-3'>
                        <h4 className='font-medium text-gray-900'>
                          {test.type === 'status' && 'Status Code Test'}
                          {test.type === 'responseTime' && 'Response Time Test'}
                          {test.type === 'jsonContent' && 'JSON Content Test'}
                        </h4>
                        <div className='flex items-center space-x-2'>
                          <button
                            onClick={() =>
                              updateTest(test.id, { enabled: !test.enabled })
                            }
                            className={`p-1 rounded transition-colors ${
                              test.enabled
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            {test.enabled ? (
                              <Eye className='w-4 h-4' />
                            ) : (
                              <EyeOff className='w-4 h-4' />
                            )}
                          </button>
                          <button
                            onClick={() => removeTest(test.id)}
                            className='p-1 text-red-600 hover:bg-red-50 rounded transition-colors'
                          >
                            <Trash2 className='w-4 h-4' />
                          </button>
                        </div>
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-3 gap-3 text-sm'>
                        {test.type === 'status' && (
                          <>
                            <div>
                              <span className='text-gray-600'>
                                Status code should be
                              </span>
                            </div>
                            <select
                              value={test.operator}
                              onChange={(e) =>
                                updateTest(test.id, {
                                  operator: e.target.value,
                                })
                              }
                              className='px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                            >
                              <option value='equal'>equal</option>
                              <option value='notEqual'>not equal</option>
                              <option value='greaterThan'>greater than</option>
                              <option value='lessThan'>less than</option>
                            </select>
                            <select
                              value={test.expectedValue}
                              onChange={(e) =>
                                updateTest(test.id, {
                                  expectedValue: e.target.value,
                                })
                              }
                              className='px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                            >
                              <option value='200'>200 (OK)</option>
                              <option value='201'>201 (Created)</option>
                              <option value='204'>204 (No Content)</option>
                              <option value='400'>400 (Bad Request)</option>
                              <option value='401'>401 (Unauthorized)</option>
                              <option value='404'>404 (Not Found)</option>
                              <option value='500'>500 (Server Error)</option>
                            </select>
                          </>
                        )}

                        {test.type === 'responseTime' && (
                          <>
                            <div>
                              <span className='text-gray-600'>
                                Response time should be
                              </span>
                            </div>
                            <select
                              value={test.operator}
                              onChange={(e) =>
                                updateTest(test.id, {
                                  operator: e.target.value,
                                })
                              }
                              className='px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                            >
                              <option value='lessThan'>less than</option>
                              <option value='greaterThan'>greater than</option>
                              <option value='equal'>equal to</option>
                            </select>
                            <div className='flex items-center space-x-1'>
                              <input
                                type='number'
                                value={test.expectedValue}
                                onChange={(e) =>
                                  updateTest(test.id, {
                                    expectedValue: e.target.value,
                                  })
                                }
                                className='flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                placeholder='200'
                              />
                              <span className='text-gray-500'>ms</span>
                            </div>
                          </>
                        )}

                        {test.type === 'jsonContent' && (
                          <>
                            <div className='flex items-center space-x-2'>
                              <span className='text-gray-600'>
                                JSON value at path
                              </span>
                              <input
                                type='text'
                                value={test.jsonPath || ''}
                                onChange={(e) =>
                                  updateTest(test.id, {
                                    jsonPath: e.target.value,
                                  })
                                }
                                className='flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono'
                                placeholder='$.property'
                              />
                            </div>
                            <select
                              value={test.operator}
                              onChange={(e) =>
                                updateTest(test.id, {
                                  operator: e.target.value,
                                })
                              }
                              className='px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                            >
                              <option value='contain'>contain</option>
                              <option value='equal'>equal</option>
                              <option value='notEqual'>not equal</option>
                              <option value='exist'>exist</option>
                              <option value='notExist'>not exist</option>
                            </select>
                            <input
                              type='text'
                              value={test.expectedValue}
                              onChange={(e) =>
                                updateTest(test.id, {
                                  expectedValue: e.target.value,
                                })
                              }
                              className='px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                              placeholder='expected value'
                            />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8 text-gray-500'>
                  <TestTube className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                  <p className='mb-4'>
                    No tests added. Click one of the buttons above to add a
                    test.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className='space-y-6'>
              <h3 className='text-lg font-medium text-gray-900'>
                Request Settings
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Timeout (ms)
                  </label>
                  <input
                    type='number'
                    value={request.timeout}
                    onChange={(e) =>
                      onUpdate({
                        timeout: Number.parseInt(e.target.value) || 5000,
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    min='1000'
                    max='60000'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Retries
                  </label>
                  <input
                    type='number'
                    value={request.retries}
                    onChange={(e) =>
                      onUpdate({
                        retries: Number.parseInt(e.target.value) || 0,
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    min='0'
                    max='5'
                  />
                </div>
              </div>
              <div className='p-4 border border-orange-200 bg-orange-50 rounded-lg'>
                <div className='flex items-center space-x-2 mb-3'>
                  <AlertTriangle className='w-5 h-5 text-orange-600' />
                  <h4 className='font-medium text-orange-900'>
                    Error Handling
                  </h4>
                </div>
                <div className='space-y-2'>
                  <label className='flex items-center space-x-2'>
                    <input
                      type='radio'
                      name='errorHandling'
                      value='stop'
                      checked={request.errorHandling === 'stop'}
                      onChange={(e) =>
                        onUpdate({
                          errorHandling: e.target.value as
                            | 'stop'
                            | 'continue'
                            | 'retry',
                        })
                      }
                      className='text-orange-600'
                    />
                    <span className='text-sm text-orange-800'>
                      Stop chain on failure
                    </span>
                  </label>
                  <label className='flex items-center space-x-2'>
                    <input
                      type='radio'
                      name='errorHandling'
                      value='continue'
                      checked={request.errorHandling === 'continue'}
                      onChange={(e) =>
                        onUpdate({
                          errorHandling: e.target.value as
                            | 'stop'
                            | 'continue'
                            | 'retry',
                        })
                      }
                      className='text-orange-600'
                    />
                    <span className='text-sm text-orange-800'>
                      Continue to next step
                    </span>
                  </label>
                  <label className='flex items-center space-x-2'>
                    <input
                      type='radio'
                      name='errorHandling'
                      value='retry'
                      checked={request.errorHandling === 'retry'}
                      onChange={(e) =>
                        onUpdate({
                          errorHandling: e.target.value as
                            | 'stop'
                            | 'continue'
                            | 'retry',
                        })
                      }
                      className='text-orange-600'
                    />
                    <span className='text-sm text-orange-800'>
                      Retry with backoff
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Response Section */}
        {executionResult && (
          <div className='border-t border-gray-200'>
            <div className='flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200'>
              <div className='flex items-center space-x-4'>
                {executionResult.status === 'success' ? (
                  <div className='flex items-center space-x-2'>
                    <CheckCircle className='w-5 h-5 text-green-500' />
                    <span className='text-sm font-medium text-green-700'>
                      Response
                    </span>
                  </div>
                ) : (
                  <div className='flex items-center space-x-2'>
                    <XCircle className='w-5 h-5 text-red-500' />
                    <span className='text-sm font-medium text-red-700'>
                      Response
                    </span>
                  </div>
                )}
                {executionResult.response && (
                  <>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        executionResult.response.status < 300
                          ? 'bg-green-100 text-green-800'
                          : executionResult.response.status < 400
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {executionResult.response.status}{' '}
                      {executionResult.response.status === 200
                        ? 'OK'
                        : executionResult.response.status === 201
                        ? 'Created'
                        : executionResult.response.status === 404
                        ? 'Not Found'
                        : executionResult.response.status === 500
                        ? 'Server Error'
                        : ''}
                    </span>
                    <span className='text-sm text-gray-600'>
                      {executionResult.duration}ms
                    </span>
                    <span className='text-sm text-gray-600'>
                      {(executionResult.response.size / 1024).toFixed(2)} KB
                    </span>
                  </>
                )}
              </div>
              <div className='flex items-center space-x-2'>
                <button
                  onClick={() => setShowResponse(!showResponse)}
                  className='flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded transition-colors'
                >
                  {showResponse ? (
                    <ChevronDown className='w-4 h-4' />
                  ) : (
                    <ChevronRight className='w-4 h-4' />
                  )}
                  <span>{showResponse ? 'Hide' : 'Show'}</span>
                </button>
              </div>
            </div>

            {showResponse && executionResult.response && (
              <>
                <div className='border-b border-gray-200'>
                  <nav className='flex space-x-8 px-6'>
                    {[
                      { id: 'body', label: 'Body', count: null },
                      {
                        id: 'cookies',
                        label: 'Cookies',
                        count: executionResult.response.cookies
                          ? Object.keys(executionResult.response.cookies).length
                          : 0,
                      },
                      {
                        id: 'headers',
                        label: 'Headers',
                        count: Object.keys(executionResult.response.headers)
                          .length,
                      },
                      {
                        id: 'test-results',
                        label: 'Test Results',
                        count: null,
                      },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() =>
                          setResponseTab(tab.id as typeof responseTab)
                        }
                        className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                          responseTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span>{tab.label}</span>
                        {tab.count !== null && tab.count > 0 && (
                          <span className='ml-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full'>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className='p-6'>
                  {responseTab === 'body' && (
                    <div className='space-y-4'>
                      <div
                        className='flex items-center justify-between cursor-pointer'
                        onClick={() => setIsJsonOpen((prev) => !prev)}
                      >
                        <div className='flex items-center space-x-2'>
                          {isJsonOpen ? (
                            <ChevronDown className='w-4 h-4 text-gray-400' />
                          ) : (
                            <ChevronRight className='w-4 h-4 text-gray-400' />
                          )}
                          <span className='text-sm font-medium text-gray-700'>
                            JSON
                          </span>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(executionResult.response!.body);
                            }}
                            className='flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors'
                          >
                            <Copy className='w-3 h-3' />
                            <span>Copy</span>
                          </button>
                        </div>
                      </div>

                      {isJsonOpen && (
                        <div className='relative'>
                          <pre className='bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm font-mono overflow-x-auto max-h-96 leading-relaxed'>
                            <code className='text-gray-800'>
                              {formatResponseBody(
                                executionResult.response.body,
                                executionResult.response.headers['content-type']
                              )}
                            </code>
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {responseTab === 'cookies' && (
                    <div className='space-y-3'>
                      {executionResult.response.cookies &&
                      Object.keys(executionResult.response.cookies).length >
                        0 ? (
                        Object.entries(executionResult.response.cookies).map(
                          ([name, value]) => (
                            <div
                              key={name}
                              className='flex items-center justify-between p-3 bg-gray-50 rounded-lg border'
                            >
                              <div>
                                <span className='font-medium text-gray-900'>
                                  {name}
                                </span>
                                <p className='text-sm text-gray-600 font-mono'>
                                  {value}
                                </p>
                              </div>
                              <button
                                onClick={() => copyToClipboard(value)}
                                className='p-1 text-gray-400 hover:text-gray-600 rounded'
                              >
                                <Copy className='w-4 h-4' />
                              </button>
                            </div>
                          )
                        )
                      ) : (
                        <p className='text-gray-500 text-center py-8'>
                          No cookies in response
                        </p>
                      )}
                    </div>
                  )}

                  {responseTab === 'headers' && (
                    <div className='space-y-3'>
                      {Object.entries(executionResult.response.headers).map(
                        ([name, value]) => (
                          <div
                            key={name}
                            className='flex items-center justify-between p-3 bg-gray-50 rounded-lg border'
                          >
                            <div>
                              <span className='font-medium text-gray-900'>
                                {name}
                              </span>
                              <p className='text-sm text-gray-600 font-mono'>
                                {value}
                              </p>
                            </div>
                            <button
                              onClick={() => copyToClipboard(value)}
                              className='p-1 text-gray-400 hover:text-gray-600 rounded'
                            >
                              <Copy className='w-4 h-4' />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {responseTab === 'test-results' && (
                    <div className='text-center py-8 text-gray-500'>
                      <TestTube className='w-12 h-12 text-gray-300 mx-auto mb-3' />
                      <p>Test results will appear here after running tests</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {showResponse && !executionResult.response && (
              <div className='p-6'>
                <div className='text-red-600'>
                  <h4 className='font-medium mb-2'>Error</h4>
                  <p className='text-sm'>{executionResult.error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Variable Extraction Section */}
        {executionResult && executionResult.response && (
          <div className='border-t border-gray-200 p-6'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>
              Extract Variables from Response
            </h3>
            <ResponseExplorer
              response={executionResult.response}
              onExtractVariable={handleExtractVariable}
              extractedVariables={extractedVariables}
              existingExtractions={request.extractVariables}
              onRemoveExtraction={handleRemoveExtraction}
              handleCopy={handleCopy}
              copied={copied}
            />
          </div>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div className='space-y-6'>
      {/* Request Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Code className='w-5 h-5' />
            Request Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Request Name</Label>
              <Input
                value={request.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder='Enter request name'
              />
            </div>
            <div className='space-y-2'>
              <Label>Method</Label>
              <Select
                value={request.method}
                onValueChange={(value) => onUpdate({ method: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='GET'>GET</SelectItem>
                  <SelectItem value='POST'>POST</SelectItem>
                  <SelectItem value='PUT'>PUT</SelectItem>
                  <SelectItem value='DELETE'>DELETE</SelectItem>
                  <SelectItem value='PATCH'>PATCH</SelectItem>
                  <SelectItem value='HEAD'>HEAD</SelectItem>
                  <SelectItem value='OPTIONS'>OPTIONS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className='space-y-2'>
            <Label>URL</Label>
            <Input
              value={request.url}
              onChange={(e) => onUpdate({ url: e.target.value })}
              placeholder='https://api.example.com/endpoint'
            />
          </div>
          {/* Final URL Preview */}
          <div className='flex items-center space-x-2 mt-2 text-sm'>
            <span className='text-gray-600 dark:text-gray-400 font-medium'>
              Final URL Preview:
            </span>
            <span className='text-blue-600 dark:text-blue-400 font-mono break-all'>
              {previewUrl}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue='params' className='w-full'>
        <TabsList className='grid w-full grid-cols-7'>
          <TabsTrigger value='params' className='gap-2'>
            <Globe className='w-4 h-4' />
            Params
          </TabsTrigger>
          <TabsTrigger value='headers' className='gap-2'>
            <Code className='w-4 h-4' />
            Headers
          </TabsTrigger>
          <TabsTrigger value='body' className='gap-2'>
            <Code className='w-4 h-4' />
            Body
          </TabsTrigger>
          <TabsTrigger value='auth' className='gap-2'>
            <Key className='w-4 h-4' />
            Auth
          </TabsTrigger>
          <TabsTrigger value='tests' className='gap-2'>
            <TestTube className='w-4 h-4' />
            Tests
          </TabsTrigger>
          <TabsTrigger value='settings' className='gap-2'>
            <Settings className='w-4 h-4' />
            Settings
          </TabsTrigger>
          <TabsTrigger value='conditional' className='gap-2'>
            <GitBranch className='w-4 h-4' />
            Conditional
          </TabsTrigger>
        </TabsList>

        <TabsContent value='params' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Query Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <KeyValueTable
                type='params'
                items={params.map((param) => ({
                  ...param,
                  id: param.id ?? crypto.randomUUID(),
                }))}
                addButtonText='Add Param'
                emptyStateText="No params added. Click 'Add Param' to get started."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='headers' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Headers</CardTitle>
            </CardHeader>
            <CardContent>
              <KeyValueTable
                type='headers'
                items={headers.map((h) => ({
                  ...h,
                  id: h.id ?? crypto.randomUUID(),
                }))}
                addButtonText='Add Header'
                emptyStateText="No headers added. Click 'Add Header' to get started."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='body' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Request Body</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center space-x-4'>
                <Label>Body Type:</Label>
                <Select
                  value={request.bodyType || 'none'}
                  onValueChange={(value) =>
                    onUpdate({ bodyType: value as any })
                  }
                >
                  <SelectTrigger className='w-40'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>None</SelectItem>
                    <SelectItem value='json'>JSON</SelectItem>
                    <SelectItem value='form'>Form Data</SelectItem>
                    <SelectItem value='raw'>Raw</SelectItem>
                    <SelectItem value='binary'>Binary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {request.bodyType !== 'none' && (
                <div className='space-y-2'>
                  <Label>Body Content</Label>
                  <Textarea
                    value={request.body || ''}
                    onChange={(e) => onUpdate({ body: e.target.value })}
                    placeholder={
                      request.bodyType === 'json'
                        ? '{\n  "key": "value",\n  "array": [1, 2, 3]\n}'
                        : 'Enter request body'
                    }
                    rows={10}
                    className='font-mono'
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='auth' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center space-x-4'>
                <Label>Auth Type:</Label>
                <Select
                  value={request.authType || 'none'}
                  onValueChange={(value) =>
                    onUpdate({ authType: value as any })
                  }
                >
                  <SelectTrigger className='w-40'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>No Auth</SelectItem>
                    <SelectItem value='bearer'>Bearer Token</SelectItem>
                    <SelectItem value='basic'>Basic Auth</SelectItem>
                    <SelectItem value='apikey'>API Key</SelectItem>
                    <SelectItem value='oauth1'>OAuth 1.0</SelectItem>
                    <SelectItem value='oauth2'>OAuth 2.0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='tests' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Test Scripts</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>Pre-request Script</Label>
                <Textarea
                  placeholder='// This script will be executed before the request'
                  rows={6}
                  className='font-mono'
                />
              </div>
              <div className='space-y-2'>
                <Label>Test Script</Label>
                <Textarea
                  placeholder='// Write your test assertions here'
                  rows={8}
                  className='font-mono'
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='settings' className='space-y-6'>
          <div>
            <h3 className='text-lg font-semibold mb-4'>Request Settings</h3>
            <div className='grid grid-cols-2 gap-6 mb-6'>
              <div className='space-y-2'>
                <Label htmlFor='timeout'>Timeout (ms)</Label>
                <Input
                  id='timeout'
                  type='number'
                  value={request.timeout}
                  onChange={(e) =>
                    onUpdate({ timeout: Number.parseInt(e.target.value) })
                  }
                  placeholder='5000'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='retries'>Retries</Label>
                <Input
                  id='retries'
                  type='number'
                  value={request.retries}
                  onChange={(e) =>
                    onUpdate({ retries: Number.parseInt(e.target.value) })
                  }
                  placeholder='0'
                />
              </div>
            </div>
            <div className='space-y-4 p-4 border border-orange-200 bg-orange-50 rounded-lg'>
              <div className='flex items-center gap-2 text-orange-600'>
                <TriangleAlert className='w-4 h-4' />
                <Label className='text-orange-700 font-medium'>
                  Error Handling
                </Label>
              </div>
              <RadioGroup
                value={request.errorHandling}
                onValueChange={(value) =>
                  onUpdate({ errorHandling: value as any })
                }
                className='space-y-3'
              >
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='stop' id='stop' />
                  <Label htmlFor='stop' className='text-orange-700'>
                    Stop chain on failure
                  </Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='continue' id='continue' />
                  <Label htmlFor='continue' className='text-orange-700'>
                    Continue to next step
                  </Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='retry' id='retry' />
                  <Label htmlFor='retry' className='text-orange-700'>
                    Retry with backoff
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className='flex items-center space-x-2'>
              <Switch
                checked={request.enabled}
                onCheckedChange={(checked) => onUpdate({ enabled: checked })}
              />
              <Label>Enable this request</Label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value='conditional' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Conditional Logic</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>Run this request only if:</Label>
                <Textarea
                  placeholder='// JavaScript condition that returns true/false// Example: response.status === 200 && response.data.success'
                  rows={4}
                  className='font-mono'
                />
              </div>
              <div className='space-y-2'>
                <Label>Variable Conditions</Label>
                <div className='text-sm text-muted-foreground'>
                  Set conditions based on extracted variables from previous
                  requests
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {onSave && (
        <div className='flex justify-end'>
          <Button onClick={onSave} className='gap-2'>
            <Settings className='w-4 h-4' />
            Save Request
          </Button>
        </div>
      )}
    </div>
  );
}
