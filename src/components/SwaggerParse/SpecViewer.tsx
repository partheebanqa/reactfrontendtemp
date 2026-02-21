import { useState } from 'react';
import yaml from 'js-yaml';

import {
  Eye,
  Copy,
  Download,
  X,
  Code,
  FileText,
  Settings,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { Separator } from '@radix-ui/react-select';
import { useToast } from '@/hooks/useToast';

interface APIEndpoint {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  parameters?: any[];
  responses?: any;
  requestBody?: any;
}

interface SpecViewerProps {
  endpoint: APIEndpoint;
  parsedSpec: any;
  exportFormat: 'json' | 'yaml';
  onClose: () => void;
}

const methodColors = {
  get: 'bg-green-100 text-green-800 border-green-200',
  post: 'bg-blue-100 text-blue-800 border-blue-200',
  put: 'bg-orange-100 text-orange-800 border-orange-200',
  patch: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  delete: 'bg-red-100 text-red-800 border-red-200',
  head: 'bg-purple-100 text-purple-800 border-purple-200',
  options: 'bg-gray-100 text-gray-800 border-gray-200',
};

// Helper functions (same as in OpenAPIExporter)
const transformParameter = (param: any): any => {
  if (!param || typeof param !== 'object') {
    return param;
  }

  if (param.schema) {
    return param;
  }

  let transformed = { ...param };

  if (param.type || param.format || param.enum || param.items) {
    transformed.schema = {};

    if (param.type) {
      transformed.schema.type = param.type;
      delete transformed.type;
    }

    if (param.format) {
      transformed.schema.format = param.format;
      delete transformed.format;
    }

    if (param.enum) {
      transformed.schema.enum = param.enum;
      delete transformed.enum;
    }

    if (param.items) {
      transformed.schema.items = transformReferences(param.items);
      delete transformed.items;
    }

    if (param.minimum !== undefined) {
      transformed.schema.minimum = param.minimum;
      delete transformed.minimum;
    }

    if (param.maximum !== undefined) {
      transformed.schema.maximum = param.maximum;
      delete transformed.maximum;
    }

    if (param.minLength !== undefined) {
      transformed.schema.minLength = param.minLength;
      delete transformed.minLength;
    }

    if (param.maxLength !== undefined) {
      transformed.schema.maxLength = param.maxLength;
      delete transformed.maxLength;
    }

    if (param.pattern) {
      transformed.schema.pattern = param.pattern;
      delete transformed.pattern;
    }
  }

  transformed = transformReferences(transformed);

  return transformed;
};

const transformReferences = (obj: any): any => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformReferences);
  }

  const transformed: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (key === '$ref' && typeof value === 'string') {
      if (value.startsWith('#/definitions/')) {
        transformed[key] = value.replace(
          '#/definitions/',
          '#/components/schemas/'
        );
      } else if (value.startsWith('#/parameters/')) {
        transformed[key] = value.replace(
          '#/parameters/',
          '#/components/parameters/'
        );
      } else if (value.startsWith('#/responses/')) {
        transformed[key] = value.replace(
          '#/responses/',
          '#/components/responses/'
        );
      } else {
        transformed[key] = value;
      }
    } else if (value !== null && typeof value === 'object') {
      transformed[key] = transformReferences(value);
    } else {
      transformed[key] = value;
    }
  }

  return transformed;
};

const transformResponse = (response: any): any => {
  if (!response || typeof response !== 'object') {
    return response;
  }

  let transformed = { ...response };

  if (response.schema && !response.content) {
    transformed.content = {
      'application/json': {
        schema: transformReferences(response.schema),
      },
    };
    delete transformed.schema;
  }

  transformed = transformReferences(transformed);

  return transformed;
};

