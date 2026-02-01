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
  responseTime?: number | string;
  size?: number;
  time?: number;
  body?: any;
}

export interface Variable {
  id: string;
  name: string;
  value?: string;
  initialValue?: string;
  type?: string;
  isDynamic?: boolean;
  description?: string;
  environmentId?: string;
  currentValue?: string;
}

export interface DynamicVariableOverride {
  name: string;
  value: string;
}

export interface AutocompleteState {
  show: boolean;
  position: { top: number; left: number };
  suggestions: Variable[];
  prefix: 'D_' | 'S_' | null;
  inputRef: HTMLInputElement | HTMLTextAreaElement | null;
  cursorPosition: number;
}

export interface CollectionRequestsResponse {
  folders: any[];
  requests: any[];
  preRequestId?: string;
}

export interface FormattedResponse {
  requestId: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  responseTime: number;
  size: number;
}

export interface SelectedVariable {
  name: string;
  path?: string;
}

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export interface FormField {
  id: string;
  key: string;
  value: string;
  type: 'text' | 'file';
  fileName?: string;
}

export type BodyType =
  | 'none'
  | 'json'
  | 'form-data'
  | 'urlencoded'
  | 'raw'
  | 'binary';

export interface PendingSubstitution {
  lineIndex: number;
  variableName: string;
}
