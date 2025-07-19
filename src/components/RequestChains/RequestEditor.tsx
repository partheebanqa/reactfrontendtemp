import React, { useState } from 'react';
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
} from 'lucide-react';
import { APIRequest, Variable } from '@/shared/types/requestChain.model';

interface RequestEditorProps {
  request: APIRequest;
  globalVariables: Variable[];
  onUpdate: (updates: Partial<APIRequest>) => void;
  onSave?: () => void;
  compact?: boolean;
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
}: RequestEditorProps) {
  const [activeTab, setActiveTab] = useState('params');
  const [showRequestUrl, setShowRequestUrl] = useState(true);

  // Initialize params, headers if they don't exist
  const params = request.params || [];
  const headers = request.headers || [];

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
          <Button className='gap-2 bg-primary text-primary-foreground hover:bg-primary/90'>
            <Play className='w-4 h-4' />
            Run
          </Button>
        </div>

        {/* Quick tabs for compact view */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='params' className='text-xs'>
              Params ({params.length})
            </TabsTrigger>
            <TabsTrigger value='headers' className='text-xs'>
              Headers ({headers.length})
            </TabsTrigger>
            <TabsTrigger value='body' className='text-xs'>
              Body
            </TabsTrigger>
            <TabsTrigger value='auth' className='text-xs'>
              Auth
            </TabsTrigger>
          </TabsList>

          <TabsContent value='params' className='mt-4'>
            <KeyValueTable
              type='params'
              items={params}
              addButtonText='Add Param'
              emptyStateText="No params added. Click 'Add Param' to get started."
            />
          </TabsContent>

          <TabsContent value='headers' className='mt-4'>
            <KeyValueTable
              type='headers'
              items={headers}
              addButtonText='Add Header'
              emptyStateText="No headers added. Click 'Add Header' to get started."
            />
          </TabsContent>

          <TabsContent value='body' className='mt-4'>
            <div className='space-y-6'>
              <div>
                <h3 className='text-lg font-semibold mb-4'>Request Body</h3>
                <RadioGroup
                  value={request.bodyType || 'none'}
                  onValueChange={(value) =>
                    onUpdate({ bodyType: value as any })
                  }
                  className='flex flex-wrap gap-6'
                >
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='none' id='none' />
                    <Label htmlFor='none'>None</Label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='form' id='form' />
                    <Label htmlFor='form'>Form Data</Label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='raw' id='raw' />
                    <Label htmlFor='raw' className='text-primary'>
                      Raw
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {request.bodyType === 'raw' && (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='w-full'>
                      <div className='flex items-center justify-end mb-2'>
                        <Select defaultValue='text'>
                          <SelectTrigger className='h-8 w-32'>
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
                        placeholder='Enter request body... Use {{variableName}} for variables'
                        rows={12}
                        className='font-mono text-sm'
                      />
                    </div>
                  </div>
                </div>
              )}

              {request.bodyType === 'form' && (
                <div>
                  <KeyValueTable
                    type='params'
                    items={[]}
                    addButtonText='Add Form Field'
                    emptyStateText="No form fields added. Click 'Add Form Field' to get started."
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value='auth' className='mt-4'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
              {/* Left side - Auth Type and Description */}
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='auth-type'>Auth Type</Label>
                  <Select
                    value={request.authType || 'none'}
                    onValueChange={(value) =>
                      onUpdate({ authType: value as any })
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

                {/* Description text */}
                <div className='text-sm text-muted-foreground'>
                  {request.authType === 'bearer' && (
                    <p>
                      The authorization header will be automatically generated
                      when you send the request.{' '}
                      <span className='text-primary underline cursor-pointer'>
                        Learn more about Bearer Token
                      </span>{' '}
                      authorization.
                    </p>
                  )}
                  {request.authType === 'basic' && (
                    <p>
                      The authorization header will be automatically generated
                      when you send the request.{' '}
                      <span className='text-primary underline cursor-pointer'>
                        Learn more about Basic Auth
                      </span>{' '}
                      authorization.
                    </p>
                  )}
                  {request.authType === 'apikey' && (
                    <p>
                      The API key will be added to the request{' '}
                      {request.authConfig?.addTo === 'header'
                        ? 'headers'
                        : 'query parameters'}{' '}
                      automatically.
                    </p>
                  )}
                </div>
              </div>

              {/* Right side - Auth Content */}
              <div className='space-y-4'>
                {request.authType === 'bearer' && (
                  <div className='space-y-2'>
                    <Label htmlFor='token'>Token</Label>
                    <Input
                      id='token'
                      value={request.authConfig?.token || ''}
                      onChange={(e) =>
                        onUpdate({
                          authConfig: {
                            ...request.authConfig,
                            token: e.target.value,
                          },
                        })
                      }
                      placeholder='{{token}}'
                      className='font-mono'
                    />
                  </div>
                )}

                {request.authType === 'basic' && (
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='username'>Username</Label>
                      <Input
                        id='username'
                        value={request.authConfig?.username || ''}
                        onChange={(e) =>
                          onUpdate({
                            authConfig: {
                              ...request.authConfig,
                              username: e.target.value,
                            },
                          })
                        }
                        placeholder='Username'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='password'>Password</Label>
                      <Input
                        id='password'
                        value={request.authConfig?.password || ''}
                        onChange={(e) =>
                          onUpdate({
                            authConfig: {
                              ...request.authConfig,
                              password: e.target.value,
                            },
                          })
                        }
                        placeholder='Password'
                        type='password'
                      />
                    </div>
                  </div>
                )}

                {request.authType === 'apikey' && (
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='api-key'>Key</Label>
                      <Input
                        id='api-key'
                        value={request.authConfig?.key || ''}
                        onChange={(e) =>
                          onUpdate({
                            authConfig: {
                              ...request.authConfig,
                              key: e.target.value,
                            },
                          })
                        }
                        placeholder='API key name'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='api-value'>Value</Label>
                      <Input
                        id='api-value'
                        value={request.authConfig?.value || ''}
                        onChange={(e) =>
                          onUpdate({
                            authConfig: {
                              ...request.authConfig,
                              value: e.target.value,
                            },
                          })
                        }
                        placeholder='API key value'
                        type='password'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='add-to'>Add to</Label>
                      <Select
                        value={request.authConfig?.addTo || 'header'}
                        onValueChange={(value: 'header' | 'query') =>
                          onUpdate({
                            authConfig: { ...request.authConfig, addTo: value },
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
              </div>
            </div>
          </TabsContent>
        </Tabs>
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

              {request.authType === 'bearer' && (
                <div className='space-y-2'>
                  <Label>Token</Label>
                  <Input
                    value={request.authConfig?.token || ''}
                    onChange={(e) =>
                      onUpdate({
                        authConfig: {
                          ...request.authConfig,
                          token: e.target.value,
                        },
                      })
                    }
                    placeholder='Enter bearer token'
                    type='password'
                  />
                </div>
              )}

              {request.authType === 'basic' && (
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Username</Label>
                    <Input
                      value={request.authConfig?.username || ''}
                      onChange={(e) =>
                        onUpdate({
                          authConfig: {
                            ...request.authConfig,
                            username: e.target.value,
                          },
                        })
                      }
                      placeholder='Username'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Password</Label>
                    <Input
                      value={request.authConfig?.password || ''}
                      onChange={(e) =>
                        onUpdate({
                          authConfig: {
                            ...request.authConfig,
                            password: e.target.value,
                          },
                        })
                      }
                      placeholder='Password'
                      type='password'
                    />
                  </div>
                </div>
              )}

              {request.authType === 'apikey' && (
                <div className='space-y-4'>
                  <div className='grid grid-cols-3 gap-4'>
                    <div className='space-y-2'>
                      <Label>Key</Label>
                      <Input
                        value={request.authConfig?.key || ''}
                        onChange={(e) =>
                          onUpdate({
                            authConfig: {
                              ...request.authConfig,
                              key: e.target.value,
                            },
                          })
                        }
                        placeholder='API key name'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Value</Label>
                      <Input
                        value={request.authConfig?.value || ''}
                        onChange={(e) =>
                          onUpdate({
                            authConfig: {
                              ...request.authConfig,
                              value: e.target.value,
                            },
                          })
                        }
                        placeholder='API key value'
                        type='password'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Add to</Label>
                      <Select
                        value={request.authConfig?.addTo || 'header'}
                        onValueChange={(value: 'header' | 'query') =>
                          onUpdate({
                            authConfig: { ...request.authConfig, addTo: value },
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
