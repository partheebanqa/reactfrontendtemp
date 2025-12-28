import { apiRequest } from '@/lib/queryClient';
import { ENV } from '@/config/env';
import {
  AddMemberPayload,
  AddMemberResponse,
  RolesResponse,
  UsersResponse,
  RemoveUserPayload,
  RemoveUserResponse,
  UpdateRolePayload,
  UpdateRoleResponse,
} from '@/shared/types/manageUser';

export const getUserRoles = async (): Promise<RolesResponse> => {
  const response = await apiRequest(
    'GET',
    `${ENV.API_BASE_URL}/organizations/roles`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch roles');
  }

  return response.json() as Promise<RolesResponse>;
};

export const addUser = async (
  payload: AddMemberPayload
): Promise<AddMemberResponse> => {
  const response = await apiRequest(
    'POST',
    `${ENV.API_BASE_URL}/auth/add-member`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to add member:', errorText);
    throw new Error('Failed to add member');
  }

  return response.json() as Promise<AddMemberResponse>;
};

export const getUserList = async (): Promise<UsersResponse> => {
  const response = await apiRequest(
    'GET',
    `${ENV.API_BASE_URL}/organizations/users`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }

  return response.json() as Promise<UsersResponse>;
};

export const removeUserFromWorkspace = async (
  payload: RemoveUserPayload
): Promise<RemoveUserResponse> => {
  const response = await apiRequest(
    'POST',
    `${ENV.API_BASE_URL}/auth/remove-from-workspace`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to remove user:', errorText);
    throw new Error('Failed to remove user from workspace');
  }

  return response.json() as Promise<RemoveUserResponse>;
};

export const updateUserRole = async (
  payload: UpdateRolePayload
): Promise<UpdateRoleResponse> => {
  const response = await apiRequest(
    'POST',
    `${ENV.API_BASE_URL}/auth/update-role`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to update role:', errorText);
    throw new Error('Failed to update user role');
  }

  return response.json() as Promise<UpdateRoleResponse>;
};
