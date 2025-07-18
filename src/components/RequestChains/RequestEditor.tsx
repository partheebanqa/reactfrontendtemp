import React, { useState } from 'react';
import {
  Play,
  Save,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Code,
  Key,
  Settings,
  FileText,
  TestTube,
  Shield,
  Download,
  Share,
  Search,
} from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  APIRequest,
  Variable,
  DataExtraction,
  TestScript,
} from '@/shared/types/requestChain.model';

interface RequestEditorProps {
  request: APIRequest;
  globalVariables?: Variable[];
  onUpdate: (updates: Partial<APIRequest>) => void;
  onSave?: () => void;
  compact?: boolean;
}

export function RequestEditor({
  request,
  globalVariables = [],
  onUpdate,
  onSave,
  compact = false,
}: RequestEditorProps) {
  const [activeTab, setActiveTab] = useState<
    'params' | 'headers' | 'body' | 'auth' | 'tests' | 'settings'
  >('params');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [showResponse, setShowResponse] = useState(false);

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
    const newTest: TestScript = {
      id: Date.now().toString(),
      type,
      enabled: true,
      operator: 'equal',
      expectedValue:
        type === 'status'
          ? '200'
          : type === 'responseTime'
          ? '200'
          : 'expected value',
      description: `${type} test`,
    };

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

  const getMethodColor = (method: string) => {
    const colors = {
      GET: 'bg-green-100 text-green-800',
      POST: 'bg-blue-100 text-blue-800',
      PUT: 'bg-orange-100 text-orange-800',
      DELETE: 'bg-red-100 text-red-800',
      PATCH: 'bg-purple-100 text-purple-800',
      HEAD: 'bg-gray-100 text-gray-800',
      OPTIONS: 'bg-yellow-100 text-yellow-800',
    };
    return colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleExecute = async () => {
    if (!request.url) return;

    setIsExecuting(true);
    // Mock execution - in real app this would make actual HTTP request
    setTimeout(() => {
      setExecutionResult({
        status: 'success',
        response: {
          status: 200,
          body: '{"message": "Success", "data": {"id": 123, "name": "Test"}}',
          headers: { 'content-type': 'application/json' },
        },
      });
      setShowResponse(true);
      setIsExecuting(false);
    }, 1000);
  };

  const tabs = [
    { id: 'params', label: 'Params', icon: FileText },
    { id: 'headers', label: 'Headers', icon: Code },
    { id: 'body', label: 'Body', icon: FileText },
    { id: 'auth', label: 'Auth', icon: Shield },
    { id: 'tests', label: 'Tests', icon: TestTube },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <Card className='w-full'>
      {!compact && (
        <CardHeader>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='requestName'>Request Name</Label>
              <Input
                id='requestName'
                value={request.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder='New Request'
              />
            </div>

            <div className='flex items-center space-x-3'>
              <Select
                value={request.method}
                onValueChange={(value: APIRequest['method']) =>
                  onUpdate({ method: value })
                }
              >
                <SelectTrigger className='w-32'>
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
                placeholder='Enter URL or paste text'
                className='flex-1'
              />

              <Button
                onClick={handleExecute}
                disabled={isExecuting || !request.url}
                className='gap-2'
              >
                {isExecuting ? (
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                ) : (
                  <Play className='w-4 h-4' />
                )}
                Run
              </Button>

              {onSave && (
                <Button variant='outline' onClick={onSave} className='gap-2'>
                  <Save className='w-4 h-4' />
                  Save
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}

      {compact && (
        <CardHeader className='pb-4'>
          <div className='flex items-center space-x-3'>
            <Select
              value={request.method}
              onValueChange={(value: APIRequest['method']) =>
                onUpdate({ method: value })
              }
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
              placeholder='Enter URL'
              className='flex-1'
            />

            <Button
              onClick={handleExecute}
              disabled={isExecuting || !request.url}
              size='sm'
              className='gap-2'
            >
              {isExecuting ? (
                <div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin' />
              ) : (
                <Play className='w-3 h-3' />
              )}
              Run
            </Button>
          </div>
        </CardHeader>
      )}

      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as typeof activeTab)}
        >
          <TabsList className='grid w-full grid-cols-6'>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className='gap-2'>
                  <Icon className='w-4 h-4' />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value='params' className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-medium'>Query Parameters</h3>
              <Button
                onClick={addParam}
                variant='outline'
                size='sm'
                className='gap-2'
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
                      className='flex-1'
                    />
                    <Input
                      value={param.value}
                      onChange={(e) =>
                        updateParam(index, { value: e.target.value })
                      }
                      placeholder='Value (use {{variableName}} for variables)'
                      className='flex-1'
                    />
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() =>
                        updateParam(index, { enabled: !param.enabled })
                      }
                      className={
                        param.enabled
                          ? 'text-green-600'
                          : 'text-muted-foreground'
                      }
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
                      className='text-red-600'
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-8 text-muted-foreground'>
                <FileText className='w-12 h-12 mx-auto mb-3 text-muted-foreground/50' />
                <p>
                  No parameters added. Click "Add Parameter" to get started.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value='headers' className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-medium'>Headers</h3>
              <Button
                onClick={addHeader}
                variant='outline'
                size='sm'
                className='gap-2'
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
                      className='flex-1'
                    />
                    <Input
                      value={header.value}
                      onChange={(e) =>
                        updateHeader(index, { value: e.target.value })
                      }
                      placeholder='Header value (use {{variableName}} for variables)'
                      className='flex-1'
                    />
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() =>
                        updateHeader(index, { enabled: !header.enabled })
                      }
                      className={
                        header.enabled
                          ? 'text-green-600'
                          : 'text-muted-foreground'
                      }
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
                      className='text-red-600'
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-8 text-muted-foreground'>
                <Code className='w-12 h-12 mx-auto mb-3 text-muted-foreground/50' />
                <p>No headers added. Click "Add Header" to get started.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value='body' className='space-y-4'>
            <h3 className='text-lg font-medium'>Request Body</h3>

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
                  value='json'
                  checked={request.bodyType === 'json'}
                  onChange={(e) =>
                    onUpdate({
                      bodyType: e.target.value as APIRequest['bodyType'],
                    })
                  }
                  className='text-blue-600'
                />
                <span className='text-sm'>JSON</span>
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

            {(request.bodyType === 'raw' || request.bodyType === 'json') && (
              <Textarea
                value={request.body || ''}
                onChange={(e) => onUpdate({ body: e.target.value })}
                rows={8}
                placeholder='Enter request body... Use {{variableName}} for variables'
                className='font-mono'
              />
            )}
          </TabsContent>

          <TabsContent value='auth' className='space-y-4'>
            <h3 className='text-lg font-medium'>Authentication</h3>

            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label>Auth Type</Label>
                <Select
                  value={request.authType || 'none'}
                  onValueChange={(value: APIRequest['authType']) =>
                    onUpdate({ authType: value })
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
                </div>
              )}

              {request.authType === 'basic' && (
                <div className='grid grid-cols-2 gap-4'>
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
                  <div className='grid grid-cols-2 gap-4'>
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
                      onValueChange={(value: 'header' | 'query') =>
                        onUpdate({ authApiLocation: value })
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
            </div>
          </TabsContent>

          <TabsContent value='tests' className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-medium'>Test Scripts</h3>
              <div className='flex space-x-2'>
                <Button
                  onClick={() => addTest('responseTime')}
                  variant='outline'
                  size='sm'
                  className='gap-2'
                >
                  <Clock className='w-4 h-4' />
                  Response Time
                </Button>
                <Button
                  onClick={() => addTest('status')}
                  variant='outline'
                  size='sm'
                  className='gap-2'
                >
                  <CheckCircle className='w-4 h-4' />
                  Status Code
                </Button>
                <Button
                  onClick={() => addTest('jsonContent')}
                  variant='outline'
                  size='sm'
                  className='gap-2'
                >
                  <Code className='w-4 h-4' />
                  JSON Content
                </Button>
              </div>
            </div>

            {request.testScripts && request.testScripts.length > 0 ? (
              <div className='space-y-3'>
                {request.testScripts.map((test) => (
                  <Card key={test.id}>
                    <CardContent className='p-4'>
                      <div className='flex items-center justify-between mb-3'>
                        <h4 className='font-medium'>
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
                            className={
                              test.enabled
                                ? 'text-green-600'
                                : 'text-muted-foreground'
                            }
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
                            className='text-red-600'
                          >
                            <Trash2 className='w-4 h-4' />
                          </Button>
                        </div>
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                        <div className='space-y-2'>
                          <Label>Operator</Label>
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
                              <SelectItem value='contain'>contain</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className='space-y-2'>
                          <Label>Expected Value</Label>
                          <Input
                            value={test.expectedValue}
                            onChange={(e) =>
                              updateTest(test.id, {
                                expectedValue: e.target.value,
                              })
                            }
                            placeholder='Expected value'
                          />
                        </div>

                        {test.type === 'jsonContent' && (
                          <div className='space-y-2'>
                            <Label>JSON Path</Label>
                            <Input
                              value={test.jsonPath || ''}
                              onChange={(e) =>
                                updateTest(test.id, {
                                  jsonPath: e.target.value,
                                })
                              }
                              placeholder='$.property'
                              className='font-mono'
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className='text-center py-8 text-muted-foreground'>
                <TestTube className='w-12 h-12 mx-auto mb-3 text-muted-foreground/50' />
                <p className='mb-4'>
                  No tests added. Click one of the buttons above to add a test.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value='settings' className='space-y-6'>
            <h3 className='text-lg font-medium'>Request Settings</h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label>Timeout (ms)</Label>
                <Input
                  type='number'
                  value={request.timeout}
                  onChange={(e) =>
                    onUpdate({ timeout: parseInt(e.target.value) || 5000 })
                  }
                  min='1000'
                  max='60000'
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
                  min='0'
                  max='5'
                />
              </div>
            </div>

            <Card className='border-orange-200 bg-orange-50'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-orange-900'>
                  <AlertTriangle className='w-5 h-5' />
                  Error Handling
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Mock Response Section */}
        {executionResult && (
          <div className='mt-6 border-t pt-6'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center space-x-2'>
                {executionResult.status === 'success' ? (
                  <CheckCircle className='w-5 h-5 text-green-500' />
                ) : (
                  <XCircle className='w-5 h-5 text-red-500' />
                )}
                <span className='font-medium'>Response</span>
                <Badge className='bg-green-100 text-green-800'>200 OK</Badge>
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setShowResponse(!showResponse)}
                className='gap-2'
              >
                {showResponse ? (
                  <ChevronDown className='w-4 h-4' />
                ) : (
                  <ChevronRight className='w-4 h-4' />
                )}
                {showResponse ? 'Hide' : 'Show'}
              </Button>
            </div>

            {showResponse && (
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label>Response Body</Label>
                  <pre className='bg-muted p-4 rounded-lg text-sm overflow-x-auto'>
                    <code>
                      {JSON.stringify(
                        JSON.parse(executionResult.response.body),
                        null,
                        2
                      )}
                    </code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
