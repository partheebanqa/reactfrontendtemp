// Existing types...

export type TokenType = 'bearer' | 'basic' | 'apiKey';
export type DataType = 'string' | 'number' | 'date' | 'array' | 'json';
export type ExtractionSource = 'body' | 'headers';

export interface AuthToken {
  id: string;
  name: string;
  type: TokenType;
  value: string;
  source?: {
    requestId: string;
    extractionPath: string;
  };
  createdAt: string;
  expiresAt?: string;
}

export interface TokenExtraction {
  id: string;
  name: string;
  type: TokenType;
  source: ExtractionSource;
  path: string;
  headerName?: string;
  prefix?: string;
}

export interface Extraction {
  id: string;
  name: string;
  source: ExtractionSource;
  path: string;
  type: 'value' | 'token' | 'refreshToken';
  variableName: string;
}

export interface E2EStep {
  id: string;
  name: string;
  requestId: string;
  order: number;
  extractions: Extraction[];
  dependencies: string[];
}

export interface E2ETest {
  id: string;
  name: string;
  description?: string;
  domain?: string;
  isImportant: boolean;
  steps: E2EStep[];
  createdAt: string;
  updatedAt: string;
  lastRun?: {
    status: 'success' | 'failure' | 'partial';
    timestamp: string;
    results: any[];
  };
}

export interface DataVariable {
  id: string;
  name: string;
  type: string;
  value: string;
}

// Update existing ApiRequest interface
export interface ApiRequest {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: Record<string, string>;
  params: Record<string, string>;
  body: string;
  category?: string;
  authToken?: string;
}

export interface StaticVariable{
  name: string,
  workspaceId: string,
  type: string,
  category: string,
  value: any
}
