import {
  sanitizeText,
  sanitizeEmail,
  validateCSP,
  preventSQLInjection,
} from '@/utils/security';
import type { AddMemberPayload } from '@/shared/types/manageUser';

export type InviteForm = {
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  workspaceId: string;
};

export type InviteFormErrors = Partial<Record<keyof InviteForm, string>>;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRegex = /^[a-zA-Z\u00C0-\u024F\s\-'.]+$/;
const idRegex = /^[A-Za-z0-9_-]{1,64}$/;

export function sanitizeInviteForm(input: InviteForm) {
  const firstName = sanitizeText(input.firstName, 100);
  const lastName = sanitizeText(input.lastName, 100);
  const email = sanitizeEmail(input.email);
  const roleId = sanitizeText(input.roleId, 64);
  const workspaceId = sanitizeText(input.workspaceId, 64);

  const sanitized: InviteForm = {
    firstName,
    lastName,
    email,
    roleId,
    workspaceId,
  };

  // Validate
  const errors: InviteFormErrors = {};

  // First name
  if (!firstName.trim()) {
    errors.firstName = 'First name is required';
  } else if (firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
  } else if (!nameRegex.test(firstName)) {
    errors.firstName = 'First name contains invalid characters';
  } else if (!validateCSP(firstName)) {
    errors.firstName = 'First name contains unsafe content';
  }

  // Last name
  if (!lastName.trim()) {
    errors.lastName = 'Last name is required';
  } else if (lastName.trim().length < 1) {
    errors.lastName = 'Last name must be at least 1 characters';
  } else if (!nameRegex.test(lastName)) {
    errors.lastName = 'Last name contains invalid characters';
  } else if (!validateCSP(lastName)) {
    errors.lastName = 'Last name contains unsafe content';
  }

  // Email
  if (!email.trim()) {
    errors.email = 'Email is required';
  } else if (!emailRegex.test(email)) {
    errors.email = 'Enter a valid email address';
  } else if (!validateCSP(email)) {
    errors.email = 'Email contains unsafe content';
  }

  // Role
  if (!roleId.trim()) {
    errors.roleId = 'Role is required';
  } else if (!idRegex.test(roleId)) {
    errors.roleId = 'Invalid role id';
  } else if (!validateCSP(roleId)) {
    errors.roleId = 'Role contains unsafe content';
  }

  // Workspace
  if (!workspaceId.trim()) {
    errors.workspaceId = 'Workspace is required';
  } else if (!idRegex.test(workspaceId)) {
    errors.workspaceId = 'Invalid workspace id';
  } else if (!validateCSP(workspaceId)) {
    errors.workspaceId = 'Workspace contains unsafe content';
  }

  type Key = keyof InviteForm;
  const checks: Array<[Key, string]> = [
    ['firstName', firstName],
    ['lastName', lastName],
    ['email', email],
    ['roleId', roleId],
    ['workspaceId', workspaceId],
  ];

  const labels: Record<Key, string> = {
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    roleId: 'Role',
    workspaceId: 'Workspace',
  };

  for (const [key, value] of checks) {
    const cleaned = preventSQLInjection(value);
    if (cleaned !== value && !errors[key]) {
      errors[key] = `${labels[key]} contains potentially unsafe content`;
    }
  }

  return { sanitized, errors };
}

export function buildAddMemberPayload(sanitized: InviteForm): AddMemberPayload {
  return {
    accessList: [
      {
        roleIds: [sanitized.roleId],
        workspaceId: sanitized.workspaceId,
      },
    ],
    email: sanitized.email,
    firstName: sanitized.firstName,
    lastName: sanitized.lastName,
  };
}

/**
 * Convenience: sanitize + validate and return payload if valid
 */
export function prepareInvitePayload(input: InviteForm): {
  payload?: AddMemberPayload;
  errors: InviteFormErrors;
} {
  const { sanitized, errors } = sanitizeInviteForm(input);
  if (Object.keys(errors).length > 0) return { errors };
  return { payload: buildAddMemberPayload(sanitized), errors };
}
