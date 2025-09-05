import React, { useState } from 'react';

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
import { Send, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import {
  Request,
  RequestHeader,
  RequestParam,
} from '@/shared/types/TestSuite.model';

// ✅ JSON viewer
import JsonView from 'react18-json-view';
import 'react18-json-view/src/style.css';
import { executeRequest } from '@/services/executeRequest.service';
import { ExecuteRequestPayload } from '@/shared/types/requestChain.model';
import { useWorkspace } from '@/hooks/useWorkspace';

interface RequestTestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: Request;
}

export const RequestTestDialog: React.FC<RequestTestDialogProps> = ({
  isOpen,
  onClose,
  request,
}) => {
  const { currentWorkspace } = useWorkspace();
  const [url, setUrl] = useState(request.url);
  const [showToken, setShowToken] = useState(false);
  const [method, setMethod] = useState(request.method);
  const [headers, setHeaders] = useState<RequestHeader[]>(
    request.headers.length > 0
      ? request.headers
      : [{ key: '', value: '', enabled: true }]
  );
  const [params, setParams] = useState<RequestParam[]>(
    request.params.length > 0
      ? request.params
      : [{ key: '', value: '', enabled: true }]
  );
  const [body, setBody] = useState(request.bodyRawContent);
  const [bodyType, setBodyType] = useState(request.bodyType);
  const [authType, setAuthType] = useState(request.authorizationType);
  const [authToken, setAuthToken] = useState(
    request.authorization?.token || ''
  );

  // response state can hold either string or object
  const [response, setResponse] = useState<any>(null);
  const [responseView, setResponseView] = useState<'json' | 'text'>('json');
  const [isLoading, setIsLoading] = useState(false);

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

  const sendRequest = async () => {
    setIsLoading(true);
    setResponse('');

    try {
      const requestPayload: ExecuteRequestPayload = {
        request: {
          workspaceId: currentWorkspace?.id || '1234',
          name: 'Login Request',
          order: 1,
          method,
          url: buildUrl(),
          bodyType,
          bodyFormData: bodyType === 'form-data' ? body : undefined,
          bodyRawContent: bodyType === 'raw' ? body : undefined,
          authorizationType: authType,
          authorization: authToken ? { token: authToken } : undefined,
          headers: headers.filter((h) => h.enabled && h.key),
          params: params.filter((p) => p.enabled && p.key),
        },
      };

      // 👇 This already gives you JSON (no .json())
      const json = await executeRequest(requestPayload);

      console.log('backendResponse', json);

      const firstResponse = json?.data?.responses?.[0];

      let parsedBody: unknown = firstResponse?.body;
      try {
        parsedBody = JSON.parse(firstResponse.body);
      } catch {
        // leave as raw string if not JSON
      }

      setResponse(parsedBody); // ✅ only the parsed body
    } catch (error) {
      const errorMessage = `Error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      setResponse(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-3xl max-h-[75vh] w-[80vw] h-[75vh] overflow-hidden'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Badge variant='outline'>{method}</Badge>
            {request.name}
          </DialogTitle>
        </DialogHeader>

        <div className='flex flex-col h-[50vh]'>
          <div className='flex gap-2 mb-4 items-center'>
            <Select value={method} onValueChange={setMethod}>
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

          {/* Tabs */}
          <Tabs defaultValue='params' className='flex-1 flex flex-col'>
            <TabsList className='grid w-full grid-cols-6'>
              <TabsTrigger value='params'>Params</TabsTrigger>
              <TabsTrigger value='headers'>Headers</TabsTrigger>
              <TabsTrigger value='body'>Body</TabsTrigger>
              <TabsTrigger value='auth'>Auth</TabsTrigger>
              <TabsTrigger value='tests'>Tests</TabsTrigger>
              <TabsTrigger value='settings'>Settings</TabsTrigger>
            </TabsList>

            <div className='flex-1 overflow-hidden'>
              {/* Params */}
              <TabsContent value='params' className='h-full overflow-auto'>
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
              <TabsContent value='headers' className='h-full overflow-auto'>
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

          {/* ✅ Updated Response Section */}
          {response && (
            <div className='mt-4 border-t pt-4'>
              <div className='flex justify-between items-center'>
                <Label className='text-sm font-medium'>Response</Label>

                <Select
                  value={responseView}
                  onValueChange={(val) =>
                    setResponseView(val as 'json' | 'text')
                  }
                >
                  <SelectTrigger className='w-32 h-7 text-xs'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='json'>JSON</SelectItem>
                    <SelectItem value='text'>Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='mt-2 rounded-md border p-2 bg-muted max-h-80 overflow-x-auto overflow-y-auto'>
                {(() => {
                  if (responseView === 'json' && typeof response === 'object') {
                    return (
                      <div className='text-sm whitespace-pre overflow-x-auto overflow-y-auto max-h-80'>
                        <JsonView
                          src={response}
                          collapsed={1}
                          enableClipboard={false}
                          displayDataTypes={false}
                        />
                      </div>
                    );
                  }

                  return (
                    <pre className='text-sm font-mono whitespace-pre overflow-x-auto overflow-y-auto max-h-80'>
                      {typeof response === 'string'
                        ? response
                        : JSON.stringify(response, null, 2)}
                    </pre>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
