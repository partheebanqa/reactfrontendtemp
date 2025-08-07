/** Response from backend for Environment object */
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

/** Internal Environment structure used in frontend */
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

/** Dataset structure (e.g., test data or mock input) */
export interface Dataset {
  id: string;
  name: string;
  description: string;
  data: Record<string, any>[]; // Array of objects with any key-value shape
  format: 'json' | 'csv' | 'xml';
  size: number;
  createdAt: string;
}

/** Redux state slice for environment/variable management */
export interface DataManagementState {
  environments: Environment[];
  activeEnvironment: Environment | null;
  isLoading: boolean;
  variables: Variable[];
  variablePage: number;
  variablePageSize: number;
}

/** Payload to update an environment */
export interface UpdateEnvironmentPayload {
  workspaceId: string;
  name: string;
  description: string;
  defaultVariables: {
    baseUrl: string;
  };
}

/** Response from API for list of environments */
export interface FetchEnvironmentsResponse {
  environments: Environment[];
}

/** Accepted variable types */
export type VariableType = 'static' | 'dynamic' | 'environment';

/** Variable format returned by backend */
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

/** Frontend-friendly variable format */
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

/** Response from API for paginated variable list */
export interface FetchVariablesResponse {
  count: number;
  items: ResponseVariable[];
  page: number;
  pageSize: number;
}
