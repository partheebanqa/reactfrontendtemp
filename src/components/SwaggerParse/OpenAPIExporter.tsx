import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, Search, FileText, Globe, AlertCircle, CheckCircle2, Copy, ExternalLink, Eye, Upload } from 'lucide-react'
import FileUploader from './FileUploader'
import SpecViewer from './SpecViewer'
import * as yaml from 'js-yaml';
import BreadCum from '../BreadCum/Breadcum'
import { useToast } from '@/hooks/useToast'



interface APIEndpoint {
  path: string
  method: string
  summary?: string
  description?: string
  operationId?: string
  tags?: string[]
  parameters?: any[]
  responses?: any
  requestBody?: any
}

interface ParsedSpec {
  info: {
    title: string
    version: string
    description?: string
  }
  servers?: Array<{ url: string; description?: string }>
  endpoints: APIEndpoint[]
  originalSpec: any
}

const methodColors = {
  get: 'bg-green-100 text-green-800 border-green-200',
  post: 'bg-blue-100 text-blue-800 border-blue-200',
  put: 'bg-orange-100 text-orange-800 border-orange-200',
  patch: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  delete: 'bg-red-100 text-red-800 border-red-200',
  head: 'bg-purple-100 text-purple-800 border-purple-200',
  options: 'bg-gray-100 text-gray-800 border-gray-200'
}

// Helper function to transform Swagger 2.0 parameters to OpenAPI 3.x format
const transformParameter = (param: any): any => {
  if (!param || typeof param !== 'object') {
    return param
  }

  // If parameter already has schema, return as-is (already OpenAPI 3.x format)
  if (param.schema) {
    return param
  }

  // Transform Swagger 2.0 parameter to OpenAPI 3.x
  let transformed = { ...param }

  // Move type, format, enum, etc. into schema object
  if (param.type || param.format || param.enum || param.items) {
    transformed.schema = {}

    if (param.type) {
      transformed.schema.type = param.type
      delete transformed.type
    }

    if (param.format) {
      transformed.schema.format = param.format
      delete transformed.format
    }

    if (param.enum) {
      transformed.schema.enum = param.enum
      delete transformed.enum
    }

    if (param.items) {
      transformed.schema.items = transformReferences(param.items)
      delete transformed.items
    }

    if (param.minimum !== undefined) {
      transformed.schema.minimum = param.minimum
      delete transformed.minimum
    }

    if (param.maximum !== undefined) {
      transformed.schema.maximum = param.maximum
      delete transformed.maximum
    }

    if (param.minLength !== undefined) {
      transformed.schema.minLength = param.minLength
      delete transformed.minLength
    }

    if (param.maxLength !== undefined) {
      transformed.schema.maxLength = param.maxLength
      delete transformed.maxLength
    }

    if (param.pattern) {
      transformed.schema.pattern = param.pattern
      delete transformed.pattern
    }
  }

  // Transform any remaining references
  transformed = transformReferences(transformed)

  return transformed
}

// Helper function to transform $ref from Swagger 2.0 to OpenAPI 3.x
const transformReferences = (obj: any): any => {
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(transformReferences)
  }

  const transformed: any = {}

  for (const [key, value] of Object.entries(obj)) {
    if (key === '$ref' && typeof value === 'string') {
      // Transform all types of Swagger 2.0 references to OpenAPI 3.x
      if (value.startsWith('#/definitions/')) {
        transformed[key] = value.replace('#/definitions/', '#/components/schemas/')
      } else if (value.startsWith('#/parameters/')) {
        transformed[key] = value.replace('#/parameters/', '#/components/parameters/')
      } else if (value.startsWith('#/responses/')) {
        transformed[key] = value.replace('#/responses/', '#/components/responses/')
      } else {
        // Keep other references as-is
        transformed[key] = value
      }
    } else if (value !== null && typeof value === 'object') {
      // Recursively transform nested objects and arrays
      transformed[key] = transformReferences(value)
    } else {
      transformed[key] = value
    }
  }

  return transformed
}

// Helper function to transform responses from Swagger 2.0 to OpenAPI 3.x
const transformResponse = (response: any): any => {
  if (!response || typeof response !== 'object') {
    return response
  }

  let transformed = { ...response }

  // Transform schema to content for OpenAPI 3.x
  if (response.schema && !response.content) {
    transformed.content = {
      'application/json': {
        schema: transformReferences(response.schema)
      }
    }
    delete transformed.schema
  }

  // Transform any remaining references
  transformed = transformReferences(transformed)

  return transformed
}

