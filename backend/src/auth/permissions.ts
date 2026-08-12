import { Role } from '@prisma/client';

export const PERMISSIONS = {
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  FINDINGS_ASSIGN: 'findings:assign',
  FINDINGS_WORK: 'findings:work',
  FINDINGS_REVIEW: 'findings:review',
  EVIDENCE_UPLOAD: 'evidence:upload',
  INTEGRATIONS_MANAGE: 'integrations:manage',
  TASKS_ASSIGN: 'tasks:assign',
  TASKS_WORK: 'tasks:work',
  TASKS_REVIEW: 'tasks:review',
  VULNERABILITIES_WRITE: 'vulnerabilities:write',
  VULNERABILITIES_ASSIGN: 'vulnerabilities:assign',
  PEOPLE_WRITE: 'people:write',
  PEOPLE_ASSIGN: 'people:assign',
  POLICIES_MANAGE: 'policies:manage',
  TRAININGS_MANAGE: 'trainings:manage',
  CLOUD_ACCOUNTS_MANAGE: 'cloud-accounts:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS,
  ADMIN: ALL_PERMISSIONS,
  DEV: [PERMISSIONS.FINDINGS_WORK, PERMISSIONS.EVIDENCE_UPLOAD, PERMISSIONS.TASKS_WORK],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

// Admin and Super Admin share every permission — the only difference between them is that
// an Admin cannot manage a Super Admin (see UsersService). Ownership-bypass checks elsewhere
// ("assignee or admin") should use this instead of comparing against 'ADMIN' directly, or a
// Super Admin would incorrectly fail them.
export function isAdminRole(role: Role): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function isSuperAdmin(role: Role): boolean {
  return role === 'SUPER_ADMIN';
}
