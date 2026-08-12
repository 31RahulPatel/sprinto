import { TaskStatus, Role } from '@prisma/client';
import { PERMISSIONS, Permission, hasPermission, isAdminRole } from '../auth/permissions';

interface Transition {
  to: TaskStatus;
  permission: Permission;
  requireAssignee: boolean;
}

// OPEN -> ASSIGNED happens only via the dedicated /assign endpoint, not here.
// UNDER_REVIEW's two outgoing edges (RESOLVED / back to IN_PROGRESS) happen only
// via the dedicated /review endpoint, not here.
export const TASK_TRANSITIONS: Record<TaskStatus, Transition[]> = {
  OPEN: [],
  ASSIGNED: [{ to: 'IN_PROGRESS', permission: PERMISSIONS.TASKS_WORK, requireAssignee: true }],
  IN_PROGRESS: [
    { to: 'EVIDENCE_SUBMITTED', permission: PERMISSIONS.TASKS_WORK, requireAssignee: true },
  ],
  EVIDENCE_SUBMITTED: [
    { to: 'UNDER_REVIEW', permission: PERMISSIONS.TASKS_REVIEW, requireAssignee: false },
  ],
  UNDER_REVIEW: [],
  RESOLVED: [],
};

export function findTaskTransition(from: TaskStatus, to: TaskStatus): Transition | undefined {
  return TASK_TRANSITIONS[from]?.find((t) => t.to === to);
}

export function canActorTransitionTask(
  transition: Transition,
  actor: { id: string; role: Role },
  assigneeId: string | null,
): boolean {
  if (!hasPermission(actor.role, transition.permission)) {
    return false;
  }
  if (transition.requireAssignee && !isAdminRole(actor.role) && actor.id !== assigneeId) {
    return false;
  }
  return true;
}

const EVIDENCE_UPLOAD_STATUSES: TaskStatus[] = ['ASSIGNED', 'IN_PROGRESS', 'EVIDENCE_SUBMITTED'];

export function canUploadTaskEvidence(
  status: TaskStatus,
  actor: { id: string; role: Role },
  assigneeId: string | null,
): boolean {
  if (!EVIDENCE_UPLOAD_STATUSES.includes(status)) {
    return false;
  }
  if (!hasPermission(actor.role, PERMISSIONS.EVIDENCE_UPLOAD)) {
    return false;
  }
  return isAdminRole(actor.role) || actor.id === assigneeId;
}
