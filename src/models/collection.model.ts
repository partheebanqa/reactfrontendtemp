export interface ExtendedRequest {
  id: string;
  method: string;
  name: string;
  url: string;
  endpoint?: string;
  description?: string;
  testCases: {
    functional: number;
    total: number;
  };
}

export interface TransformedCollection {
  id: string;
  name: string;
  requestCount: number;
  requests: ExtendedRequest[];
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
}