const validateAndCleanComponents = (components: any): any => {
  if (!components || typeof components !== 'object') {
    return {};
  }

  const cleanedComponents: any = {};

  if (components.schemas && typeof components.schemas === 'object') {
    cleanedComponents.schemas = {};
    Object.entries(components.schemas).forEach(([key, schema]) => {
      if (schema && typeof schema === 'object') {
        cleanedComponents.schemas[key] = transformReferences(schema);
      }
    });
  }

  if (components.definitions && typeof components.definitions === 'object') {
    if (!cleanedComponents.schemas) {
      cleanedComponents.schemas = {};
    }
    Object.entries(components.definitions).forEach(([key, schema]) => {
      if (schema && typeof schema === 'object') {
        cleanedComponents.schemas[key] = transformReferences(schema);
      }
    });
  }

  const componentTypes = [
    'responses',
    'parameters',
    'examples',
    'requestBodies',
    'headers',
    'securitySchemes',
    'links',
    'callbacks',
  ];
  componentTypes.forEach((type) => {
    if (components[type] && typeof components[type] === 'object') {
      cleanedComponents[type] = transformReferences(components[type]);
    }
  });

  return cleanedComponents;
};

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className='border rounded-lg'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors'
      >
        <span className='font-medium text-sm'>{title}</span>
        {isOpen ? (
          <ChevronDown className='h-4 w-4' />
        ) : (
          <ChevronRight className='h-4 w-4' />
        )}
      </button>
      {isOpen && <div className='border-t p-3'>{children}</div>}
    </div>
  );
}

