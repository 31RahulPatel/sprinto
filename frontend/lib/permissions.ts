import type { FindingDetail, Role, TaskDetail, User } from "@/types";

// Mirrors backend/src/auth/permissions.ts — keep the two in sync.
export const PERMISSIONS = {
  USERS_READ: "users:read",
  USERS_WRITE: "users:write",
  FINDINGS_ASSIGN: "findings:assign",
  FINDINGS_WORK: "findings:work",
  FINDINGS_REVIEW: "findings:review",
  EVIDENCE_UPLOAD: "evidence:upload",
  INTEGRATIONS_MANAGE: "integrations:manage",
  TASKS_ASSIGN: "tasks:assign",
  TASKS_WORK: "tasks:work",
  TASKS_REVIEW: "tasks:review",
  VULNERABILITIES_WRITE: "vulnerabilities:write",
  VULNERABILITIES_ASSIGN: "vulnerabilities:assign",
  PEOPLE_WRITE: "people:write",
  PEOPLE_ASSIGN: "people:assign",
  POLICIES_MANAGE: "policies:manage",
  TRAININGS_MANAGE: "trainings:manage",
  CLOUD_ACCOUNTS_MANAGE: "cloud-accounts:manage",
} as const;

type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS,
  ADMIN: ALL_PERMISSIONS,
  DEV: [PERMISSIONS.FINDINGS_WORK, PERMISSIONS.EVIDENCE_UPLOAD, PERMISSIONS.TASKS_WORK],
};

function hasPermission(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

// Admin and Super Admin share every permission — the only difference is that an Admin can't
// manage a Super Admin (see TeamMembers/EditUserDialog). Ownership-bypass checks below should
// use this instead of comparing against "ADMIN" directly, or a Super Admin would fail them.
function isAdminRole(role: Role | undefined): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function isSuperAdmin(role: Role | undefined): boolean {
  return role === "SUPER_ADMIN";
}

export function canAssign(user: User | null | undefined): boolean {
  return hasPermission(user?.role, PERMISSIONS.FINDINGS_ASSIGN);
}

export function canReview(user: User | null | undefined): boolean {
  return hasPermission(user?.role, PERMISSIONS.FINDINGS_REVIEW);
}

export function canManageUsers(user: User | null | undefined): boolean {
  return hasPermission(user?.role, PERMISSIONS.USERS_WRITE);
}

export function canManageIntegrations(user: User | null | undefined): boolean {
  return hasPermission(user?.role, PERMISSIONS.INTEGRATIONS_MANAGE);
}

const EVIDENCE_UPLOAD_STATUSES: FindingDetail["status"][] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "EVIDENCE_SUBMITTED",
];

export function canUploadEvidence(
  user: User | null | undefined,
  finding: FindingDetail | null | undefined,
): boolean {
  if (!user || !finding) return false;
  if (!EVIDENCE_UPLOAD_STATUSES.includes(finding.status)) return false;
  if (!hasPermission(user.role, PERMISSIONS.EVIDENCE_UPLOAD)) return false;
  return isAdminRole(user.role) || user.id === finding.assigneeId;
}

export function canStartWork(user: User | null | undefined, finding: FindingDetail): boolean {
  if (!user) return false;
  if (finding.status !== "ASSIGNED") return false;
  if (!hasPermission(user.role, PERMISSIONS.FINDINGS_WORK)) return false;
  return isAdminRole(user.role) || user.id === finding.assigneeId;
}

export function canSubmitForReview(user: User | null | undefined, finding: FindingDetail): boolean {
  if (!user) return false;
  if (finding.status !== "IN_PROGRESS") return false;
  if (finding.evidence.length === 0) return false;
  if (!hasPermission(user.role, PERMISSIONS.FINDINGS_WORK)) return false;
  return isAdminRole(user.role) || user.id === finding.assigneeId;
}

export function canClaimForReview(user: User | null | undefined, finding: FindingDetail): boolean {
  if (!user) return false;
  if (finding.status !== "EVIDENCE_SUBMITTED") return false;
  return canReview(user);
}

export function isSelfReview(user: User | null | undefined, finding: FindingDetail): boolean {
  if (!user || finding.evidence.length === 0) return false;
  const lastEvidence = finding.evidence[finding.evidence.length - 1];
  return lastEvidence.uploadedBy.id === user.id;
}

export function canAssignTask(user: User | null | undefined): boolean {
  return hasPermission(user?.role, PERMISSIONS.TASKS_ASSIGN);
}

export function canReviewTask(user: User | null | undefined): boolean {
  return hasPermission(user?.role, PERMISSIONS.TASKS_REVIEW);
}

const TASK_EVIDENCE_UPLOAD_STATUSES: TaskDetail["status"][] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "EVIDENCE_SUBMITTED",
];

export function canUploadTaskEvidence(
  user: User | null | undefined,
  task: TaskDetail | null | undefined,
): boolean {
  if (!user || !task) return false;
  if (!TASK_EVIDENCE_UPLOAD_STATUSES.includes(task.status)) return false;
  if (!hasPermission(user.role, PERMISSIONS.EVIDENCE_UPLOAD)) return false;
  return isAdminRole(user.role) || user.id === task.assigneeId;
}

export function canStartTaskWork(user: User | null | undefined, task: TaskDetail): boolean {
  if (!user) return false;
  if (task.status !== "ASSIGNED") return false;
  if (!hasPermission(user.role, PERMISSIONS.TASKS_WORK)) return false;
  return isAdminRole(user.role) || user.id === task.assigneeId;
}

export function canSubmitTaskForReview(user: User | null | undefined, task: TaskDetail): boolean {
  if (!user) return false;
  if (task.status !== "IN_PROGRESS") return false;
  if (task.evidence.length === 0) return false;
  if (!hasPermission(user.role, PERMISSIONS.TASKS_WORK)) return false;
  return isAdminRole(user.role) || user.id === task.assigneeId;
}

export function canClaimTaskForReview(user: User | null | undefined, task: TaskDetail): boolean {
  if (!user) return false;
  if (task.status !== "EVIDENCE_SUBMITTED") return false;
  return canReviewTask(user);
}

export function canWriteVulnerability(user: User | null | undefined): boolean {
  return hasPermission(user?.role, PERMISSIONS.VULNERABILITIES_WRITE);
}

export function canAssignVulnerability(user: User | null | undefined): boolean {
  return hasPermission(user?.role, PERMISSIONS.VULNERABILITIES_ASSIGN);
}

export function canWritePerson(user: User | null | undefined): boolean {
  return hasPermission(user?.role, PERMISSIONS.PEOPLE_WRITE);
}

export function canAssignPerson(user: User | null | undefined): boolean {
  return hasPermission(user?.role, PERMISSIONS.PEOPLE_ASSIGN);
}

export function canManagePolicies(user: User | null | undefined): boolean {
  return hasPermission(user?.role, PERMISSIONS.POLICIES_MANAGE);
}

export function canManageTrainings(user: User | null | undefined): boolean {
  return hasPermission(user?.role, PERMISSIONS.TRAININGS_MANAGE);
}

export function canManageCloudAccounts(user: User | null | undefined): boolean {
  return hasPermission(user?.role, PERMISSIONS.CLOUD_ACCOUNTS_MANAGE);
}
