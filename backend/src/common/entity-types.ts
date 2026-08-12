// The single place a future Data Library module (Trainings, Staff Devices, Access Vendors,
// Change Management, Incidents, Reviews, Workflow Checks, ...) appends its value when it
// starts creating Tasks/RecordActivity against itself. Task.entityType/RecordActivity.entityType
// are plain strings (not a Prisma enum) precisely so adding a module here never requires a
// schema migration.
export const ENTITY_TYPES = ['VULNERABILITY', 'PERSON', 'STAFF_DEVICE'] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];
