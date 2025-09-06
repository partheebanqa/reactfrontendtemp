export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: Record<string, string>;
  body?: string;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  responseTime: number;
  size: number;
}

export interface Assertion {
  id: string;
  category: 'status' | 'headers' | 'body' | 'performance' | 'HeaderGuard™';
  type: string;
  description: string;
  field?: string;
  operator?: string;
  expectedValue?: any;
  enabled: boolean;
  priority?: 'Critical' | 'High' | 'Medium' | 'Low';
  impact?: string;
  group?: string;
}

export interface AssertionResult {
  assertion: Assertion;
  passed: boolean;
  actual?: any;
  message: string;
}
