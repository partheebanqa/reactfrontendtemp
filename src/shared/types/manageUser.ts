export interface Role {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface RolesResponse {
  roles: Role[];
  total: number;
}

export interface AccessItem {
  roleIds: string[];
  workspaceId: string;
}

export interface AddMemberPayload {
  accessList: AccessItem[];
  email: string;
  firstName: string;
  lastName: string;
}

export interface AddMemberResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

export interface User {
  workspaces(workspaces: any): unknown;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
}

export interface RemoveUserPayload {
  userId: string;
  workspaceId: string;
}

export interface RemoveUserResponse {
  success: boolean;
  message?: string;
}

export interface UpdateRolePayload {
  userId: string;
  workspaceId: string;
  roleIds: string[];
}

export interface UpdateRoleResponse {
  success: boolean;
  message?: string;
}
