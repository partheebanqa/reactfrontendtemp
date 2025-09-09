import { DocumentNode } from 'graphql';
import { Header, Param } from './request';

export interface Response {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  error?: string;
  errorDetails?: {
    code?: string;
    message?: string;
    details?: any;
    type?: string;
  };
  assertions?: AssertionResults;
}

export interface ChainResponse extends Response {
  requestId: string;
  responseTime?: number;
  extractedAuth?: {
    token?: string;
    headerValue?: string;
  };
}

export interface ResponseAssertions {
  status?: number;
  responseTime?: number;
  headers?: Record<string, string>;
  body?: BodyAssertion[];
}

export interface BodyAssertion {
  path: string;
  operator: AssertionOperator;
  value: any;
}

export type AssertionOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'exists'
  | 'notExists'
  | 'greaterThan'
  | 'lessThan'
  | 'matches';

export interface AssertionResults {
  passed: boolean;
  details: {
    status?: boolean;
    responseTime?: boolean;
    headers?: Record<string, boolean>;
    body?: Record<string, boolean>;
  };
  failureMessages: string[];
}

export interface VariableState {
  requestId: string;
  path: string;
  isSelecting: boolean;
  name: string;
  isValid?: boolean;
}

export interface AuthExtractionState {
  requestId: string;
  tokenPath: string;
  headerName: string;
  isSelectingPath: boolean;
}

export interface KeyValuePair {
  key: string;
  value: string;
  enabled?: boolean;
}

export type DataVariableType =
  | 'string'
  | 'number'
  | 'singleDigit'
  | 'boolean'
  | 'object'
  | 'firstName'
  | 'lastName'
  | 'fullName'
  | 'email'
  | 'emailWithDomain'
  | 'staticPassword'
  | 'dynamicPassword'
  | 'phoneNumber'
  | 'date'
  | 'pastDate'
  | 'futureDate'
  | 'city'
  | 'state'
  | 'country'
  | 'countryCode'
  | 'zipCode'
  | 'uuid'
  | 'color'
  | 'url'
  | 'ipv4'
  | 'ipv6'
  | 'alphanumeric';

export interface DataVariable {
  name: string;
  type: DataVariableType;
  value: string;
  isDynamic?: boolean;
  config?: {
    emailDomain?: string;
    passwordLength?: number;
    specialChars?: string;
    staticValue?: string;
  };
}

export interface GraphQLValidationResult {
  isValid: boolean;
  error?: string;
  ast?: DocumentNode;
}

export interface Collection {
  id: string;
  workspaceId: string;
  name: string;
  isImportant?: boolean;
  variables?: string;
  requests: CollectionRequest[];
  hasFetchedRequests?: boolean;
  createdAt: string;
  deletedAt: string;
  updatedAt: string;
}

export interface CollectionFolder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  requests: CollectionRequest[];
  // folders: CollectionFolder[];
}

export interface CollectionRequest {
  assertions: boolean;
  id?: string;
  collectionId?: string;
  description?: string;
  name?: string;
  order: number;
  method: string;
  url: string;
  bodyType: string;
  bodyFormData: string | null;
  bodyRawContent?: string | null;
  authorizationType: string;
  authorization: {
    token?: string; // bearer
    username?: string; // basic
    password?: string; // basic
    key?: string; // apiKey
    value?: string; // apiKey
    addTo?: 'header' | 'query'; // apiKey
  };
  headers?: Header[];
  params?: Param[];
  variables: Record<string, any>;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChangelogEntry {
  id: string;
  action: 'create' | 'update' | 'delete' | 'move';
  itemType: 'collection' | 'folder' | 'request';
  itemId: string;
  itemName: string;
  timestamp: string;
  details?: string;
}

export interface ImportResult {
  collections: Collection[];
  errors?: string[];
  warnings?: string[];
}

export interface ImportCollection {
  name?: string;
  workspaceId: string;
  inputMethod: string;
  specificationType: string;
  raw?: string;
  url?: string;
  file?: File;
}
export interface CreateCollection {
  name: string;
  workspaceId: string;
  isImportant: boolean;
}
