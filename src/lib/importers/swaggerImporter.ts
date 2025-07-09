import { v4 as uuidv4 } from 'uuid';
import { Collection, CollectionRequest, ImportResult } from '../../types';
import { OpenAPI } from 'openapi-types';

export async function importSwaggerCollection(spec: string): Promise<ImportResult> {
  try {
    // Parse the spec
    let parsedSpec: any;
    try {
      parsedSpec = JSON.parse(spec);
    } catch {
      // If not JSON, try YAML
      try {
        // For YAML support, you'd need to add a YAML parser library
        throw new Error('YAML format not supported yet');
      } catch {
        throw new Error('Invalid specification format');
      }
    }

    // Basic validation of the spec
    if (!parsedSpec.swagger && !parsedSpec.openapi) {
      throw new Error('Invalid OpenAPI/Swagger specification');
    }

    const collection: Collection = {
      id: uuidv4(),
      name: parsedSpec.info?.title || 'Imported API',
      description: parsedSpec.info?.description,
      folders: [],
      requests: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      changelog: [{
        id: uuidv4(),
        action: 'create',
        itemType: 'collection',
        itemId: uuidv4(),
        itemName: parsedSpec.info?.title || 'Imported API',
        timestamp: new Date().toISOString(),
        details: 'Imported from OpenAPI specification'
      }]
    };

    // Get base URL from servers (OpenAPI 3) or host+basePath (Swagger 2)
    let baseUrl = '';
    if (parsedSpec.servers && parsedSpec.servers[0]) {
      baseUrl = parsedSpec.servers[0].url;
    } else if (parsedSpec.host) {
      baseUrl = `${parsedSpec.schemes?.[0] || 'https'}://${parsedSpec.host}${parsedSpec.basePath || ''}`;
    }

    // Convert paths to requests
    Object.entries(parsedSpec.paths || {}).forEach(([path, pathItem]: [string, any]) => {
      Object.entries(pathItem || {}).forEach(([method, operation]: [string, any]) => {
        if (method === '$ref' || !operation) return;
        if (!['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method)) return;

        const request: CollectionRequest = {
          id: uuidv4(),
          name: operation.summary || operation.operationId || `${method.toUpperCase()} ${path}`,
          description: operation.description,
          request: {
            method: method.toUpperCase(),
            url: `${baseUrl}${path}`,
            headers: {},
            params: {},
            body: ''
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Add parameters as query params or headers
        if (operation.parameters) {
          operation.parameters.forEach((param: any) => {
            if (param.in === 'query') {
              request.request.params[param.name] = '';
            } else if (param.in === 'header') {
              request.request.headers[param.name] = '';
            }
          });
        }

        // Add request body if available (OpenAPI 3)
        if (operation.requestBody?.content?.['application/json']?.schema) {
          request.request.headers['Content-Type'] = 'application/json';
          request.request.body = '{}'; // Default empty JSON object
        }
        // Add body parameter (Swagger 2)
        else if (operation.parameters?.some((p: any) => p.in === 'body')) {
          request.request.headers['Content-Type'] = 'application/json';
          request.request.body = '{}';
        }

        collection.requests.push(request);
      });
    });

    return { collections: [collection] };
  } catch (error) {
    throw new Error(`Failed to import OpenAPI specification: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}