import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Play,
  FileText,
  Code,
  Shield,
  TestTube,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronDown,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  APIRequest,
  Variable,
  ExecutionLog,
  KeyValue,
  TestScript,
} from '@/types/request';

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
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<
    'params' | 'headers' | 'body' | 'auth' | 'tests' | 'settings'
  >('params');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionLog | null>(
    null
  );
  const [showResponse, setShowResponse] = useState(false);
  const [responseTab, setResponseTab] = useState<
    'body' | 'cookies' | 'headers' | 'test-results'
  >('body');
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const tabs = [
    { id: 'params', label: 'Params', icon: FileText },
    { id: 'headers', label: 'Headers', icon: Code },
    { id: 'body', label: 'Body', icon: FileText },
    { id: 'auth', label: 'Auth', icon: Shield },
    { id: 'tests', label: 'Tests', icon: TestTube },
    { id: 'settings', label: 'Settings', icon: AlertTriangle },
  ];

  const replaceVariables = (text: string, vars: Variable[]): string => {
    let result = text;
    vars.forEach((variable) => {
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      result = result.replace(regex, variable.value);
    });
    return result;
  };

  const previewUrl = replaceVariables(request.url, globalVariables);

  const addParam = () => {
    const newParam: KeyValue = { key: '', value: '', enabled: true };
    onUpdate({ params: [...request.params, newParam] });
  };

  const updateParam = (index: number, updates: Partial<KeyValue>) => {
    const newParams = [...request.params];
    newParams[index] = { ...newParams[index], ...updates };
    onUpdate({ params: newParams });
  };

  const removeParam = (index: number) => {
    const newParams = request.params.filter((_, i) => i !== index);
    onUpdate({ params: newParams });
  };

  const addHeader = () => {
    const newHeader: KeyValue = { key: '', value: '', enabled: true };
    onUpdate({ headers: [...request.headers, newHeader] });
  };

  const updateHeader = (index: number, updates: Partial<KeyValue>) => {
    const newHeaders = [...request.headers];
    newHeaders[index] = { ...newHeaders[index], ...updates };
    onUpdate({ headers: newHeaders });
  };

  const removeHeader = (index: number) => {
    const newHeaders = request.headers.filter((_, i) => i !== index);
    onUpdate({ headers: newHeaders });
  };

  const addTest = (type: TestScript['type']) => {
    const newTest: TestScript = {
      id: Date.now().toString(),
      type,
      operator:
        type === 'status'
          ? 'equal'
          : type === 'responseTime'
          ? 'lessThan'
          : 'contain',
      expectedValue:
        type === 'status' ? '200' : type === 'responseTime' ? '500' : '',
      enabled: true,
    };
    onUpdate({ testScripts: [...(request.testScripts || []), newTest] });
  };

  const updateTest = (id: string, updates: Partial<TestScript>) => {
    const newTests = (request.testScripts || []).map((test) =>
      test.id === id ? { ...test, ...updates } : test
    );
    onUpdate({ testScripts: newTests });
  };

  const removeTest = (id: string) => {
    const newTests = (request.testScripts || []).filter(
      (test) => test.id !== id
    );
    onUpdate({ testScripts: newTests });
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
      // Simulate API call
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 2000)
      );

      const mockResponse: ExecutionLog = {
        id: Date.now().toString(),
        chainId: 'single-request',
        requestId: request.id,
        status: Math.random() > 0.2 ? 'success' : 'error',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: Math.random() * 1000 + 200,
        request: {
          method: request.method,
          url: previewUrl,
          headers: Object.fromEntries(
            request.headers.map((h) => [h.key, h.value])
          ),
          body: request.body,
        },
        response: {
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(
            {
              success: true,
              data: { id: 123, name: 'Test Response' },
              timestamp: Date.now(),
            },
            null,
            2
          ),
          size: 1024,
          cookies: {},
        },
      };

      setExecutionResult(mockResponse);
      setShowResponse(true);

      toast({
        title: 'Request Complete',
        description: `Request executed successfully with status ${mockResponse.response?.status}`,
      });
    } catch (error) {
      toast({
        title: 'Request Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const formatResponseBody = (body: string, contentType?: string) => {
    try {
      if (contentType?.includes('application/json')) {
        const parsed = JSON.parse(body);
        return JSON.stringify(parsed, null, 2);
      }
      return body;
    } catch {
      return body;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied!',
        description: 'Content copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  };

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
            className='flex-1 transition-fast'
          />
          <Button
            onClick={handleExecute}
            disabled={isExecuting}
            className='gap-2 gradient-primary transition-smooth'
          >
            {isExecuting ? (
              <Play className='w-4 h-4 animate-spin' />
            ) : (
              <Play className='w-4 h-4' />
            )}
            Run
          </Button>
        </div>

        {/* Final URL Preview */}
        <div className='flex items-center space-x-2 mt-2 text-sm p-3 bg-muted/50 rounded-lg'>
          <span className='text-muted-foreground font-medium'>Preview:</span>
          <span className='text-primary font-mono break-all'>{previewUrl}</span>
        </div>

        {/* Quick tabs for compact mode */}
        <div className='border-b border-border'>
          <nav className='flex space-x-4 px-0'>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-fast flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  <Icon className='w-4 h-4' />
                  <span>{tab.label}</span>
                  {tab.id === 'tests' &&
                    request.testScripts &&
                    request.testScripts.length > 0 && (
                      <Badge variant='secondary' className='ml-1 text-xs'>
                        {request.testScripts.length}
                      </Badge>
                    )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className='space-y-4'>
          {activeTab === 'params' && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-base font-medium text-foreground'>
                  Query Parameters
                </h3>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={addParam}
                  className='gap-2 transition-fast'
                >
                  <Plus className='w-4 h-4' />
                  Add Parameter
                </Button>
              </div>

              {request.params.length > 0 ? (
                <div className='space-y-2'>
                  {request.params.map((param, index) => (
                    <div key={index} className='flex items-center space-x-2'>
                      <Input
                        value={param.key}
                        onChange={(e) =>
                          updateParam(index, { key: e.target.value })
                        }
                        placeholder='Key'
                        className='transition-fast'
                      />
                      <Input
                        value={param.value}
                        onChange={(e) =>
                          updateParam(index, { value: e.target.value })
                        }
                        placeholder='Value (use {{variableName}} for variables)'
                        className='transition-fast'
                      />
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          updateParam(index, { enabled: !param.enabled })
                        }
                        className={`transition-fast ${
                          param.enabled
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {param.enabled ? (
                          <Eye className='w-4 h-4' />
                        ) : (
                          <EyeOff className='w-4 h-4' />
                        )}
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => removeParam(index)}
                        className='text-red-600 hover:bg-red-50 transition-fast'
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-6 text-muted-foreground'>
                  <FileText className='w-8 h-8 mx-auto mb-2 opacity-50' />
                  <p className='text-sm'>
                    No parameters added. Click "Add Parameter" to get started.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'headers' && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-base font-medium text-foreground'>
                  Headers
                </h3>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={addHeader}
                  className='gap-2 transition-fast'
                >
                  <Plus className='w-4 h-4' />
                  Add Header
                </Button>
              </div>

              {request.headers.length > 0 ? (
                <div className='space-y-2'>
                  {request.headers.map((header, index) => (
                    <div key={index} className='flex items-center space-x-2'>
                      <Input
                        value={header.key}
                        onChange={(e) =>
                          updateHeader(index, { key: e.target.value })
                        }
                        placeholder='Header name'
                        className='transition-fast'
                      />
                      <Input
                        value={header.value}
                        onChange={(e) =>
                          updateHeader(index, { value: e.target.value })
                        }
                        placeholder='Header value (use {{variableName}} for variables)'
                        className='transition-fast'
                      />
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          updateHeader(index, { enabled: !header.enabled })
                        }
                        className={`transition-fast ${
                          header.enabled
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {header.enabled ? (
                          <Eye className='w-4 h-4' />
                        ) : (
                          <EyeOff className='w-4 h-4' />
                        )}
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => removeHeader(index)}
                        className='text-red-600 hover:bg-red-50 transition-fast'
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-6 text-muted-foreground'>
                  <Code className='w-8 h-8 mx-auto mb-2 opacity-50' />
                  <p className='text-sm'>
                    No headers added. Click "Add Header" to get started.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'body' && (
            <div className='space-y-4'>
              <h3 className='text-base font-medium text-foreground'>
                Request Body
              </h3>

              <div className='flex flex-wrap gap-4'>
                {['none', 'form-data', 'x-www-form-urlencoded', 'raw'].map(
                  (type) => (
                    <label
                      key={type}
                      className='flex items-center space-x-2 cursor-pointer'
                    >
                      <input
                        type='radio'
                        name='bodyType'
                        value={type}
                        checked={request.bodyType === type}
                        onChange={(e) =>
                          onUpdate({
                            bodyType: e.target.value as APIRequest['bodyType'],
                          })
                        }
                        className='text-primary'
                      />
                      <span className='text-sm capitalize'>
                        {type.replace('-', ' ')}
                      </span>
                    </label>
                  )
                )}
              </div>

              {request.bodyType === 'raw' && (
                <div className='space-y-2'>
                  <div className='flex items-center justify-end'>
                    <Select
                      value={request.rawBodyType || 'text'}
                      onValueChange={(value) =>
                        onUpdate({
                          rawBodyType: value as
                            | 'text'
                            | 'json'
                            | 'xml'
                            | 'html',
                        })
                      }
                    >
                      <SelectTrigger className='w-32'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='text'>Text</SelectItem>
                        <SelectItem value='json'>JSON</SelectItem>
                        <SelectItem value='xml'>XML</SelectItem>
                        <SelectItem value='html'>HTML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    value={request.body || ''}
                    onChange={(e) => onUpdate({ body: e.target.value })}
                    rows={6}
                    className='font-mono text-sm transition-fast'
                    placeholder='Enter request body... Use {{variableName}} for variables'
                  />
                </div>
              )}

              {request.bodyType !== 'none' && request.bodyType !== 'raw' && (
                <div className='text-center py-6 text-muted-foreground'>
                  <FileText className='w-8 h-8 mx-auto mb-2 opacity-50' />
                  <p className='text-sm'>Form data editor coming soon...</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'auth' && (
            <div className='space-y-4'>
              <h3 className='text-base font-medium text-foreground'>
                Authentication
              </h3>

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-foreground mb-2'>
                    Auth Type
                  </label>
                  <Select
                    value={request.authType || 'none'}
                    onValueChange={(value) =>
                      onUpdate({
                        authType: value as APIRequest['authType'],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>No Auth</SelectItem>
                      <SelectItem value='bearer'>Bearer Token</SelectItem>
                      <SelectItem value='basic'>Basic Auth</SelectItem>
                      <SelectItem value='apikey'>API Key</SelectItem>
                      <SelectItem value='oauth2'>OAuth 2.0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {request.authType === 'bearer' && (
                  <div>
                    <label className='block text-sm font-medium text-foreground mb-2'>
                      Bearer Token
                    </label>
                    <Input
                      value={request.authToken || ''}
                      onChange={(e) => onUpdate({ authToken: e.target.value })}
                      placeholder='Enter bearer token or use {{tokenVariable}}'
                      className='transition-fast'
                    />
                  </div>
                )}

                {request.authType === 'basic' && (
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-foreground mb-2'>
                        Username
                      </label>
                      <Input
                        value={request.authUsername || ''}
                        onChange={(e) =>
                          onUpdate({ authUsername: e.target.value })
                        }
                        placeholder='Username'
                        className='transition-fast'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-foreground mb-2'>
                        Password
                      </label>
                      <Input
                        type='password'
                        value={request.authPassword || ''}
                        onChange={(e) =>
                          onUpdate({ authPassword: e.target.value })
                        }
                        placeholder='Password'
                        className='transition-fast'
                      />
                    </div>
                  </div>
                )}

                {request.authType === 'oauth2' && (
                  <div className='text-center py-6 text-muted-foreground'>
                    <Shield className='w-8 h-8 mx-auto mb-2 opacity-50' />
                    <p className='text-sm'>
                      OAuth 2.0 configuration coming soon...
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tests' && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-base font-medium text-foreground'>
                  Test Scripts
                </h3>
                <div className='flex space-x-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => addTest('responseTime')}
                    className='gap-2 transition-fast'
                  >
                    <Clock className='w-4 h-4' />
                    Response Time
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => addTest('status')}
                    className='gap-2 transition-fast'
                  >
                    <CheckCircle className='w-4 h-4' />
                    Status Code
                  </Button>
                </div>
              </div>

              {request.testScripts && request.testScripts.length > 0 ? (
                <div className='space-y-3'>
                  {request.testScripts.map((test) => (
                    <div
                      key={test.id}
                      className='border rounded-lg p-3 transition-smooth hover:shadow-sm'
                    >
                      <div className='flex items-center justify-between mb-2'>
                        <h4 className='font-medium text-foreground text-sm'>
                          {test.type === 'status' && 'Status Code Test'}
                          {test.type === 'responseTime' && 'Response Time Test'}
                          {test.type === 'jsonContent' && 'JSON Content Test'}
                        </h4>
                        <div className='flex items-center space-x-2'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() =>
                              updateTest(test.id, { enabled: !test.enabled })
                            }
                            className={`transition-fast ${
                              test.enabled
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            {test.enabled ? (
                              <Eye className='w-4 h-4' />
                            ) : (
                              <EyeOff className='w-4 h-4' />
                            )}
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => removeTest(test.id)}
                            className='text-red-600 hover:bg-red-50 transition-fast'
                          >
                            <Trash2 className='w-4 h-4' />
                          </Button>
                        </div>
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-3 gap-2 text-sm'>
                        {test.type === 'status' && (
                          <>
                            <span className='text-muted-foreground self-center'>
                              Status code should be
                            </span>
                            <Select
                              value={test.operator}
                              onValueChange={(value) =>
                                updateTest(test.id, { operator: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='equal'>equal</SelectItem>
                                <SelectItem value='notEqual'>
                                  not equal
                                </SelectItem>
                                <SelectItem value='greaterThan'>
                                  greater than
                                </SelectItem>
                                <SelectItem value='lessThan'>
                                  less than
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              value={test.expectedValue}
                              onChange={(e) =>
                                updateTest(test.id, {
                                  expectedValue: e.target.value,
                                })
                              }
                              placeholder='200'
                              className='transition-fast'
                            />
                          </>
                        )}

                        {test.type === 'responseTime' && (
                          <>
                            <span className='text-muted-foreground self-center'>
                              Response time should be
                            </span>
                            <Select
                              value={test.operator}
                              onValueChange={(value) =>
                                updateTest(test.id, { operator: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='lessThan'>
                                  less than
                                </SelectItem>
                                <SelectItem value='greaterThan'>
                                  greater than
                                </SelectItem>
                                <SelectItem value='equal'>equal to</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className='flex items-center space-x-1'>
                              <Input
                                type='number'
                                value={test.expectedValue}
                                onChange={(e) =>
                                  updateTest(test.id, {
                                    expectedValue: e.target.value,
                                  })
                                }
                                placeholder='500'
                                className='transition-fast'
                              />
                              <span className='text-muted-foreground text-xs'>
                                ms
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-6 text-muted-foreground'>
                  <TestTube className='w-8 h-8 mx-auto mb-2 opacity-50' />
                  <p className='text-sm mb-4'>
                    No tests added. Click one of the buttons above to add a
                    test.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className='space-y-4'>
              <h3 className='text-base font-medium text-foreground'>
                Request Settings
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-foreground mb-2'>
                    Timeout (ms)
                  </label>
                  <Input
                    type='number'
                    value={request.timeout}
                    onChange={(e) =>
                      onUpdate({ timeout: parseInt(e.target.value) || 5000 })
                    }
                    min='1000'
                    max='60000'
                    className='transition-fast'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-foreground mb-2'>
                    Retries
                  </label>
                  <Input
                    type='number'
                    value={request.retries}
                    onChange={(e) =>
                      onUpdate({ retries: parseInt(e.target.value) || 0 })
                    }
                    min='0'
                    max='5'
                    className='transition-fast'
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
                  {[
                    { value: 'stop', label: 'Stop chain on failure' },
                    { value: 'continue', label: 'Continue to next step' },
                    { value: 'retry', label: 'Retry with backoff' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className='flex items-center space-x-2 cursor-pointer'
                    >
                      <input
                        type='radio'
                        name='errorHandling'
                        value={option.value}
                        checked={request.errorHandling === option.value}
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
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Response Section */}
        {executionResult && (
          <div className='border-t pt-6 mt-6'>
            {/* Response Header */}
            <div className='flex items-center justify-between p-4 bg-muted/30 border border-border rounded-lg mb-4'>
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
                      Error
                    </span>
                  </div>
                )}

                {executionResult.response && (
                  <>
                    <Badge
                      className={`status-${
                        executionResult.response.status < 300
                          ? 'success'
                          : 'error'
                      }`}
                    >
                      {executionResult.response.status}
                    </Badge>
                    <span className='text-sm text-muted-foreground'>
                      {Math.round(executionResult.duration)}ms
                    </span>
                    <span className='text-sm text-muted-foreground'>
                      {(executionResult.response.size / 1024).toFixed(2)} KB
                    </span>
                  </>
                )}
              </div>

              <Button
                variant='ghost'
                size='sm'
                onClick={() => setShowResponse(!showResponse)}
                className='gap-1 transition-fast'
              >
                {showResponse ? (
                  <ChevronDown className='w-4 h-4' />
                ) : (
                  <ChevronRight className='w-4 h-4' />
                )}
                {showResponse ? 'Hide' : 'Show'}
              </Button>
            </div>

            {showResponse && executionResult.response && (
              <div className='space-y-4'>
                <div className='space-y-4'>
                  <div
                    className='flex items-center justify-between cursor-pointer p-3 bg-muted/20 rounded-lg'
                    onClick={() => setIsJsonOpen(!isJsonOpen)}
                  >
                    <div className='flex items-center space-x-2'>
                      {isJsonOpen ? (
                        <ChevronDown className='w-4 h-4 text-muted-foreground' />
                      ) : (
                        <ChevronRight className='w-4 h-4 text-muted-foreground' />
                      )}
                      <span className='text-sm font-medium text-foreground'>
                        Response Body
                      </span>
                    </div>

                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(executionResult.response!.body);
                      }}
                      className='gap-1 transition-fast'
                    >
                      <Copy className='w-3 h-3' />
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>

                  {isJsonOpen && (
                    <div className='relative'>
                      <pre className='bg-muted/30 border rounded-lg p-4 text-sm font-mono overflow-x-auto max-h-80 leading-relaxed'>
                        <code className='text-foreground'>
                          {formatResponseBody(
                            executionResult.response.body,
                            executionResult.response.headers['content-type']
                          )}
                        </code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showResponse && !executionResult.response && (
              <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
                <div className='text-red-600'>
                  <h4 className='font-medium mb-2'>Error</h4>
                  <p className='text-sm'>{executionResult.error}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full editor mode (non-compact)
  return (
    <div className='space-y-6'>
      <div className='text-center py-8 text-muted-foreground'>
        <Code className='w-12 h-12 mx-auto mb-3 opacity-50' />
        <p>Full request editor coming soon...</p>
      </div>
    </div>
  );
}
