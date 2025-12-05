import { CollectionRequest } from './collection';

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface KeyValuePair {
  key: string;
  value: string;
}

export interface RequestState {
  requestData: CollectionRequest;
  responseData: ResponseData | null;
  isLoading: boolean;
  error: ErrorState;
}

export interface ErrorState {
  title: string;
  description?: string;
  suggestions?: string[];
}

export interface RequestBody {
  type: 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary';
  content: string;
}

export interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

export interface Param {
  key: string;
  value: string;
  enabled: boolean;
}

export interface RequestData {
  method: RequestMethod;
  url: string;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  body?: string;
}

export interface ResponseData {
  assertionLogs?: boolean;
  schemaValidation: any;
  status: number;
  statusText: string;
  headers: any;
  data: any;
  responseTime?: number | string; // Can be a number (in ms) or a formatted string (e.g., "1.23 s")
  size?: number;
  time?: number;
  body?: any;
}