// Helper function to validate and clean components
const validateAndCleanComponents = (components: any): any => {
  if (!components || typeof components !== 'object') {
    return {}
  }

  const cleanedComponents: any = {}

  // Clean schemas
  if (components.schemas && typeof components.schemas === 'object') {
    cleanedComponents.schemas = {}
    Object.entries(components.schemas).forEach(([key, schema]) => {
      if (schema && typeof schema === 'object') {
        // Transform all references within the schema
        cleanedComponents.schemas[key] = transformReferences(schema)
      }
    })
  }

  // Handle Swagger 2.0 definitions -> OpenAPI 3.x schemas
  if (components.definitions && typeof components.definitions === 'object') {
    if (!cleanedComponents.schemas) {
      cleanedComponents.schemas = {}
    }
    Object.entries(components.definitions).forEach(([key, schema]) => {
      if (schema && typeof schema === 'object') {
        // Transform all references within the schema
        cleanedComponents.schemas[key] = transformReferences(schema)
      }
    })
  }

  // Clean other component types and transform their references
  const componentTypes = ['responses', 'parameters', 'examples', 'requestBodies', 'headers', 'securitySchemes', 'links', 'callbacks']
  componentTypes.forEach(type => {
    if (components[type] && typeof components[type] === 'object') {
      cleanedComponents[type] = transformReferences(components[type])
    }
  })

  return cleanedComponents
}

