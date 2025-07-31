import React, { useState, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
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
  Share,
  Download,
  Search,
  AlertTriangle,
  Shield,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Database,
} from 'lucide-react';
import {
  APIRequest,
  DataExtraction,
  ExecutionLog,
  TestScript,
  Variable,
  KeyValuePair,
} from '@/shared/types/requestChain.model';
import { ResponseExplorer } from './ResponseExplorer';

interface RequestEditorProps {
  request: APIRequest;
  globalVariables: Variable[];
  onUpdate: (updates: Partial<APIRequest>) => void;
  onSave?: () => void;
  compact?: boolean;
  chainName?: string;
  chainDescription?: string;
  chainEnabled?: boolean;
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
  const [responseTab, setResponseTab] = useState<
    'body' | 'cookies' | 'headers' | 'test-results'
  >('body');

  // Initialize params, headers if they don't exist
  const params = request.params || [];
  const headers = request.headers || [];

  const replaceVariables = (text: string, vars: Variable[]): string => {
    let result = text;
    vars.forEach((variable) => {
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      result = result.replace(regex, variable.value);
    });
    return result;
  };

  const parseCookies = (cookieHeader: string): Record<string, string> => {
    const cookies: Record<string, string> = {};
    if (!cookieHeader) return cookies;

    cookieHeader.split(',').forEach((cookie) => {
      const [nameValue] = cookie.trim().split(';');
      if (nameValue) {
        const [name, value] = nameValue.split('=');
        if (name && value) {
          cookies[name.trim()] = value.trim();
        }
      }
    });

    return cookies;
  };

