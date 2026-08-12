// Mirrors backend/src/common/staff-device-checks.ts — keep the two in sync.
export const STAFF_DEVICE_CHECKS = [
  "Software up to date",
  "Laptop auth enabled",
  "Disk encryption enabled",
] as const;

export const OS_OPTIONS = ["macOS", "Windows", "Linux", "ChromeOS"];
