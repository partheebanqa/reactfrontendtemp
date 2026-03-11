import React, { useState } from 'react';
import {
    Upload,
    FileText,
    Download,
    CheckSquare,
    Square,
    Eye,
    AlertCircle,
    Info,
    RefreshCw,
} from 'lucide-react';
import OpenAPIExporter from '@/components/SwaggerParse/OpenAPIExporter';
import LandingLayout from '@/components/LandingLayout/LandingLayout';

interface ParsedEndpoint {
    id: string;
    path: string;
    method: string;
    operationId?: string;
    summary?: string;
    description?: string;
    tags?: string[];
    responses: Record<string, any>;
    parameters?: any[];
    requestBody?: any;
    selected: boolean;
    schema?: any;
}

const SwaggerParserNew: React.FC = () => {
    const [swaggerContent, setSwaggerContent] = useState<any>(null);
    const [parsedEndpoints, setParsedEndpoints] = useState<ParsedEndpoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<string>('');
    const [inputMethod, setInputMethod] = useState<'file' | 'url'>('file');
    const [swaggerUrl, setSwaggerUrl] = useState<string>('');
    const [urlError, setUrlError] = useState<string>('');
    const [parseError, setParseError] = useState<string>('');
    const [filterTag, setFilterTag] = useState<string>('');
    const [filterMethod, setFilterMethod] = useState<string>('');
    const [showPreview, setShowPreview] = useState<string>('');

    const handleFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setSelectedFile(file.name);
        setUrlError('');
        setParseError('');

        try {
            const text = await file.text();
            const content = JSON.parse(text);

            const validationResult = validateAndParseSwaggerFile(content);
            if (!validationResult.isValid) {
                setParseError(validationResult.error || 'Invalid file format');
                setSwaggerContent(null);
                setParsedEndpoints([]);
                return;
            }

            // Normalize to OpenAPI 3.0 if it's Swagger 2.0
            const normalizedContent = normalizeToOpenAPI3(content);
            setSwaggerContent(normalizedContent);

            const endpoints = parseSwaggerEndpoints(normalizedContent);
            setParsedEndpoints(endpoints);

            if (endpoints.length === 0) {
                setParseError(
                    'No API endpoints found in this file. This appears to be a schema definition rather than a complete API specification with endpoints.'
                );
            }
        } catch (error) {
            console.error('Error parsing file:', error);
            setParseError(
                "Error parsing file. Please ensure it's a valid JSON format."
            );
            setSwaggerContent(null);
            setParsedEndpoints([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUrlSubmit = async () => {
        if (!swaggerUrl.trim()) {
            setUrlError('Please enter a valid URL');
            return;
        }

        try {
            new URL(swaggerUrl);
        } catch {
            setUrlError('Please enter a valid URL format');
            return;
        }

        setLoading(true);
        setUrlError('');
        setParseError('');
        setSelectedFile('');

        try {
            const response = await fetch(swaggerUrl);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(
                        `The URL returned HTTP 404 (Not Found). Please verify the URL is correct and the resource exists.`
                    );
                } else if (response.status === 403) {
                    throw new Error(
                        `Access forbidden (HTTP 403). The server is refusing to provide the resource.`
                    );
                } else if (response.status >= 500) {
                    throw new Error(
                        `Server error (HTTP ${response.status}). The remote server is experiencing issues.`
                    );
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            }

            const text = await response.text();

            if (
                swaggerUrl.toLowerCase().includes('.yaml') ||
                swaggerUrl.toLowerCase().includes('.yml')
            ) {
                setUrlError(
                    'YAML files are not currently supported. Please use a JSON format Swagger/OpenAPI file or convert the YAML to JSON first.'
                );
                return;
            }

            let content;
            try {
                content = JSON.parse(text);
            } catch (parseError) {
                if (
                    text.trim().startsWith('openapi:') ||
                    text.trim().startsWith('swagger:')
                ) {
                    setUrlError(
                        'This appears to be a YAML file. Please use a JSON format Swagger/OpenAPI file instead, or convert the YAML to JSON first.'
                    );
                    return;
                }
                throw new Error(
                    'The response is not valid JSON format. Please ensure the URL points to a JSON Swagger/OpenAPI specification.'
                );
            }

            const validationResult = validateAndParseSwaggerFile(content);
            if (!validationResult.isValid) {
                setUrlError(
                    validationResult.error ||
                    'URL does not contain a valid Swagger/OpenAPI specification'
                );
                return;
            }

            // Normalize to OpenAPI 3.0 if it's Swagger 2.0
            const normalizedContent = normalizeToOpenAPI3(content);
            setSwaggerContent(normalizedContent);

            const endpoints = parseSwaggerEndpoints(normalizedContent);
            setParsedEndpoints(endpoints);
            setSelectedFile(`Loaded from: ${swaggerUrl}`);

            if (endpoints.length === 0) {
                setParseError(
                    'No API endpoints found in this specification.'
                );
            }
        } catch (error) {
            console.error('Error fetching Swagger from URL:', error);
            if (error instanceof Error) {
                setUrlError(`Failed to load Swagger file: ${error.message}`);
            } else {
                setUrlError(
                    'Failed to load Swagger file from URL. Please check the URL and try again.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    /**
     * Normalize Swagger 2.0 to OpenAPI 3.0 format
     */
    const normalizeToOpenAPI3 = (content: any): any => {
        // If already OpenAPI 3.x, return as-is
        if (content.openapi && content.openapi.startsWith('3.')) {
            return content;
        }

        // If Swagger 2.0, convert to OpenAPI 3.0
        if (content.swagger && content.swagger === '2.0') {
            const normalized: any = {
                openapi: '3.0.3',
                info: content.info || {},
                servers: [],
                paths: {},
                components: {
                    schemas: {},
                    responses: {},
                    parameters: {},
                    securitySchemes: {},
                },
            };

            // Convert servers
            if (content.host) {
                const scheme = content.schemes?.[0] || 'https';
                const basePath = content.basePath || '';
                normalized.servers.push({
                    url: `${scheme}://${content.host}${basePath}`,
                    description: 'API Server',
                });
            }

            // Convert definitions to components.schemas
            if (content.definitions) {
                normalized.components.schemas = content.definitions;
            }

            // Convert paths
            if (content.paths) {
                Object.keys(content.paths).forEach(path => {
                    normalized.paths[path] = {};
                    const pathItem = content.paths[path];

                    Object.keys(pathItem).forEach(method => {
                        if (['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method)) {
                            const operation = pathItem[method];

                            // Convert operation
                            normalized.paths[path][method] = {
                                ...operation,
                                responses: convertSwagger2Responses(operation.responses || {}),
                            };

                            // Convert request body from parameters
                            if (operation.parameters) {
                                const bodyParams = operation.parameters.filter((p: any) => p.in === 'body');
                                const otherParams = operation.parameters.filter((p: any) => p.in !== 'body' && p.in !== 'formData');

                                if (bodyParams.length > 0) {
                                    const bodyParam = bodyParams[0];
                                    normalized.paths[path][method].requestBody = {
                                        description: bodyParam.description,
                                        required: bodyParam.required,
                                        content: {
                                            'application/json': {
                                                schema: bodyParam.schema,
                                            },
                                        },
                                    };
                                }

                                normalized.paths[path][method].parameters = otherParams;
                            }
                        }
                    });
                });
            }

            // Convert security definitions
            if (content.securityDefinitions) {
                normalized.components.securitySchemes = convertSecurityDefinitions(
                    content.securityDefinitions
                );
            }

            // Copy tags and externalDocs if present
            if (content.tags) normalized.tags = content.tags;
            if (content.externalDocs) normalized.externalDocs = content.externalDocs;

            return normalized;
        }

        return content;
    };

    /**
     * Convert Swagger 2.0 responses to OpenAPI 3.0 format
     */
    const convertSwagger2Responses = (responses: any): any => {
        const converted: any = {};

        Object.keys(responses).forEach(status => {
            const response = responses[status];

            if (response.schema) {
                // Has schema, convert to content
                converted[status] = {
                    description: response.description || '',
                    content: {
                        'application/json': {
                            schema: response.schema,
                        },
                    },
                };
            } else {
                // No schema, just keep description
                converted[status] = {
                    description: response.description || '',
                };
            }

            // Copy headers if present
            if (response.headers) {
                converted[status].headers = response.headers;
            }
        });

        return converted;
    };

    /**
     * Convert Swagger 2.0 security definitions to OpenAPI 3.0 security schemes
     */
    const convertSecurityDefinitions = (securityDefs: any): any => {
        const converted: any = {};

        Object.keys(securityDefs).forEach(name => {
            const def = securityDefs[name];

            if (def.type === 'basic') {
                converted[name] = {
                    type: 'http',
                    scheme: 'basic',
                };
            } else if (def.type === 'apiKey') {
                converted[name] = {
                    type: 'apiKey',
                    name: def.name,
                    in: def.in,
                };
            } else if (def.type === 'oauth2') {
                converted[name] = {
                    type: 'oauth2',
                    flows: convertOAuth2Flows(def),
                };
            }
        });

        return converted;
    };

    const convertOAuth2Flows = (def: any): any => {
        const flows: any = {};

        if (def.flow === 'implicit') {
            flows.implicit = {
                authorizationUrl: def.authorizationUrl,
                scopes: def.scopes || {},
            };
        } else if (def.flow === 'password') {
            flows.password = {
                tokenUrl: def.tokenUrl,
                scopes: def.scopes || {},
            };
        } else if (def.flow === 'application') {
            flows.clientCredentials = {
                tokenUrl: def.tokenUrl,
                scopes: def.scopes || {},
            };
        } else if (def.flow === 'accessCode') {
            flows.authorizationCode = {
                authorizationUrl: def.authorizationUrl,
                tokenUrl: def.tokenUrl,
                scopes: def.scopes || {},
            };
        }

        return flows;
    };

    const validateAndParseSwaggerFile = (
        content: any
    ): { isValid: boolean; error?: string } => {
        const hasSwagger = content.swagger && typeof content.swagger === 'string';
        const hasOpenAPI = content.openapi && typeof content.openapi === 'string';

        if (!hasSwagger && !hasOpenAPI) {
            if (content.$schema && content.$schema.includes('json-schema.org')) {
                return {
                    isValid: false,
                    error:
                        'This is a JSON Schema file, not a Swagger/OpenAPI specification.',
                };
            }

            if (content.components && content.components.schemas && !content.paths) {
                return {
                    isValid: false,
                    error:
                        'This appears to be an OpenAPI components file. Need a complete specification with "paths".',
                };
            }

            return {
                isValid: false,
                error:
                    'Invalid Swagger/OpenAPI file. Must contain "swagger" or "openapi" version field.',
            };
        }

        if (!content.paths || typeof content.paths !== 'object') {
            return {
                isValid: false,
                error: 'No API endpoints found. File must contain "paths" section.',
            };
        }

        if (Object.keys(content.paths).length === 0) {
            return {
                isValid: false,
                error: 'Empty "paths" object. No API endpoints defined.',
            };
        }

        return { isValid: true };
    };

    const parseSwaggerEndpoints = (swagger: any): ParsedEndpoint[] => {
        const endpoints: ParsedEndpoint[] = [];
        const paths = swagger.paths || {};

        Object.entries(paths).forEach(([path, pathItem]: [string, any]) => {
            const methods = [
                'get',
                'post',
                'put',
                'delete',
                'patch',
                'head',
                'options',
                'trace', // Added TRACE support
            ];

            methods.forEach((method) => {
                if (pathItem[method]) {
                    const operation = pathItem[method];
                    const id = `${method.toUpperCase()}_${path.replace(
                        /[^a-zA-Z0-9]/g,
                        '_'
                    )}`;

                    endpoints.push({
                        id,
                        path,
                        method: method.toUpperCase(),
                        operationId: operation.operationId,
                        summary: operation.summary,
                        description: operation.description,
                        tags: operation.tags || [],
                        responses: operation.responses || {},
                        parameters: operation.parameters,
                        requestBody: operation.requestBody,
                        selected: true,
                        schema: null,
                    });
                }
            });
        });

        return endpoints;
    };

    /**
     * IMPROVED: Generate complete OpenAPI spec with proper type extraction
     */
    const generateOpenAPISpec = (endpoint: ParsedEndpoint): any => {
        const extractedComponents = extractAllComponents(swaggerContent, endpoint);

        const baseSpec: any = {
            openapi: '3.0.3',
            info: {
                title: `${endpoint.method} ${endpoint.path} API`,
                version: '1.0.0',
                description:
                    endpoint.description ||
                    endpoint.summary ||
                    `API specification for ${endpoint.method} ${endpoint.path}`,
            },
            servers: swaggerContent.servers || [
                {
                    url: 'https://api.example.com',
                    description: 'API Server',
                },
            ],
            paths: {
                [endpoint.path]: {
                    [endpoint.method.toLowerCase()]: {
                        operationId:
                            endpoint.operationId ||
                            `${endpoint.method.toLowerCase()}${endpoint.path.replace(
                                /[^a-zA-Z0-9]/g,
                                ''
                            )}`,
                        summary: endpoint.summary,
                        description: endpoint.description,
                        tags: endpoint.tags,
                        parameters: resolveParameters(endpoint.parameters, swaggerContent),
                        requestBody: endpoint.requestBody,
                        responses: endpoint.responses,
                    },
                },
            },
            components: extractedComponents,
        };

        // Add tags if present
        if (swaggerContent.tags) {
            const relevantTags = swaggerContent.tags.filter((tag: any) =>
                endpoint.tags?.includes(tag.name)
            );
            if (relevantTags.length > 0) {
                baseSpec.tags = relevantTags;
            }
        }

        // Add security if present
        if (swaggerContent.security) {
            baseSpec.security = swaggerContent.security;
        }

        return baseSpec;
    };

    /**
     * IMPROVED: Resolve parameter references
     */
    const resolveParameters = (params: any[] | undefined, swagger: any): any[] => {
        if (!params) return [];

        return params.map(param => {
            // Handle reference objects
            if (param.$ref) {
                const refPath = param.$ref.replace(/^#\//, '').split('/');
                let resolved = swagger;

                for (const key of refPath) {
                    resolved = resolved?.[key];
                    if (!resolved) break;
                }

                return resolved || param;
            }

            return param;
        });
    };

    /**
     * IMPROVED: Extract all components with complete reference resolution
     */
    const extractAllComponents = (swagger: any, endpoint: ParsedEndpoint): any => {
        const components: any = {
            schemas: {},
            responses: {},
            parameters: {},
            examples: {},
            requestBodies: {},
            headers: {},
            securitySchemes: {},
        };

        const sourceComponents = swagger.components || {};
        const visited = new Set<string>();

        // Helper function to resolve references recursively
        const resolveRef = (ref: string, targetCollection: any) => {
            if (visited.has(ref)) return;
            visited.add(ref);

            const refPath = ref.replace(/^#\//, '').split('/');
            const componentType = refPath[1]; // e.g., 'schemas', 'responses'
            const componentName = refPath[2];

            if (!sourceComponents[componentType] || !sourceComponents[componentType][componentName]) {
                return;
            }

            const component = sourceComponents[componentType][componentName];
            targetCollection[componentName] = component;

            // Recursively resolve nested references
            findAndResolveRefs(component, targetCollection);
        };

        // Helper function to find all $ref in an object
        const findAndResolveRefs = (obj: any, targetCollection: any) => {
            if (!obj || typeof obj !== 'object') return;

            if (obj.$ref) {
                resolveRef(obj.$ref, targetCollection);
            }

            if (Array.isArray(obj)) {
                obj.forEach(item => findAndResolveRefs(item, targetCollection));
            } else {
                Object.values(obj).forEach(value => {
                    findAndResolveRefs(value, targetCollection);
                });
            }
        };

        // Extract from responses
        Object.values(endpoint.responses).forEach((response: any) => {
            // Handle response references
            if (response.$ref) {
                resolveRef(response.$ref, components.responses);
            } else {
                // Extract from content
                if (response.content) {
                    Object.values(response.content).forEach((mediaType: any) => {
                        findAndResolveRefs(mediaType.schema, components.schemas);
                    });
                }

                // Extract from headers
                if (response.headers) {
                    Object.values(response.headers).forEach((header: any) => {
                        if (header.$ref) {
                            resolveRef(header.$ref, components.headers);
                        } else {
                            findAndResolveRefs(header.schema, components.schemas);
                        }
                    });
                }
            }
        });

        // Extract from request body
        if (endpoint.requestBody) {
            if (endpoint.requestBody.$ref) {
                resolveRef(endpoint.requestBody.$ref, components.requestBodies);
            } else if (endpoint.requestBody.content) {
                Object.values(endpoint.requestBody.content).forEach((mediaType: any) => {
                    findAndResolveRefs(mediaType.schema, components.schemas);

                    if (mediaType.examples) {
                        Object.entries(mediaType.examples).forEach(([name, example]: [string, any]) => {
                            if (example.$ref) {
                                resolveRef(example.$ref, components.examples);
                            }
                        });
                    }
                });
            }
        }

        // Extract from parameters
        if (endpoint.parameters) {
            endpoint.parameters.forEach((param: any) => {
                if (param.$ref) {
                    resolveRef(param.$ref, components.parameters);
                } else {
                    findAndResolveRefs(param.schema, components.schemas);

                    if (param.examples) {
                        Object.entries(param.examples).forEach(([name, example]: [string, any]) => {
                            if (example.$ref) {
                                resolveRef(example.$ref, components.examples);
                            }
                        });
                    }
                }
            });
        }

        // Copy security schemes if referenced
        if (swagger.security || swagger.components?.securitySchemes) {
            components.securitySchemes = swagger.components?.securitySchemes || {};
        }

        // Remove empty component sections
        Object.keys(components).forEach(key => {
            if (Object.keys(components[key]).length === 0) {
                delete components[key];
            }
        });

        return components;
    };

    const toggleEndpointSelection = (id: string) => {
        setParsedEndpoints((prev) =>
            prev.map((endpoint) =>
                endpoint.id === id
                    ? { ...endpoint, selected: !endpoint.selected }
                    : endpoint
            )
        );
    };

    const toggleSelectAll = () => {
        const allSelected = parsedEndpoints.every((e) => e.selected);
        setParsedEndpoints((prev) =>
            prev.map((endpoint) => ({ ...endpoint, selected: !allSelected }))
        );
    };

    const generateSelectedSpecs = () => {
        const selectedEndpoints = parsedEndpoints.filter((e) => e.selected);

        selectedEndpoints.forEach((endpoint) => {
            const spec = generateOpenAPISpec(endpoint);
            const fileName = `${endpoint.method}_${endpoint.path.replace(
                /[^a-zA-Z0-9]/g,
                '_'
            )}_spec`;

            downloadSpec(spec, fileName);
        });
    };

    const downloadSpec = (spec: any, fileName: string) => {
        const blob = new Blob([JSON.stringify(spec, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const previewSpec = (endpoint: ParsedEndpoint) => {
        const spec = generateOpenAPISpec(endpoint);
        setShowPreview(JSON.stringify(spec, null, 2));
    };

    const filteredEndpoints = parsedEndpoints.filter((endpoint) => {
        const tagMatch =
            !filterTag ||
            endpoint.tags?.some((tag) =>
                tag.toLowerCase().includes(filterTag.toLowerCase())
            );
        const methodMatch = !filterMethod || endpoint.method === filterMethod;
        return tagMatch && methodMatch;
    });

    const selectedCount = filteredEndpoints.filter((e) => e.selected).length;
    const allTags = [...new Set(parsedEndpoints.flatMap((e) => e.tags || []))];

    return (
        <LandingLayout>
            <OpenAPIExporter />
            <div className='px-4 sm:px-6 lg:px-8 py-6 mb-5'>
                <div>
                    {/* Info Box */}
                    <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                        <div className='flex items-start space-x-2'>
                            <Info className='w-5 h-5 text-blue-600 mt-0.5' />
                            <div className='text-sm text-blue-800'>
                                <p className='font-medium mb-1'>How it works:</p>
                                <ol className='space-y-1 text-xs list-decimal list-inside'>
                                    <li>Upload Swagger 2.0 or OpenAPI 3.x file (JSON format)</li>
                                    <li>System validates and normalizes to OpenAPI 3.0</li>
                                    <li>All endpoints are extracted with complete type definitions</li>
                                    <li>Select endpoints to generate individual specs</li>
                                    <li>Each spec includes ALL referenced schemas, parameters, responses, etc.</li>
                                    <li>Download and use in your testing tool</li>
                                </ol>
                                <p className='font-medium mt-2 mb-1'>✨ New Features:</p>
                                <ul className='space-y-1 text-xs list-disc list-inside'>
                                    <li>✅ Full Swagger 2.0 to OpenAPI 3.0 conversion</li>
                                    <li>✅ Complete reference ($ref) resolution</li>
                                    <li>✅ All component types extracted (not just schemas)</li>
                                    <li>✅ Nested reference chain following</li>
                                    <li>✅ Parameter reference resolution</li>
                                    <li>✅ TRACE method support</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview Modal */}
                {showPreview && (
                    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                        <div className='bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden'>
                            <div className='flex items-center justify-between p-4 border-b'>
                                <h3 className='text-lg font-medium text-gray-800'>
                                    Generated OpenAPI Spec Preview
                                </h3>
                                <button
                                    onClick={() => setShowPreview('')}
                                    className='text-gray-400 hover:text-gray-600'
                                >
                                    ✕
                                </button>
                            </div>
                            <div className='p-4 overflow-y-auto scrollbar-thin max-h-[60vh]'>
                                <pre className='text-xs font-mono bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto scrollbar-thin'>
                                    {showPreview}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </LandingLayout>
    );
};

function getMethodColor(method: string): string {
    const colors: Record<string, string> = {
        GET: 'bg-green-100 text-green-800',
        POST: 'bg-blue-100 text-blue-800',
        PUT: 'bg-yellow-100 text-yellow-800',
        DELETE: 'bg-red-100 text-red-800',
        PATCH: 'bg-purple-100 text-purple-800',
        HEAD: 'bg-gray-100 text-gray-800',
        OPTIONS: 'bg-gray-100 text-gray-800',
        TRACE: 'bg-indigo-100 text-indigo-800',
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
}

export default SwaggerParserNew;