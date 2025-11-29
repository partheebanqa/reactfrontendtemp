export interface TestSuite {
  id: string;
  name: string;
  description: string;
  environment: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface PreRequestAPI {
  id: string;
  test_suite_id: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
  token_path: string;
  created_at: string;
}

export interface APIRequest {
  id: string;
  test_suite_id: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
  requires_auth: boolean;
  selected: boolean;
  created_at: string;
}

export interface TestCase {
  id: string;
  api_request_id: string;
  name: string;
  description: string;
  expected_status: number;
  assertions: Array<{
    type: string;
    field: string;
    operator: string;
    value: unknown;
  }>;
  selected: boolean;
  created_at: string;
}

export type WorkflowStep =
  | "basic-info"
  | "prerequisites"
  | "select-apis"
  | "generate-tests"
  | "select-tests"
  | "execute";
