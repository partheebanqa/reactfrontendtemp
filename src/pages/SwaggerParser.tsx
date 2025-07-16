import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Download, 
  CheckSquare, 
  Square, 
  Eye, 
  Code, 
  AlertCircle, 
  Info, 
  Zap, 
  Link, 
  Globe,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

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

const SwaggerParser: React.FC = () => {
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

      setSwaggerContent(content);
      const endpoints = parseSwaggerEndpoints(content);
      setParsedEndpoints(endpoints);
      
      if (endpoints.length === 0) {
        setParseError('No API endpoints found in this file. This appears to be a schema definition rather than a complete API specification with endpoints.');
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      setParseError('Error parsing file. Please ensure it\'s a valid JSON format.');
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

    // Basic URL validation
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
      // Handle CORS issues by trying different approaches
      let response;
      let content;

      try {
        // First, try direct fetch
        response = await fetch(swaggerUrl);
        
        if (!response.ok) {
          // If direct fetch fails, try with a CORS proxy for common cases
          if (response.status === 404) {
            throw new Error(`The URL returned HTTP 404 (Not Found). Please verify the URL is correct and the resource exists.`);
          } else if (response.status === 403) {
            throw new Error(`Access forbidden (HTTP 403). The server is refusing to provide the resource.`);
          } else if (response.status >= 500) {
            throw new Error(`Server error (HTTP ${response.status}). The remote server is experiencing issues.`);
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        }

        const text = await response.text();
        
        // Handle YAML files (convert to JSON)
        if (swaggerUrl.toLowerCase().includes('.yaml') || swaggerUrl.toLowerCase().includes('.yml')) {
          setUrlError('YAML files are not currently supported. Please use a JSON format Swagger/OpenAPI file or convert the YAML to JSON first.');
          return;
        }

        try {
          content = JSON.parse(text);
        } catch (parseError) {
          // Check if it might be YAML content
          if (text.trim().startsWith('openapi:') || text.trim().startsWith('swagger:')) {
            setUrlError('This appears to be a YAML file. Please use a JSON format Swagger/OpenAPI file instead, or convert the YAML to JSON first.');
            return;
          }
          throw new Error('The response is not valid JSON format. Please ensure the URL points to a JSON Swagger/OpenAPI specification.');
        }
        
      } catch (fetchError) {
        // Handle specific common URL issues
        if (swaggerUrl.includes('github.com') && !swaggerUrl.includes('raw.githubusercontent.com')) {
          setUrlError('GitHub URLs should point to the raw file. Try using raw.githubusercontent.com instead of github.com, or use the "Raw" button on GitHub.');
          return;
        }
        
        if (swaggerUrl.includes('raw.githubusercontent.com') && swaggerUrl.includes('.yaml')) {
          setUrlError('This appears to be a YAML file from GitHub. Please find a JSON version or convert it to JSON first.');
          return;
        }

        throw fetchError;
      }
      
      const validationResult = validateAndParseSwaggerFile(content);
      if (!validationResult.isValid) {
        setUrlError(validationResult.error || 'URL does not contain a valid Swagger/OpenAPI specification');
        return;
      }

      setSwaggerContent(content);
      const endpoints = parseSwaggerEndpoints(content);
      setParsedEndpoints(endpoints);
      setSelectedFile(`Loaded from: ${swaggerUrl}`);
      
      if (endpoints.length === 0) {
        setParseError('No API endpoints found in this specification. This appears to be a schema definition rather than a complete API specification with endpoints.');
      }
      
    } catch (error) {
      console.error('Error fetching Swagger from URL:', error);
      if (error instanceof Error) {
        setUrlError(`Failed to load Swagger file: ${error.message}`);
      } else {
        setUrlError('Failed to load Swagger file from URL. Please check the URL and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const validateAndParseSwaggerFile = (content: any): { isValid: boolean; error?: string } => {
    // Check for Swagger/OpenAPI indicators
    const hasSwagger = content.swagger && typeof content.swagger === 'string';
    const hasOpenAPI = content.openapi && typeof content.openapi === 'string';
    
    if (!hasSwagger && !hasOpenAPI) {
      // Check if it's a JSON Schema file
      if (content.$schema && content.$schema.includes('json-schema.org')) {
        return {
          isValid: false,
          error: 'This is a JSON Schema file, not a Swagger/OpenAPI specification. JSON Schema files define data structures, while Swagger/OpenAPI files define complete API specifications with endpoints. Please upload a Swagger/OpenAPI file instead.'
        };
      }
      
      // Check if it has only components/schemas (OpenAPI components file)
      if (content.components && content.components.schemas && !content.paths) {
        return {
          isValid: false,
          error: 'This appears to be an OpenAPI components file containing only schema definitions. For the Swagger Parser to work, you need a complete OpenAPI specification that includes "paths" with actual API endpoints.'
        };
      }
      
      return {
        isValid: false,
        error: 'This file does not appear to be a valid Swagger/OpenAPI specification. Please ensure the file contains either "swagger" or "openapi" version fields.'
      };
    }
    
    // Check for paths
    if (!content.paths || typeof content.paths !== 'object') {
      return {
        isValid: false,
        error: 'This Swagger/OpenAPI file does not contain any API endpoints ("paths"). The Swagger Parser requires API endpoint definitions to extract individual specifications.'
      };
    }
    
    // Check if paths is empty
    if (Object.keys(content.paths).length === 0) {
      return {
        isValid: false,
        error: 'This Swagger/OpenAPI file contains an empty "paths" object. No API endpoints are defined to parse.'
      };
    }
    
    return { isValid: true };
  };

  const parseSwaggerEndpoints = (swagger: any): ParsedEndpoint[] => {
    const endpoints: ParsedEndpoint[] = [];
    const paths = swagger.paths || {};

    Object.entries(paths).forEach(([path, pathItem]: [string, any]) => {
      const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];
      
      methods.forEach(method => {
        if (pathItem[method]) {
          const operation = pathItem[method];
          const id = `${method.toUpperCase()}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
          
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
            selected: true, // Default to selected
            schema: null // Will be generated when needed
          });
        }
      });
    });

    return endpoints;
  };

  const generateOpenAPISpec = (endpoint: ParsedEndpoint): any => {
    const baseSpec = {
      openapi: '3.0.3',
      info: {
        title: `${endpoint.method} ${endpoint.path} API`,
        version: '1.0.0',
        description: endpoint.description || endpoint.summary || `API specification for ${endpoint.method} ${endpoint.path}`
      },
      servers: swaggerContent.servers || [
        {
          url: swaggerContent.host ? 
            `${swaggerContent.schemes?.[0] || 'https'}://${swaggerContent.host}${swaggerContent.basePath || ''}` :
            'https://api.example.com',
          description: 'API Server'
        }
      ],
      paths: {
        [endpoint.path]: {
          [endpoint.method.toLowerCase()]: {
            operationId: endpoint.operationId || `${endpoint.method.toLowerCase()}${endpoint.path.replace(/[^a-zA-Z0-9]/g, '')}`,
            summary: endpoint.summary,
            description: endpoint.description,
            tags: endpoint.tags,
            parameters: endpoint.parameters,
            requestBody: endpoint.requestBody,
            responses: endpoint.responses
          }
        }
      },
      components: {
        schemas: extractRelevantSchemas(swaggerContent, endpoint)
      }
    };

    return baseSpec;
  };

  const extractRelevantSchemas = (swagger: any, endpoint: ParsedEndpoint): any => {
    const schemas: any = {};
    const components = swagger.components?.schemas || swagger.definitions || {};
    
    // Extract schemas referenced in responses
    Object.values(endpoint.responses).forEach((response: any) => {
      if (response.content) {
        Object.values(response.content).forEach((mediaType: any) => {
          if (mediaType.schema) {
            extractSchemaReferences(mediaType.schema, components, schemas);
          }
        });
      } else if (response.schema) {
        // Swagger 2.0 format
        extractSchemaReferences(response.schema, components, schemas);
      }
    });

    // Extract schemas from request body
    if (endpoint.requestBody?.content) {
      Object.values(endpoint.requestBody.content).forEach((mediaType: any) => {
        if (mediaType.schema) {
          extractSchemaReferences(mediaType.schema, components, schemas);
        }
      });
    }

    return schemas;
  };

  const extractSchemaReferences = (schema: any, allSchemas: any, extractedSchemas: any) => {
    if (schema.$ref) {
      const refName = schema.$ref.split('/').pop();
      if (refName && allSchemas[refName] && !extractedSchemas[refName]) {
        extractedSchemas[refName] = allSchemas[refName];
        // Recursively extract referenced schemas
        extractSchemaReferences(allSchemas[refName], allSchemas, extractedSchemas);
      }
    } else if (schema.properties) {
      Object.values(schema.properties).forEach((prop: any) => {
        extractSchemaReferences(prop, allSchemas, extractedSchemas);
      });
    } else if (schema.items) {
      extractSchemaReferences(schema.items, allSchemas, extractedSchemas);
    }
  };

  const toggleEndpointSelection = (id: string) => {
    setParsedEndpoints(prev => 
      prev.map(endpoint => 
        endpoint.id === id 
          ? { ...endpoint, selected: !endpoint.selected }
          : endpoint
      )
    );
  };

  const toggleSelectAll = () => {
    const allSelected = parsedEndpoints.every(e => e.selected);
    setParsedEndpoints(prev => 
      prev.map(endpoint => ({ ...endpoint, selected: !allSelected }))
    );
  };

  const generateSelectedSpecs = () => {
    const selectedEndpoints = parsedEndpoints.filter(e => e.selected);
    
    selectedEndpoints.forEach(endpoint => {
      const spec = generateOpenAPISpec(endpoint);
      const fileName = `${endpoint.method}_${endpoint.path.replace(/[^a-zA-Z0-9]/g, '_')}_spec`;
      
      // Download the spec
      downloadSpec(spec, fileName);
      
      // Also add to the tool if callback provided
      // if (onSpecGenerated) {
      //   onSpecGenerated(spec, `${endpoint.method} ${endpoint.path}`);
      // }
    });
  };

  const downloadSpec = (spec: any, fileName: string) => {
    const blob = new Blob([JSON.stringify(spec, null, 2)], { 
      type: 'application/json' 
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

  const filteredEndpoints = parsedEndpoints.filter(endpoint => {
    const tagMatch = !filterTag || endpoint.tags?.some(tag => 
      tag.toLowerCase().includes(filterTag.toLowerCase())
    );
    const methodMatch = !filterMethod || endpoint.method === filterMethod;
    return tagMatch && methodMatch;
  });

  const selectedCount = filteredEndpoints.filter(e => e.selected).length;
  const allTags = [...new Set(parsedEndpoints.flatMap(e => e.tags || []))];

  // Working Swagger URL examples
  const exampleUrls = [
    {
      url: 'https://petstore.swagger.io/v2/swagger.json',
      description: 'Petstore API (Swagger 2.0)',
      status: 'working'
    },
    {
      url: 'https://api.apis.guru/v2/specs/petstore.swagger.io/1.0.0/swagger.json',
      description: 'Petstore via APIs.guru',
      status: 'working'
    },
    {
      url: 'https://api.apis.guru/v2/specs/httpbin.org/0.9.2/swagger.json',
      description: 'HTTPBin API',
      status: 'working'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
              <Zap className="w-6 h-6 text-purple-600" />
              <span>Swagger/OpenAPI Parser</span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Upload a complete Swagger/OpenAPI file with API endpoints to generate individual specifications
            </p>
          </div>
        </div>

        {/* Important Notice */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Important: File Requirements</p>
              <ul className="space-y-1 text-xs list-disc list-inside">
                <li><strong>Swagger/OpenAPI files only:</strong> This parser requires complete API specifications with endpoints</li>
                <li><strong>Must contain "paths":</strong> The file must define actual API endpoints, not just schema definitions</li>
                <li><strong>JSON format only:</strong> YAML files are not currently supported</li>
                <li><strong>Component-only files won't work:</strong> Files with only schema components but no paths won't work</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Input Method Selection */}
        <div className="mb-6">
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setInputMethod('file')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                inputMethod === 'file'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload File</span>
            </button>
            <button
              onClick={() => setInputMethod('url')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                inputMethod === 'url'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Fetch from URL</span>
            </button>
          </div>

          {/* File Upload */}
          {inputMethod === 'file' && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-700">
                  Upload Swagger/OpenAPI File
                </p>
                <p className="text-sm text-gray-500">
                  Supports complete Swagger 2.0 and OpenAPI 3.0+ JSON files with API endpoints
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="swagger-upload"
                />
                <label
                  htmlFor="swagger-upload"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Choose File
                </label>
              </div>
            </div>
          )}

          {/* URL Input */}
          {inputMethod === 'url' && (
            <div className="space-y-4">
              <div className="border border-gray-300 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Link className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-medium text-gray-800">
                    Fetch Swagger/OpenAPI from URL
                  </h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Swagger/OpenAPI URL (JSON format only)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="url"
                        value={swaggerUrl}
                        onChange={(e) => {
                          setSwaggerUrl(e.target.value);
                          setUrlError('');
                        }}
                        placeholder="https://petstore.swagger.io/v2/swagger.json"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleUrlSubmit}
                        disabled={loading || !swaggerUrl.trim()}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                      >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                        <span>Fetch</span>
                      </button>
                    </div>
                  </div>

                  {urlError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                        <div className="text-sm text-red-800">
                          <p className="font-medium mb-1">Failed to Load URL</p>
                          <p>{urlError}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Working Example URLs */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center space-x-1">
                      <CheckSquare className="w-4 h-4" />
                      <span>Working Example URLs:</span>
                    </h4>
                    <div className="space-y-2">
                      {exampleUrls.map((example, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <button
                            onClick={() => setSwaggerUrl(example.url)}
                            className="text-xs text-green-600 hover:text-green-800 hover:underline text-left flex-1"
                          >
                            {example.description}
                          </button>
                          <a
                            href={example.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-green-600 hover:text-green-800"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Common Issues */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Common Issues & Solutions:</h4>
                    <ul className="space-y-1 text-xs text-blue-700 list-disc list-inside">
                      <li><strong>404 Not Found:</strong> Verify the URL is correct and the resource exists</li>
                      <li><strong>YAML files:</strong> Convert to JSON format first (YAML not supported)</li>
                      <li><strong>GitHub URLs:</strong> Use raw.githubusercontent.com for direct file access</li>
                      <li><strong>CORS issues:</strong> Some APIs may block browser requests</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {selectedFile && (
            <div className="mt-3 p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-800">
                <strong>Source:</strong> {selectedFile}
              </p>
            </div>
          )}
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="mt-2 text-gray-600">
              {inputMethod === 'url' ? 'Fetching and parsing Swagger file...' : 'Parsing Swagger file...'}
            </p>
          </div>
        )}

        {/* Parse Error Display */}
        {parseError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Unable to Parse File</p>
                <p>{parseError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Parsed Endpoints */}
        {parsedEndpoints.length > 0 && (
          <div className="space-y-6">
            {/* Summary and Controls */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800">
                    Found {parsedEndpoints.length} API Endpoints
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedCount} selected for generation
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                  >
                    {parsedEndpoints.every(e => e.selected) ? (
                      <Square className="w-4 h-4" />
                    ) : (
                      <CheckSquare className="w-4 h-4" />
                    )}
                    <span>Toggle All</span>
                  </button>
                  <button
                    onClick={generateSelectedSpecs}
                    disabled={selectedCount === 0}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Generate {selectedCount} Specs</span>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Filter by Tag
                  </label>
                  <select
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">All Tags</option>
                    {allTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Filter by Method
                  </label>
                  <select
                    value={filterMethod}
                    onChange={(e) => setFilterMethod(e.target.value)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">All Methods</option>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Endpoints List */}
            <div className="space-y-3">
              {filteredEndpoints.map((endpoint) => (
                <div
                  key={endpoint.id}
                  className={`border rounded-lg p-4 transition-all ${
                    endpoint.selected 
                      ? 'border-purple-300 bg-purple-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <button
                        onClick={() => toggleEndpointSelection(endpoint.id)}
                        className="mt-1"
                      >
                        {endpoint.selected ? (
                          <CheckSquare className="w-5 h-5 text-purple-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            getMethodColor(endpoint.method)
                          }`}>
                            {endpoint.method}
                          </span>
                          <code className="text-sm font-mono text-gray-800">
                            {endpoint.path}
                          </code>
                          {endpoint.tags && endpoint.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {endpoint.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {endpoint.summary && (
                          <p className="text-sm font-medium text-gray-800 mb-1">
                            {endpoint.summary}
                          </p>
                        )}
                        
                        {endpoint.description && (
                          <p className="text-xs text-gray-600">
                            {endpoint.description}
                          </p>
                        )}
                        
                        <div className="mt-2 text-xs text-gray-500">
                          <span>Responses: {Object.keys(endpoint.responses).join(', ')}</span>
                          {endpoint.parameters && (
                            <span className="ml-4">
                              Parameters: {endpoint.parameters.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => previewSpec(endpoint)}
                      className="ml-4 p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                      title="Preview generated spec"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredEndpoints.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>No endpoints match the current filters</p>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How it works:</p>
              <ol className="space-y-1 text-xs list-decimal list-inside">
                <li>Upload a complete Swagger/OpenAPI file or fetch from a URL containing multiple API endpoint definitions</li>
                <li>The system validates the file format and extracts all available endpoints from the "paths" section</li>
                <li>Review and select which endpoints you want to generate individual specs for</li>
                <li>Each selected endpoint will be converted to a standalone OpenAPI 3.0 specification</li>
                <li>Generated specs include only the relevant schemas and components for that endpoint</li>
                <li>Use the generated specs individually in the main testing tool</li>
              </ol>
              <p className="font-medium mt-2 mb-1">File Requirements:</p>
              <ul className="space-y-1 text-xs list-disc list-inside">
                <li>Must be a valid Swagger 2.0 or OpenAPI 3.0+ specification</li>
                <li>Must contain a "paths" section with actual API endpoint definitions</li>
                <li>JSON format only (YAML files need to be converted first)</li>
                <li>The file should define complete API operations, not just data schemas</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium text-gray-800">Generated OpenAPI Spec Preview</h3>
              <button
                onClick={() => setShowPreview('')}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <pre className="text-xs font-mono bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
                {showPreview}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    'GET': 'bg-green-100 text-green-800',
    'POST': 'bg-blue-100 text-blue-800',
    'PUT': 'bg-yellow-100 text-yellow-800',
    'DELETE': 'bg-red-100 text-red-800',
    'PATCH': 'bg-purple-100 text-purple-800',
    'HEAD': 'bg-gray-100 text-gray-800',
    'OPTIONS': 'bg-gray-100 text-gray-800'
  };
  return colors[method] || 'bg-gray-100 text-gray-800';
}

export default SwaggerParser;