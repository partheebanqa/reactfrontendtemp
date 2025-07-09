export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface KeyValuePair {
  key: string;
  value: string;
}

export interface RequestData {
  method: RequestMethod;
  url: string;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  body?: string;
}

export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  time: number;
}