import { v4 as uuidv4 } from 'uuid';
import { Collection, CollectionRequest, ImportResult } from '../../types';

interface PostmanCollection {
  info: {
    _postman_id?: string;
    name: string;
    description?: string;
    schema: string;
  };
  item: PostmanItem[];
}

interface PostmanItem {
  name: string;
  request: {
    method: string;
    url: {
      raw: string;
      protocol?: string;
      host?: string[];
      path?: string[];
      query?: Array<{ key: string; value: string }>;
    };
    header?: Array<{ key: string; value: string }>;
    body?: {
      mode: string;
      raw?: string;
      urlencoded?: Array<{ key: string; value: string }>;
      formdata?: Array<{ key: string; value: string; type: string }>;
    };
  };
  response?: any[];
}

export async function importPostmanCollection(json: any): Promise<ImportResult> {
  try {
    const collection = json as PostmanCollection;
    
    if (!collection.info?.schema?.includes('schema.getpostman.com')) {
      throw new Error('Invalid Postman collection format');
    }

    const result: Collection = {
      id: "",
      name: collection.info.name,
      requests: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      workspaceId: '',
      deletedAt: ''
    };

    // Convert Postman items to our format
    collection.item.forEach(item => {
      const request: CollectionRequest = {
        id: uuidv4(),
        name: item.name,
        url: item.request.url.raw,
        headers: item.request.header?.map((h: any) => ({
          key: h.key,
          value: h.value
        })) || [],
        params: item.request.url.query?.map((q: any) => ({
          key: q.key,
          value: q.value,
        })) || [],
        // request: {
        //   method: item.request.method,
        //   url: item.request.url.raw,
        //   headers: item.request.header?.reduce((acc, h) => ({
        //     ...acc,
        //     [h.key]: h.value
        //   }), {}) || {},
        //   params: item.request.url.query?.reduce((acc, q) => ({
        //     ...acc,
        //     [q.key]: q.value
        //   }), {}) || {},
        //   body: item.request.body?.raw || ''
        // },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        collectionId: '',
        description: '',
        order: 0,
        method: item.request.method,
        bodyType: '',
        bodyFormData: item.request.body?.raw || '',
        authorizationType: '',
        authorization: {
          token: undefined,
          username: undefined,
          password: undefined,
          key: undefined,
          value: undefined,
          addTo: undefined
        },
        variables: {},
        createdBy: ''
      };

      result.requests.push(request);
    });

    return { collections: [result] };
  } catch (error) {
    throw new Error(`Failed to import Postman collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}