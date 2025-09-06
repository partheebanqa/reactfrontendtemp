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
import { Send, Plus, Trash2, Eye, EyeOff, Download, Check } from 'lucide-react';
import {
  Request,
  RequestHeader,
  RequestParam,
} from '@/shared/types/TestSuite.model';

import { executeRequest } from '@/services/executeRequest.service';
import { ExecuteRequestPayload } from '@/shared/types/requestChain.model';
import { useWorkspace } from '@/hooks/useWorkspace';

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
  onSaveExtractedVariables?: (
    requestId: string,
    extractedVariables: ExtractedVariable[]
  ) => void;
}

export const RequestTestDialog: React.FC<RequestTestDialogProps> = ({
  isOpen,
  onClose,
  request,
  onSaveExtractedVariables,
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
  const [responseHeaders, setResponseHeaders] = useState<
    Record<string, string>
  >({});
  const [responseView, setResponseView] = useState<'body' | 'headers'>('body');
  const [bodyView, setBodyView] = useState<'json' | 'text'>('json');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([]);

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

  const extractField = (
    path: string,
    value: any,
    source: 'response_body' | 'response_header'
  ) => {
    const variableName = `E_${path}`;
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

  const renderJsonField = (
    key: string,
    value: any,
    path: string = '',
    source: 'response_body' | 'response_header' = 'response_body'
  ) => {
    const currentPath = path ? `${path}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return (
        <div key={currentPath} className='ml-4'>
          <div className='text-blue-600 font-medium'>"{key}": &#123;</div>
          {Object.entries(value).map(([subKey, subValue]) =>
            renderJsonField(subKey, subValue, currentPath, source)
          )}
          <div className='text-blue-600 font-medium'>&#125;,</div>
        </div>
      );
    }

    const displayValue =
      typeof value === 'string' ? `"${value}"` : String(value);

    return (
      <div
        key={currentPath}
        className='ml-4 flex items-center justify-between group hover:bg-gray-50 px-2 py-1 rounded'
      >
        <span>
          <span className='text-blue-600 font-medium'>"{key}"</span>:
          <span className='text-green-600 ml-2'>{displayValue}</span>,
        </span>
        <button
          onClick={() => extractField(currentPath, value, source)}
          className='opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 hover:bg-gray-200 rounded'
          title={`Extract ${key}`}
        >
          {isFieldExtracted(currentPath, source) ? (
            <div className='flex items-center gap-1'>
              <Check className='w-3 h-3 text-green-500' />
              <span className='text-xs text-green-500'>Extracted</span>
            </div>
          ) : (
            <button className='flex items-center gap-1 bg-blue-900 text-white px-2 py-1 rounded hover:bg-blue-800 text-xs transition'>
              {/* <Check className="w-3 h-3 text-green-500" /> */}
              Extract
            </button>
          )}
        </button>
      </div>
    );
  };

  const renderHeaderField = (key: string, value: string) => {
    return (
      <div
        key={key}
        className='flex items-center justify-between group hover:bg-gray-50 px-2 py-1 rounded'
      >
        <span className='flex-1 min-w-0'>
          <span className='text-blue-600 font-medium break-all'>{key}</span>:
          <span className='text-green-600 ml-2 break-all'>{value}</span>
        </span>
        <button
          onClick={() => extractField(key, value, 'response_header')}
          className='opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 hover:bg-gray-200 rounded flex-shrink-0'
          title={`Extract ${key}`}
        >
          {isFieldExtracted(key, 'response_header') ? (
            <div className='flex items-center gap-1'>
              <Check className='w-3 h-3 text-green-500' />
              <span className='text-xs text-green-500'>Extracted</span>
            </div>
          ) : (
            <button className='flex items-center gap-1 bg-blue-900 text-white px-2 py-1 rounded hover:bg-blue-800 text-xs transition'>
              {/* <Check className="w-3 h-3 text-green-500" /> */}
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
            <div className='text-blue-600 font-medium'>&#123;</div>
            {Object.entries(parsed).map(([key, value]) =>
              renderJsonField(key, value, '', 'response_body')
            )}
            <div className='text-blue-600 font-medium'>&#125;</div>
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
            className='flex items-center justify-between group hover:bg-gray-50 px-2 py-1 rounded'
          >
            <span className='flex-1'>{line}</span>
            {line.trim() && (
              <button
                onClick={() =>
                  extractField(`line_${index}`, line.trim(), 'response_body')
                }
                className='opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 hover:bg-gray-200 rounded'
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

      const json = (await executeRequest(requestPayload)) as any;

      console.log('backendResponse', json);

      const firstResponse = json?.data?.responses?.[0];

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
    if (onSaveExtractedVariables && extractedFields.length > 0) {
      const formattedVariables: ExtractedVariable[] = extractedFields.map(
        (field) => ({
          name: field.variableName,
          path: field.path,
          source: field.source,
          type: typeof field.value === 'string' ? 'string' : 'number',
        })
      );
      onSaveExtractedVariables(request.id, formattedVariables);
      setExtractedFields([]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] w-[90vw] overflow-hidden flex flex-col'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Badge variant='outline'>{method}</Badge>
            {request.name}
          </DialogTitle>
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
                                <div className='text-blue-600 font-medium'>
                                  &#123;
                                </div>
                                {Object.entries(response).map(([key, value]) =>
                                  renderJsonField(
                                    key,
                                    value,
                                    '',
                                    'response_body'
                                  )
                                )}
                                <div className='text-blue-600 font-medium'>
                                  &#125;
                                </div>
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
                  <Button
                    size='sm'
                    onClick={handleSaveVariables}
                    className='bg-green-600 hover:bg-green-700 text-white'
                  >
                    Save Variables
                  </Button>
                </div>
                <div className='mt-2 space-y-2'>
                  {extractedFields.map((field, index) => (
                    <div
                      key={index}
                      className='bg-green-50 border border-green-200 rounded p-2 text-sm'
                    >
                      <div className='font-medium text-green-800'>
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
