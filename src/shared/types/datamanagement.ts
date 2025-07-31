export interface ResponseEnvironment {
  Id: string;
  WorkspaceId: string;
  Name: string;
  Description: string;
  CreatedAt: string;
  CreatedBy: string;
  UpdatedAt: string;
  UpdatedBy: string;
  DeletedAt: string | null;
}

export interface Environment {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  deletedAt?: string | null;
  baseUrl: string;
  isDefault: boolean;
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
  variables: Variable[];
  variablePage:number;
  variablePageSize:number;
}

interface UpdateEnvironmentPayload {
  workspaceId:string;
  name:string;
  description:string;
  defaultVariables: {
    baseUrl: string
  }
}

export interface fetchEnvironmentsResponse {
  environments: Environment[];
}

export type VariableType = "static" | "dynamic" | "environment";

export interface ResponseVariable {
  Id: string;
  EnvironmentId: string;
  Name: string;
  Description: string;
  Type: string;
  InitialValue: string;
  CurrentValue: string;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
}

export interface FetchVariablesResponse {
  count: number,
  items: ResponseVariable[],
  page: number,
  pageSize: number
}

export interface Variable {
  id: string;
  environmentId: string;
  name: string;
  description: string;
  type: string;
  initialValue: string;
  currentValue: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