export default function OpenAPIExporter() {
  const [specUrl, setSpecUrl] = useState('')
  const [parsedSpec, setParsedSpec] = useState<ParsedSpec | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<string>('all')
  const [exportFormat, setExportFormat] = useState<'json' | 'yaml'>('json')
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null)
  const [inputMethod, setInputMethod] = useState<'url' | 'upload'>('url')

  const handleSpecParsed = (spec: any) => {
    processSpec(spec)
  }

  const { toast } = useToast();

  const processSpec = (spec: any) => {
    try {
      // Validate basic OpenAPI structure
      if (!spec.openapi && !spec.swagger) {
        throw new Error('Invalid OpenAPI/Swagger specification: missing version field')
      }

      if (!spec.info) {
        throw new Error('Invalid OpenAPI/Swagger specification: missing info object')
      }

      if (!spec.paths) {
        throw new Error('Invalid OpenAPI/Swagger specification: missing paths object')
      }

      // Validate components structure if present
      if (spec.components) {
        if (typeof spec.components !== 'object') {
          throw new Error('Invalid OpenAPI specification: components must be an object')
        }

        // Validate schemas structure
        if (spec.components.schemas && typeof spec.components.schemas !== 'object') {
          throw new Error('Invalid OpenAPI specification: components.schemas must be an object')
        }
      }

      const endpoints: APIEndpoint[] = []

      if (spec.paths) {
        Object.entries(spec.paths).forEach(([path, pathItem]: [string, any]) => {
          if (pathItem && typeof pathItem === 'object') {
            Object.entries(pathItem).forEach(([method, operation]: [string, any]) => {
              if (['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method.toLowerCase())) {
                endpoints.push({
                  path,
                  method: method.toLowerCase(),
                  summary: operation?.summary,
                  description: operation?.description,
                  operationId: operation?.operationId,
                  tags: operation?.tags,
                  parameters: operation?.parameters,
                  responses: operation?.responses,
                  requestBody: operation?.requestBody
                })
              }
            })
          }
        })
      }

      setParsedSpec({
        info: spec.info || { title: 'Unknown API', version: '1.0.0' },
        servers: spec.servers,
        endpoints,
        originalSpec: spec
      })

      // Provide feedback about components
      const componentsInfo = []
      if (spec.components?.schemas) {
        const schemaCount = Object.keys(spec.components.schemas).length
        componentsInfo.push(`${schemaCount} schema${schemaCount !== 1 ? 's' : ''}`)
      }
      if (spec.components?.responses) {
        const responseCount = Object.keys(spec.components.responses).length
        componentsInfo.push(`${responseCount} response${responseCount !== 1 ? 's' : ''}`)
      }

      const componentsText = componentsInfo.length > 0 ? ` with ${componentsInfo.join(', ')}` : ''
      toast({
        title: 'Success',
        description: `Successfully parsed ${endpoints.length} endpoints${componentsText}`,
        variant: 'success',
      });
    } catch (error) {
      console.error('Error processing spec:', error)
      toast({
        title: 'Failed',
        description: `Failed to process OpenAPI spec: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'error',
      });
    }
  }

  const parseSpec = async () => {
    if (!specUrl.trim()) {

      toast({
        title: 'Failed',
        description: 'Please enter a valid OpenAPI/Swagger URL',
        variant: 'error',
      });
      return
    }

    setLoading(true)
    try {
      // Fetch the spec directly
      const response = await fetch(specUrl)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type') || ''
      let spec: any

      if (contentType.includes('application/json') || specUrl.includes('.json')) {
        spec = await response.json()
      } else {
        // Try to parse as YAML
        const text = await response.text()
        try {
          spec = yaml.load(text)
        } catch (yamlError) {
          // If YAML parsing fails, try JSON
          spec = JSON.parse(text)
        }
      }

      processSpec(spec)
    } catch (error) {
      console.error('Error parsing spec:', error)

      toast({
        title: 'Failed',
        description: `Failed to parse OpenAPI spec: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'error',
      });
    } finally {
      setLoading(false)
    }
  }

  const downloadEndpoint = (endpoint: APIEndpoint) => {
    // Create a complete spec with all necessary components
    const originalSpec = parsedSpec?.originalSpec
    const cleanedComponents = validateAndCleanComponents(originalSpec?.components || originalSpec?.definitions ? {
      ...originalSpec.components,
      definitions: originalSpec.definitions
    } : {})

    // Transform parameters from Swagger 2.0 to OpenAPI 3.x format
    const transformedParameters = endpoint.parameters?.map(transformParameter)

    // Transform responses from Swagger 2.0 to OpenAPI 3.x format
    const transformedResponses = endpoint.responses ?
      Object.fromEntries(
        Object.entries(endpoint.responses).map(([code, response]) => [
          code,
          transformResponse(response)
        ])
      ) : undefined

    // Transform the request body if it exists
    const transformedRequestBody = endpoint.requestBody ? transformReferences(endpoint.requestBody) : undefined

    const endpointSpec = {
      openapi: '3.0.0', // Always use OpenAPI 3.0.0 for output
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
            requestBody: transformedRequestBody
          }
        }
      },
      // Include validated and cleaned components to resolve references
      ...(Object.keys(cleanedComponents).length > 0 && { components: cleanedComponents })
    }

    const content = exportFormat === 'json'
      ? JSON.stringify(endpointSpec, null, 2)
      : yaml.dump(endpointSpec)

    const blob = new Blob([content], {
      type: exportFormat === 'json' ? 'application/json' : 'application/x-yaml'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${endpoint.operationId || `${endpoint.method}-${endpoint.path.replace(/\//g, '-')}`}.${exportFormat}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: 'Downloaded',
      description: `Downloaded ${endpoint.method.toUpperCase()} ${endpoint.path}`,
      variant: 'success',
    });
  }

  const downloadFullSpec = () => {
    if (!parsedSpec) return

    const content = exportFormat === 'json'
      ? JSON.stringify(parsedSpec.originalSpec, null, 2)
      : yaml.dump(parsedSpec.originalSpec)

    const blob = new Blob([content], {
      type: exportFormat === 'json' ? 'application/json' : 'application/x-yaml'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${parsedSpec.info.title.replace(/\s+/g, '-').toLowerCase()}-spec.${exportFormat}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: 'Downloaded',
      description: 'Downloaded complete OpenAPI specification',
      variant: 'success',
    });
  }

  const copyToClipboard = async (endpoint: APIEndpoint) => {
    // Create a complete spec with all necessary components
    const originalSpec = parsedSpec?.originalSpec
    const cleanedComponents = validateAndCleanComponents(originalSpec?.components || originalSpec?.definitions ? {
      ...originalSpec.components,
      definitions: originalSpec.definitions
    } : {})

    // Transform parameters from Swagger 2.0 to OpenAPI 3.x format
    const transformedParameters = endpoint.parameters?.map(transformParameter)

    // Transform responses from Swagger 2.0 to OpenAPI 3.x format
    const transformedResponses = endpoint.responses ?
      Object.fromEntries(
        Object.entries(endpoint.responses).map(([code, response]) => [
          code,
          transformResponse(response)
        ])
      ) : undefined

    // Transform the request body if it exists
    const transformedRequestBody = endpoint.requestBody ? transformReferences(endpoint.requestBody) : undefined

    const endpointSpec = {
      openapi: '3.0.0', // Always use OpenAPI 3.0.0 for output
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
            requestBody: transformedRequestBody
          }
        }
      },
      // Include validated and cleaned components to resolve references
      ...(Object.keys(cleanedComponents).length > 0 && { components: cleanedComponents })
    }

    const content = exportFormat === 'json'
      ? JSON.stringify(endpointSpec, null, 2)
      : yaml.dump(endpointSpec)

    try {
      await navigator.clipboard.writeText(content)
      toast({
        title: 'Copied',
        description: 'Copied to clipboard!',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Failed Copied',
        description: 'Failed to copy to clipboard!',
        variant: 'error',
      });
    }
  }

  const filteredEndpoints = parsedSpec?.endpoints.filter(endpoint => {
    const matchesSearch = !searchTerm ||
      endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesMethod = selectedMethod === 'all' || endpoint.method === selectedMethod

    return matchesSearch && matchesMethod
  }) || []

  const uniqueMethods = [...new Set(parsedSpec?.endpoints.map(e => e.method) || [])]

  return (
    <div>
      <BreadCum
        title="OpenAPI Spec Exporter"
        subtitle="Parse OpenAPI/Swagger specifications and export individual endpoints for documentation or integration"
        showCreateButton={false}
        buttonTitle="Run Execution"
        onClickCreateNew={() => console.log("Create execution")}
        icon={FileText}
        iconBgClass="bg-orange-100"
        iconColor="#f97316"
        iconSize={40}
      />
      <div className="max-w-7xl mx-auto ">



        {/* Input Section */}
        <Card className="border border-gray-200 bg-background rounded-lg mt-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {/* <FileText className="h-5 w-5 text-blue-600" /> */}
              Import OpenAPI Specification
            </CardTitle>
            <CardDescription>
              Import your OpenAPI/Swagger specification from URL or upload a local file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={inputMethod} onValueChange={(value: string) => setInputMethod(value as 'url' | 'upload')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  From URL
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload File
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="https://api.example.com/openapi.json"
                    value={specUrl}
                    onChange={(e) => setSpecUrl(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && parseSpec()}
                  />
                  <Button
                    onClick={parseSpec}
                    disabled={loading}
                    className="bg-[#136fb0] hover:bg-bg-[#136fb0]"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-white/20" />
                    ) : (
                      'Parse Spec'
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="upload">
                <FileUploader
                  onSpecParsed={handleSpecParsed}
                  loading={loading}
                  setLoading={setLoading}
                />
              </TabsContent>
            </Tabs>

            {parsedSpec && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                <CheckCircle2 className="h-4 w-4" />
                Successfully parsed {parsedSpec.endpoints.length} endpoints from {parsedSpec.info.title} v{parsedSpec.info.version}
              </div>
            )}
          </CardContent>
        </Card>

        {parsedSpec && (
          <>
            {/* API Info */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>{parsedSpec.info.title}</CardTitle>
                <CardDescription>
                  Version {parsedSpec.info.version}
                  {parsedSpec.info.description && ` • ${parsedSpec.info.description}`}
                </CardDescription>
              </CardHeader>
              {parsedSpec.servers && parsedSpec.servers.length > 0 && (
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">Base URLs:</h4>
                    {parsedSpec.servers.map((server, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">{server.url}</code>
                        {server.description && <span className="text-gray-500">• {server.description}</span>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Controls */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex flex-col sm:flex-row gap-3 flex-1">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search endpoints..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="All methods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All methods</SelectItem>
                        {uniqueMethods.map(method => (
                          <SelectItem key={method} value={method}>
                            {method.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-3">
                    <Select value={exportFormat} onValueChange={(value: 'json' | 'yaml') => setExportFormat(value)}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="yaml">YAML</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={downloadFullSpec}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Full Spec
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Endpoints Grid */}
            <div className="grid gap-4">
              {filteredEndpoints.length === 0 ? (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No endpoints found</h3>
                      <p className="text-gray-500">
                        {searchTerm || selectedMethod !== 'all'
                          ? 'Try adjusting your search or filter criteria'
                          : 'The specification doesn\'t contain any API endpoints'
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredEndpoints.map((endpoint, index) => (
                  <Card key={index} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`font-mono text-xs px-2 py-1 ${methodColors[endpoint.method as keyof typeof methodColors] || 'bg-gray-100 text-gray-800'}`}
                            >
                              {endpoint.method.toUpperCase()}
                            </Badge>
                            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                              {endpoint.path}
                            </code>
                          </div>

                          {endpoint.summary && (
                            <h3 className="font-semibold text-gray-900">{endpoint.summary}</h3>
                          )}

                          {endpoint.description && (
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {endpoint.description}
                            </p>
                          )}

                          {endpoint.tags && endpoint.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {endpoint.tags.map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedEndpoint(endpoint)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(endpoint)}
                            className="flex items-center gap-1"
                          >
                            <Copy className="h-3 w-3" />
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => downloadEndpoint(endpoint)}
                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
                          >
                            <Download className="h-3 w-3" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {filteredEndpoints.length > 0 && (
              <div className="text-center text-sm text-gray-500">
                Showing {filteredEndpoints.length} of {parsedSpec.endpoints.length} endpoints
              </div>
            )}
          </>
        )}

        {/* Spec Viewer Modal */}
        {selectedEndpoint && parsedSpec && (
          <SpecViewer
            endpoint={selectedEndpoint}
            parsedSpec={parsedSpec}
            exportFormat={exportFormat}
            onClose={() => setSelectedEndpoint(null)}
          />
        )}
      </div>
    </div>
  )
}