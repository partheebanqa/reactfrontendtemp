import { ExtractedVariable } from '@/shared/types/requestChain.model';

export interface ExtendedRequest {
  description?: string;
  id: string;
  name?: string;
  method?: string;
  url?: string;
  endpoint?: string;
  params?: {
    id?: string;
    key?: string;
    value?: string;
    enabled?: boolean;
  }[];
  queryParams?: { key: string; value: string }[];
  headers?: {
    id?: string;
    key?: string;
    value?: string;
    enabled?: boolean;
  }[];
  body?: any;
  bodyRawContent?: string;
  bodyType?: string;
  authorizationType?: 'none' | 'bearer' | 'basic' | 'apikey' | 'oauth2';
  authorization?: {
    token?: string;
    username?: string;
    password?: string;
    key?: string;
    value?: string;
    addTo?: 'header' | 'query';
  };
  testCases?: { functional: number; total: number };
  folderName?: string;
  timeout?: number;
  retries?: number;
  errorHandling?: 'stop' | 'continue';
  extractVariables?: any[];
  testScripts?: any[];
  enabled?: boolean;
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
  preRequestId?: string;

  requests: {
    id: string;
    method: string;
    name: string;
    url: string;
    description?: string;
  }[];
}

export interface CollectionsResponse {
  flatMap(arg0: (collection: any) => any): any;
  collections: Collection[];
}

export interface CreateTestSuitePayload {
  name: string;
  description?: string;
  requestIds: string[];
  environmentId?: string;
  workspaceId?: string;
  preRequestId?: string;
  extractedVariables?: ExtractedVariable[];
}
