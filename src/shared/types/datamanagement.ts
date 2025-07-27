// types.ts
export interface Environment {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  baseUrl: string;
  variables: Record<string, string>;
  isDefault: boolean;
  createdAt: string;
  deletedAt?: string | null;
}
export interface Variable {
  id: string;
  key: string;
  value: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "secret"
    | "environment"
    | "dynamic"
    | "static";
  description?: string;
  environmentId?: string;
  isGlobal: boolean;
  generatorFunction?: string;
  scope?: "global" | "project" | "environment";
  generatorConfig?: Record<string, any>;
  isSecret?: boolean;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  data: Record<string, any>[];
  format: "json" | "csv" | "xml";
  size: number;
  createdAt: string;
}

export interface DataManagementState {
  environments: Environment[];
  activeEnvironment: Environment | null;
  isLoading: boolean;
}

export interface fetchEnvironmentsResponse {
  environments: Environment[];
}

export type VariableType = "static" | "dynamic" | "environment";