export default function SpecViewer({
  endpoint,
  parsedSpec,
  exportFormat,
  onClose,
}: SpecViewerProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const { toast } = useToast();

  // Generate the complete endpoint spec
  const originalSpec = parsedSpec?.originalSpec;
  const cleanedComponents = validateAndCleanComponents(
    originalSpec?.components || originalSpec?.definitions
      ? {
        ...originalSpec.components,
        definitions: originalSpec.definitions,
      }
      : {}
  );

  const transformedParameters = endpoint.parameters?.map(transformParameter);
  const transformedResponses = endpoint.responses
    ? Object.fromEntries(
      Object.entries(endpoint.responses).map(([code, response]) => [
        code,
        transformResponse(response),
      ])
    )
    : undefined;

  const transformedRequestBody = endpoint.requestBody
    ? transformReferences(endpoint.requestBody)
    : undefined;

  const endpointSpec = {
    openapi: '3.0.0',
    info: parsedSpec?.info,
    servers: parsedSpec?.servers,
    paths: {
      [endpoint.path]: {
        [endpoint.method]: {
          summary: endpoint.summary,
          description: endpoint.description,
          operationId: endpoint.operationId,
          tags: endpoint.tags,
          parameters: transformedParameters,
          responses: transformedResponses,
          requestBody: transformedRequestBody,
        },
      },
    },
    ...(Object.keys(cleanedComponents).length > 0 && {
      components: cleanedComponents,
    }),
  };

  const specContent =
    exportFormat === 'json'
      ? JSON.stringify(endpointSpec, null, 2)
      : yaml.dump(endpointSpec);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(specContent);

      toast({
        title: 'Copied',
        description: 'Copied to clipboard!',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Failed Copied',
        description: 'Failed to copy to clipboard',
        variant: 'error',
      });
    }
  };

  const downloadSpec = () => {
    const blob = new Blob([specContent], {
      type: exportFormat === 'json' ? 'application/json' : 'application/x-yaml',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${endpoint.operationId ||
      `${endpoint.method}-${endpoint.path.replace(/\//g, '-')}`
      }.${exportFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: 'Copied',
      description: `Downloaded ${endpoint.method.toUpperCase()} ${endpoint.path
        }`,
      variant: 'success',
    });
  };

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'>
      <Card className='w-full max-w-6xl max-h-[90vh] bg-white shadow-2xl'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
          <div className='space-y-1'>
            <CardTitle className='flex items-center gap-3'>
              <Eye className='h-5 w-5 text-blue-600' />
              API Specification Viewer
            </CardTitle>
            <CardDescription className='flex items-center gap-2'>
              <Badge
                variant='outline'
                className={`font-mono text-xs ${methodColors[endpoint.method as keyof typeof methodColors] ||
                  'bg-gray-100 text-gray-800'
                  }`}
              >
                {endpoint.method.toUpperCase()}
              </Badge>
              <code className='text-sm font-mono bg-gray-100 px-2 py-1 rounded'>
                {endpoint.path}
              </code>
            </CardDescription>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' onClick={copyToClipboard}>
              <Copy className='h-4 w-4 mr-1' />
              Copy
            </Button>
            <Button variant='outline' size='sm' onClick={downloadSpec}>
              <Download className='h-4 w-4 mr-1' />
              Download
            </Button>
            <Button variant='ghost' size='sm' onClick={onClose}>
              <X className='h-4 w-4' />
            </Button>
          </div>
        </CardHeader>

        <CardContent className='p-0'>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className='h-full'
          >
            <div className='px-6'>
              <TabsList className='grid w-full grid-cols-3'>
                <TabsTrigger
                  value='overview'
                  className='flex items-center gap-2'
                >
                  <FileText className='h-4 w-4' />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value='details'
                  className='flex items-center gap-2'
                >
                  <Settings className='h-4 w-4' />
                  Details
                </TabsTrigger>
                <TabsTrigger value='spec' className='flex items-center gap-2'>
                  <Code className='h-4 w-4' />
                  Raw Spec
                </TabsTrigger>
              </TabsList>
            </div>

            <div className='px-6 pb-6'>
              <TabsContent value='overview' className='mt-4 space-y-4'>
                <ScrollArea className='h-[65vh] overflow-auto rounded'>
                  <div className='space-y-6'>
                    {/* Basic Info */}
                    <div className='space-y-3'>
                      <h3 className='text-lg font-semibold'>
                        Basic Information
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                          <label className='text-sm font-medium text-gray-700'>
                            Method
                          </label>
                          <p className='mt-1'>
                            <Badge
                              variant='outline'
                              className={`font-mono ${methodColors[
                                endpoint.method as keyof typeof methodColors
                              ] || 'bg-gray-100 text-gray-800'
                                }`}
                            >
                              {endpoint.method.toUpperCase()}
                            </Badge>
                          </p>
                        </div>
                        <div>
                          <label className='text-sm font-medium text-gray-700'>
                            Path
                          </label>
                          <p className='mt-1 font-mono text-sm bg-gray-100 px-2 py-1 rounded'>
                            {endpoint.path}
                          </p>
                        </div>
                        {endpoint.operationId && (
                          <div>
                            <label className='text-sm font-medium text-gray-700'>
                              Operation ID
                            </label>
                            <p className='mt-1 text-sm'>
                              {endpoint.operationId}
                            </p>
                          </div>
                        )}
                        {endpoint.tags && endpoint.tags.length > 0 && (
                          <div>
                            <label className='text-sm font-medium text-gray-700'>
                              Tags
                            </label>
                            <div className='mt-1 flex gap-1 flex-wrap'>
                              {endpoint.tags.map((tag, index) => (
                                <Badge
                                  key={index}
                                  variant='secondary'
                                  className='text-xs'
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Summary & Description */}
                    {(endpoint.summary || endpoint.description) && (
                      <>
                        <div className='space-y-3'>
                          <h3 className='text-lg font-semibold'>Description</h3>
                          {endpoint.summary && (
                            <div>
                              <label className='text-sm font-medium text-gray-700'>
                                Summary
                              </label>
                              <p className='mt-1 text-sm'>{endpoint.summary}</p>
                            </div>
                          )}
                          {endpoint.description && (
                            <div>
                              <label className='text-sm font-medium text-gray-700'>
                                Description
                              </label>
                              <p className='mt-1 text-sm text-gray-600 leading-relaxed'>
                                {endpoint.description}
                              </p>
                            </div>
                          )}
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Parameters */}
                    {endpoint.parameters && endpoint.parameters.length > 0 && (
                      <>
                        <div className='space-y-3'>
                          <h3 className='text-lg font-semibold'>
                            Parameters ({endpoint.parameters.length})
                          </h3>
                          <div className='space-y-2'>
                            {endpoint.parameters.map((param, index) => (
                              <div
                                key={index}
                                className='border rounded-lg p-3 bg-gray-50'
                              >
                                <div className='flex items-center justify-between mb-2'>
                                  <div className='flex items-center gap-2'>
                                    <span className='font-medium text-sm'>
                                      {param.name}
                                    </span>
                                    {param.required && (
                                      <Badge
                                        variant='destructive'
                                        className='text-xs'
                                      >
                                        Required
                                      </Badge>
                                    )}
                                  </div>
                                  <Badge variant='outline' className='text-xs'>
                                    {param.in}
                                  </Badge>
                                </div>
                                {param.description && (
                                  <p className='text-sm text-gray-600 mb-2'>
                                    {param.description}
                                  </p>
                                )}
                                {param.schema && (
                                  <div className='text-xs text-gray-500'>
                                    Type: {param.schema.type || 'any'}
                                    {param.schema.format &&
                                      ` (${param.schema.format})`}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Request Body */}
                    {endpoint.requestBody && (
                      <>
                        <div className='space-y-3'>
                          <h3 className='text-lg font-semibold'>
                            Request Body
                          </h3>
                          <div className='border rounded-lg p-3 bg-gray-50'>
                            {endpoint.requestBody.description && (
                              <p className='text-sm text-gray-600 mb-2'>
                                {endpoint.requestBody.description}
                              </p>
                            )}
                            {endpoint.requestBody.required && (
                              <Badge
                                variant='destructive'
                                className='text-xs mb-2'
                              >
                                Required
                              </Badge>
                            )}
                            {endpoint.requestBody.content && (
                              <div className='text-xs text-gray-500'>
                                Content Types:{' '}
                                {Object.keys(endpoint.requestBody.content).join(
                                  ', '
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Responses */}
                    {endpoint.responses && (
                      <div className='space-y-3'>
                        <h3 className='text-lg font-semibold'>
                          Responses ({Object.keys(endpoint.responses).length})
                        </h3>
                        <div className='space-y-2'>
                          {Object.entries(endpoint.responses).map(
                            ([code, response]: [string, any]) => (
                              <div
                                key={code}
                                className='border rounded-lg p-3 bg-gray-50'
                              >
                                <div className='flex items-center gap-2 mb-2'>
                                  <Badge
                                    variant={
                                      code.startsWith('2')
                                        ? 'default'
                                        : code.startsWith('4')
                                          ? 'destructive'
                                          : 'secondary'
                                    }
                                    className='text-xs'
                                  >
                                    {code}
                                  </Badge>
                                  <span className='text-sm font-medium'>
                                    {response.description || 'No description'}
                                  </span>
                                </div>
                                {response.content && (
                                  <div className='text-xs text-gray-500'>
                                    Content Types:{' '}
                                    {Object.keys(response.content).join(', ')}
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value='details' className='mt-4'>
                <ScrollArea className='h-[65vh] overflow-auto rounded'>
                  <div className='space-y-4'>
                    <CollapsibleSection
                      title='Parameters'
                      defaultOpen={!!endpoint.parameters?.length}
                    >
                      {endpoint.parameters && endpoint.parameters.length > 0 ? (
                        <pre className='text-xs bg-gray-100 p-3 rounded overflow-x-auto scrollbar-thin'>
                          {JSON.stringify(transformedParameters, null, 2)}
                        </pre>
                      ) : (
                        <p className='text-sm text-gray-500'>
                          No parameters defined
                        </p>
                      )}
                    </CollapsibleSection>

                    <CollapsibleSection title='Request Body'>
                      {endpoint.requestBody ? (
                        <pre className='text-xs bg-gray-100 p-3 rounded overflow-x-auto scrollbar-thin'>
                          {JSON.stringify(transformedRequestBody, null, 2)}
                        </pre>
                      ) : (
                        <p className='text-sm text-gray-500'>
                          No request body defined
                        </p>
                      )}
                    </CollapsibleSection>

                    <CollapsibleSection
                      title='Responses'
                      defaultOpen={!!endpoint.responses}
                    >
                      {endpoint.responses ? (
                        <pre className='text-xs bg-gray-100 p-3 rounded overflow-x-auto scrollbar-thin'>
                          {JSON.stringify(transformedResponses, null, 2)}
                        </pre>
                      ) : (
                        <p className='text-sm text-gray-500'>
                          No responses defined
                        </p>
                      )}
                    </CollapsibleSection>

                    {Object.keys(cleanedComponents).length > 0 && (
                      <CollapsibleSection title='Components'>
                        <pre className='text-xs bg-gray-100 p-3 rounded overflow-x-auto scrollbar-thin'>
                          {JSON.stringify(cleanedComponents, null, 2)}
                        </pre>
                      </CollapsibleSection>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value='spec' className='mt-4'>
                <ScrollArea className='h-[65vh] overflow-auto rounded'>
                  <div className='relative'>
                    <pre className='text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto scrollbar-thin'>
                      {specContent}
                    </pre>
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
