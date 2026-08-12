// The 3 fixed compliance checks every StaffDevice gets on registration, each created as a
// generic Task (entityType='STAFF_DEVICE') with one of these exact titles. Matched by title
// (not a new Task field) on both backend and frontend — see the Data Library spine plan for
// why Task stays a plain, unmodified generic model here.
export const STAFF_DEVICE_CHECKS = [
  'Software up to date',
  'Laptop auth enabled',
  'Disk encryption enabled',
] as const;