  const getValueByPath = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object') {
        if (key.includes('[') && key.includes(']')) {
          const arrayKey = key.substring(0, key.indexOf('['));
          const index = parseInt(
            key.substring(key.indexOf('[') + 1, key.indexOf(']'))
          );
          return current[arrayKey] && current[arrayKey][index];
        }
        return current[key];
      }
      return undefined;
    }, obj);
  };

  const extractDataFromResponse = (
    response: any,
    extractions: APIRequest['dataExtractions']
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
          value = response.headers[extraction.path.toLowerCase()];
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
    if (!request.url) return;

    setIsExecuting(true);
    try {
      const processedUrl = replaceVariables(request.url, globalVariables);
      const processedHeaders: Record<string, string> = {};

      request.headers.forEach((header) => {
        if (header.enabled) {
          processedHeaders[header.key] = replaceVariables(
            header.value,
            globalVariables
          );
        }
      });

      let processedBody = request.body
        ? replaceVariables(request.body, globalVariables)
        : undefined;

      const url = new URL(processedUrl);
      request.params.forEach((param) => {
        if (param.enabled) {
          url.searchParams.set(
            param.key,
            replaceVariables(param.value, globalVariables)
          );
        }
      });

      if (request.bodyType === 'json' && processedBody) {
        processedHeaders['Content-Type'] = 'application/json';
      } else if (request?.bodyType === 'x-www-form-urlencoded') {
        processedHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
      }

      if (request.authType === 'bearer' && request.authToken) {
        processedHeaders['Authorization'] = `Bearer ${replaceVariables(
          request.authToken,
          globalVariables
        )}`;
      } else if (
        request.authType === 'basic' &&
        request.authUsername &&
        request.authPassword
      ) {
        const credentials = btoa(
          `${request.authUsername}:${request.authPassword}`
        );
        processedHeaders['Authorization'] = `Basic ${credentials}`;
      } else if (
        request.authType === 'apikey' &&
        request.authApiKey &&
        request.authApiValue
      ) {
        if (request.authApiLocation === 'header') {
          processedHeaders[request.authApiKey] = replaceVariables(
            request.authApiValue,
            globalVariables
          );
        } else {
          url.searchParams.set(
            request.authApiKey,
            replaceVariables(request.authApiValue, globalVariables)
          );
        }
      }

      const requestOptions: RequestInit = {
        method: request.method,
        headers: processedHeaders,
        body: processedBody,
      };

      const startTime = Date.now();
      const response = await fetch(url.toString(), requestOptions);
      const endTime = Date.now();
      const responseBody = await response.text();

      const extractedData = extractDataFromResponse(
        {
          body: responseBody,
          headers: Object.fromEntries(response.headers.entries()),
          cookies: parseCookies(response.headers.get('set-cookie') || ''),
        },
        request.dataExtractions
      );

      const log: ExecutionLog = {
        id: Date.now().toString(),
        chainId: 'current-chain',
        requestId: request.id,
        status: response.ok ? 'success' : 'error',
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration: endTime - startTime,
        request: {
          method: request.method,
          url: url.toString(),
          headers: processedHeaders,
          body: processedBody,
        },
        response: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseBody,
          size: responseBody.length,
          cookies: parseCookies(response.headers.get('set-cookie') || ''),
        },
        extractedVariables: extractedData,
      };

      setExecutionResult(log);
      setShowResponse(true);
      setExtractedVariables(extractedData);
    } catch (error) {
      const endTime = Date.now();

      setExecutionResult({
        id: Date.now().toString(),
        chainId: 'current-chain',
        requestId: request.id,
        status: 'error',
        startTime: new Date().toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration: 0,
        request: {
          method: request.method,
          url: request.url,
          headers: {},
          body: request.body,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      setShowResponse(true);
    } finally {
      setIsExecuting(false);
    }
  };

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

  const handleExtractVariable = (extraction: DataExtraction) => {
    const currentExtractions = request.dataExtractions || [];
    const updatedExtractions = [...currentExtractions, extraction];
    onUpdate({ dataExtractions: updatedExtractions });

    if (executionResult?.response) {
      const extracted = extractDataFromResponse(
        executionResult.response,
        updatedExtractions
      );
      setExtractedVariables(extracted);
    }
  };

  const handleRemoveExtraction = (variableName: string) => {
    const updatedExtractions = request.dataExtractions.filter(
      (e) => e.variableName !== variableName
    );
    onUpdate({ dataExtractions: updatedExtractions });

    const newExtracted = { ...extractedVariables };
    delete newExtracted[variableName];
    setExtractedVariables(newExtracted);
  };

  // Variable suggestions for inputs
  const getVariableSuggestions = (inputValue: string) => {
    const cursorPosition = inputValue.indexOf('{{');
    if (cursorPosition === -1) return [];

    const afterCursor = inputValue.slice(cursorPosition + 2);
    const endBrace = afterCursor.indexOf('}}');
    const searchTerm =
      endBrace === -1 ? afterCursor : afterCursor.slice(0, endBrace);

    return globalVariables.filter((v) =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
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
          {type === 'params' ? 'Parameters' : 'Headers'}
        </h3>
        <Button
          variant='outline'
          size='sm'
          onClick={() => addKeyValuePair(type)}
          className='gap-2'
        >
          <Plus className='w-4 h-4' />
          {addButtonText}
        </Button>
      </div>

      {items.length > 0 ? (
        <div className='space-y-2'>
          <div className='hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground border-b pb-2'>
            <div className='col-span-1'></div>
            <div className='col-span-4'>Key</div>
            <div className='col-span-4'>Value</div>
            <div className='col-span-2'>Description</div>
            <div className='col-span-1'></div>
          </div>

          {items.map((item) => (
            <div
              key={item.id}
              className='grid grid-cols-1 md:grid-cols-12 gap-2 items-start md:items-center p-2 border rounded-lg'
            >
              <div className='md:col-span-1 flex justify-center'>
                <Checkbox
                  checked={item.enabled}
                  onCheckedChange={(checked) =>
                    updateKeyValuePair(type, item.id!, { enabled: !!checked })
                  }
                />
              </div>
              <div className='md:col-span-4'>
                <Input
                  value={item.key}
                  onChange={(e) =>
                    updateKeyValuePair(type, item.id!, { key: e.target.value })
                  }
                  placeholder='Key'
                  className='h-8'
                />
              </div>
              <div className='md:col-span-4 space-y-1'>
                <Input
                  value={item.value}
                  onChange={(e) =>
                    updateKeyValuePair(type, item.id!, {
                      value: e.target.value,
                    })
                  }
                  placeholder='Value (use {{variableName}} for variables)'
                  className='h-8'
                />
                {globalVariables.length > 0 && (
                  <div className='flex flex-wrap gap-1'>
                    {globalVariables.map((variable) => (
                      <Badge
                        key={variable.id}
                        variant='secondary'
                        className='text-xs cursor-pointer hover:bg-secondary/80'
                        onClick={() => {
                          const currentValue = item.value;
                          const newValue =
                            currentValue + `{{${variable.name}}}`;
                          updateKeyValuePair(type, item.id!, {
                            value: newValue,
                          });
                        }}
                      >
                        {variable.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className='md:col-span-2'>
                <Input
                  value={item.description || ''}
                  onChange={(e) =>
                    updateKeyValuePair(type, item.id!, {
                      description: e.target.value,
                    })
                  }
                  placeholder='Description'
                  className='h-8'
                />
              </div>
              <div className='md:col-span-1 flex justify-center'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => removeKeyValuePair(type, item.id!)}
                  className='h-8 w-8 p-0 text-destructive hover:text-destructive/90'
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
        <div className='flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2'>
          <Select
            value={request.method}
            onValueChange={(value) => onUpdate({ method: value as any })}
          >
            <SelectTrigger className='w-full sm:w-24'>
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
          <div className='flex-1 space-y-1'>
            <Input
              value={request.url}
              onChange={(e) => onUpdate({ url: e.target.value })}
              placeholder='Enter request URL (use {{variableName}} for variables)'
              className='flex-1'
            />
            {globalVariables.length > 0 && (
              <div className='flex flex-wrap gap-1'>
                {globalVariables.map((variable) => (
                  <Badge
                    key={variable.id}
                    variant='secondary'
                    className='text-xs cursor-pointer hover:bg-secondary/80'
                    onClick={() => {
                      const currentUrl = request.url;
                      const newUrl = currentUrl + `{{${variable.name}}}`;
                      onUpdate({ url: newUrl });
                    }}
                  >
                    {variable.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Button
            onClick={handleExecute}
            disabled={isExecuting}
            className='w-full sm:w-auto gap-2'
          >
            <Play className='w-4 h-4' />
            {isExecuting ? 'Running...' : 'Run'}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as typeof activeTab)}
          className='w-full'
        >
          <TabsList className='grid w-full grid-cols-3 md:grid-cols-6'>
            <TabsTrigger value='params' className='text-xs'>
              Params
            </TabsTrigger>
            <TabsTrigger value='headers' className='text-xs'>
              Headers
            </TabsTrigger>
            <TabsTrigger value='body' className='text-xs'>
              Body
            </TabsTrigger>
            <TabsTrigger value='auth' className='text-xs'>
              Auth
            </TabsTrigger>
            <TabsTrigger value='tests' className='text-xs'>
              Tests
            </TabsTrigger>
            <TabsTrigger value='settings' className='text-xs'>
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value='params' className='space-y-4'>
            <KeyValueTable
              type='params'
              items={params}
              addButtonText='Add Parameter'
              emptyStateText="No parameters added. Click 'Add Parameter' to get started."
            />
          </TabsContent>

          <TabsContent value='headers' className='space-y-4'>
            <KeyValueTable
              type='headers'
              items={headers}
              addButtonText='Add Header'
              emptyStateText="No headers added. Click 'Add Header' to get started."
            />
          </TabsContent>

          <TabsContent value='body' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Request Body</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex flex-wrap items-center gap-4'>
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
                          ? '{\n  "key": "{{variableName}}",\n  "array": [1, 2, 3]\n}'
                          : 'Enter request body (use {{variableName}} for variables)'
                      }
                      rows={8}
                      className='font-mono'
                    />
                    {globalVariables.length > 0 && (
                      <div className='flex flex-wrap gap-1'>
                        {globalVariables.map((variable) => (
                          <Badge
                            key={variable.id}
                            variant='secondary'
                            className='text-xs cursor-pointer hover:bg-secondary/80'
                            onClick={() => {
                              const currentBody = request.body || '';
                              const newBody =
                                currentBody + `{{${variable.name}}}`;
                              onUpdate({ body: newBody });
                            }}
                          >
                            {variable.name}
                          </Badge>
                        ))}
                      </div>
                    )}
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
                <div className='flex flex-wrap items-center gap-4'>
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

                {request.authType === 'bearer' && (
                  <div className='space-y-2'>
                    <Label>Bearer Token</Label>
                    <Input
                      value={request.authToken || ''}
                      onChange={(e) => onUpdate({ authToken: e.target.value })}
                      placeholder='Enter bearer token or use {{tokenVariable}}'
                    />
                    {globalVariables.length > 0 && (
                      <div className='flex flex-wrap gap-1'>
                        {globalVariables.map((variable) => (
                          <Badge
                            key={variable.id}
                            variant='secondary'
                            className='text-xs cursor-pointer hover:bg-secondary/80'
                            onClick={() => {
                              const currentToken = request.authToken || '';
                              const newToken =
                                currentToken + `{{${variable.name}}}`;
                              onUpdate({ authToken: newToken });
                            }}
                          >
                            {variable.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {request.authType === 'basic' && (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label>Username</Label>
                      <Input
                        value={request.authUsername || ''}
                        onChange={(e) =>
                          onUpdate({ authUsername: e.target.value })
                        }
                        placeholder='Username'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Password</Label>
                      <Input
                        type='password'
                        value={request.authPassword || ''}
                        onChange={(e) =>
                          onUpdate({ authPassword: e.target.value })
                        }
                        placeholder='Password'
                      />
                    </div>
                  </div>
                )}

                {request.authType === 'apikey' && (
                  <div className='space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <Label>Key</Label>
                        <Input
                          value={request.authApiKey || ''}
                          onChange={(e) =>
                            onUpdate({ authApiKey: e.target.value })
                          }
                          placeholder='API Key name'
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label>Value</Label>
                        <Input
                          value={request.authApiValue || ''}
                          onChange={(e) =>
                            onUpdate({ authApiValue: e.target.value })
                          }
                          placeholder='API Key value'
                        />
                      </div>
                    </div>
                    <div className='space-y-2'>
                      <Label>Add to</Label>
                      <Select
                        value={request.authApiLocation || 'header'}
                        onValueChange={(value) =>
                          onUpdate({
                            authApiLocation: value as 'header' | 'query',
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='header'>Header</SelectItem>
                          <SelectItem value='query'>Query Params</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='tests' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Test Scripts</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='text-center py-8 text-muted-foreground'>
                  <TestTube className='w-12 h-12 text-muted mx-auto mb-3' />
                  <p>Test scripts functionality coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='settings' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Request Settings</CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Timeout (ms)</Label>
                    <Input
                      type='number'
                      value={request.timeout}
                      onChange={(e) =>
                        onUpdate({ timeout: parseInt(e.target.value) || 5000 })
                      }
                      placeholder='5000'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Retries</Label>
                    <Input
                      type='number'
                      value={request.retries}
                      onChange={(e) =>
                        onUpdate({ retries: parseInt(e.target.value) || 0 })
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
                    onCheckedChange={(checked) =>
                      onUpdate({ enabled: checked })
                    }
                  />
                  <Label>Enable this request</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Response Section */}
        {executionResult && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  {executionResult.status === 'success' ? (
                    <CheckCircle className='w-5 h-5 text-green-500' />
                  ) : (
                    <XCircle className='w-5 h-5 text-red-500' />
                  )}
                  <span>Response</span>
                  {executionResult.response && (
                    <>
                      <Badge
                        variant={
                          executionResult.response.status < 300
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {executionResult.response.status}
                      </Badge>
                      <Badge variant='secondary'>
                        {executionResult.duration}ms
                      </Badge>
                    </>
                  )}
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setShowResponse(!showResponse)}
                >
                  {showResponse ? (
                    <ChevronDown className='w-4 h-4' />
                  ) : (
                    <ChevronRight className='w-4 h-4' />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            {showResponse && (
              <CardContent>
                {executionResult.response ? (
                  <Tabs
                    value={responseTab}
                    onValueChange={(value) =>
                      setResponseTab(value as typeof responseTab)
                    }
                  >
                    <TabsList>
                      <TabsTrigger value='body'>Body</TabsTrigger>
                      <TabsTrigger value='headers'>
                        Headers (
                        {Object.keys(executionResult.response.headers).length})
                      </TabsTrigger>
                      <TabsTrigger value='cookies'>Cookies</TabsTrigger>
                    </TabsList>
                    <TabsContent value='body' className='space-y-4'>
                      <div className='relative'>
                        <pre className='bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto max-h-96'>
                          <code>
                            {formatResponseBody(
                              executionResult.response.body,
                              executionResult.response.headers['content-type']
                            )}
                          </code>
                        </pre>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='absolute top-2 right-2'
                          onClick={() =>
                            copyToClipboard(executionResult.response!.body)
                          }
                        >
                          <Copy className='w-4 h-4' />
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value='headers' className='space-y-2'>
                      {Object.entries(executionResult.response.headers).map(
                        ([name, value]) => (
                          <div
                            key={name}
                            className='flex items-center justify-between p-2 bg-muted rounded'
                          >
                            <div>
                              <span className='font-medium'>{name}</span>
                              <p className='text-sm text-muted-foreground font-mono'>
                                {value}
                              </p>
                            </div>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => copyToClipboard(value)}
                            >
                              <Copy className='w-4 h-4' />
                            </Button>
                          </div>
                        )
                      )}
                    </TabsContent>
                    <TabsContent value='cookies'>
                      {executionResult.response.cookies &&
                      Object.keys(executionResult.response.cookies).length >
                        0 ? (
                        <div className='space-y-2'>
                          {Object.entries(executionResult.response.cookies).map(
                            ([name, value]) => (
                              <div
                                key={name}
                                className='flex items-center justify-between p-2 bg-muted rounded'
                              >
                                <div>
                                  <span className='font-medium'>{name}</span>
                                  <p className='text-sm text-muted-foreground font-mono'>
                                    {value}
                                  </p>
                                </div>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={() => copyToClipboard(value)}
                                >
                                  <Copy className='w-4 h-4' />
                                </Button>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p className='text-muted-foreground text-center py-8'>
                          No cookies in response
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className='text-destructive'>
                    <h4 className='font-medium mb-2'>Error</h4>
                    <p className='text-sm'>{executionResult.error}</p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )}

        {/* Variable Extraction Section */}
        {executionResult && executionResult.response && (
          <Card>
            <CardHeader>
              <CardTitle>Extract Variables from Response</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponseExplorer
                response={executionResult.response}
                onExtractVariable={handleExtractVariable}
                extractedVariables={extractedVariables}
                existingExtractions={request.dataExtractions}
                onRemoveExtraction={handleRemoveExtraction}
              />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

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
              placeholder='https://api.example.com/endpoint (use {{variableName}} for variables)'
            />
            {globalVariables.length > 0 && (
              <div className='flex flex-wrap gap-1'>
                {globalVariables.map((variable) => (
                  <Badge
                    key={variable.id}
                    variant='secondary'
                    className='text-xs cursor-pointer hover:bg-secondary/80'
                    onClick={() => {
                      const currentUrl = request.url;
                      const newUrl = currentUrl + `{{${variable.name}}}`;
                      onUpdate({ url: newUrl });
                    }}
                  >
                    {variable.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue='params' className='w-full'>
        <TabsList className='grid w-full grid-cols-3 md:grid-cols-7'>
          <TabsTrigger value='params' className='gap-2'>
            <Globe className='w-4 h-4' />
            <span className='hidden sm:inline'>Params</span>
          </TabsTrigger>
          <TabsTrigger value='headers' className='gap-2'>
            <Code className='w-4 h-4' />
            <span className='hidden sm:inline'>Headers</span>
          </TabsTrigger>
          <TabsTrigger value='body' className='gap-2'>
            <Code className='w-4 h-4' />
            <span className='hidden sm:inline'>Body</span>
          </TabsTrigger>
          <TabsTrigger value='auth' className='gap-2'>
            <Key className='w-4 h-4' />
            <span className='hidden sm:inline'>Auth</span>
          </TabsTrigger>
          <TabsTrigger value='tests' className='gap-2'>
            <TestTube className='w-4 h-4' />
            <span className='hidden sm:inline'>Tests</span>
          </TabsTrigger>
          <TabsTrigger value='settings' className='gap-2'>
            <Settings className='w-4 h-4' />
            <span className='hidden sm:inline'>Settings</span>
          </TabsTrigger>
          <TabsTrigger value='conditional' className='gap-2'>
            <GitBranch className='w-4 h-4' />
            <span className='hidden sm:inline'>Conditional</span>
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
                items={params}
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
                items={headers}
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
                        ? '{\n  "key": "{{variableName}}",\n  "array": [1, 2, 3]\n}'
                        : 'Enter request body (use {{variableName}} for variables)'
                    }
                    rows={10}
                    className='font-mono'
                  />
                  {globalVariables.length > 0 && (
                    <div className='flex flex-wrap gap-1'>
                      {globalVariables.map((variable) => (
                        <Badge
                          key={variable.id}
                          variant='secondary'
                          className='text-xs cursor-pointer hover:bg-secondary/80'
                          onClick={() => {
                            const currentBody = request.body || '';
                            const newBody =
                              currentBody + `{{${variable.name}}}`;
                            onUpdate({ body: newBody });
                          }}
                        >
                          {variable.name}
                        </Badge>
                      ))}
                    </div>
                  )}
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
          <Card>
            <CardHeader>
              <CardTitle>Request Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                <div className='space-y-2'>
                  <Label htmlFor='timeout'>Timeout (ms)</Label>
                  <Input
                    id='timeout'
                    type='number'
                    value={request.timeout}
                    onChange={(e) =>
                      onUpdate({ timeout: parseInt(e.target.value) })
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
                      onUpdate({ retries: parseInt(e.target.value) })
                    }
                    placeholder='0'
                  />
                </div>
              </div>

              <div className='space-y-4 p-4 border border-orange-200 bg-orange-50 rounded-lg mb-6'>
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
            </CardContent>
          </Card>
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
                  placeholder='// JavaScript condition that returns true/false
// Example: response.status === 200 && response.data.success'
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
