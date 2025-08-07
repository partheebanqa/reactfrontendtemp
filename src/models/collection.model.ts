export interface ExtendedRequest {
  description: string;
  id: string;
  name: string;
  method: string;
  url: string;
  endpoint: string;
  queryParams?: { key: string; value: string }[];
  headers?: any[];
  body?: any;
  testCases: { functional: number; total: number };
  folderName?: string;
}

export interface TransformedCollection {
  id: string;
  name: string;
  requestCount: number;
  requests: ExtendedRequest[];
  description?: string;
}

export interface Collection {
  collectionId: string;
  collectionName: string;
  requests: {
    id: string;
    method: string;
    name: string;
    url: string;
    description?: string;
  }[];
}

export interface CollectionsResponse {
  collections: Collection[];
}

export interface CreateTestSuitePayload {
  name: string;
  description?: string;
  requestIds: string[];
  environmentId?: string;
}
