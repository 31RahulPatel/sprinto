import {
  LayoutDashboard,
  LayoutGrid,
  Archive,
  KeyRound,
  Server,
  Network,
  Database,
  Zap,
  ScrollText,
  Plug,
  ShieldCheck,
  ListChecks,
  Settings,
  Users,
  GraduationCap,
  Laptop,
  Lock,
  RefreshCw,
  ShieldAlert,
  Siren,
  ClipboardCheck,
  Workflow,
  FileCheck,
  Fingerprint,
  Handshake,
} from "lucide-react";
import type { Role } from "@/types";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Assigned Tasks", icon: ListChecks },
  { href: "/controls", label: "Controls", icon: ShieldCheck },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/policies", label: "Policy", icon: FileCheck },
  { href: "/trainings", label: "Training", icon: GraduationCap },
];

export const SERVICE_NAV_ITEMS = [
  { href: "/services/all", label: "All Services", icon: LayoutGrid, service: "all" },
  { href: "/services/s3", label: "S3", icon: Archive, service: "s3" },
  { href: "/services/iam", label: "IAM", icon: KeyRound, service: "iam" },
  { href: "/services/ec2", label: "EC2", icon: Server, service: "ec2" },
  { href: "/services/vpc", label: "VPC", icon: Network, service: "vpc" },
  { href: "/services/rds", label: "RDS", icon: Database, service: "rds" },
  { href: "/services/lambda", label: "Lambda", icon: Zap, service: "lambda" },
  { href: "/services/cloudtrail", label: "CloudTrail", icon: ScrollText, service: "cloudtrail" },
];

export const SERVICE_ICONS: Record<string, typeof Archive> = {
  s3: Archive,
  iam: KeyRound,
  ec2: Server,
  vpc: Network,
  rds: Database,
  lambda: Zap,
  cloudtrail: ScrollText,
};

// "Trainings" used to live here as a nav-only placeholder — it's a real top-level feature now
// (see NAV_ITEMS), so it was removed from here rather than kept as a second, fake destination.
export const DATA_LIBRARY_NAV_ITEMS = [
  { href: "/data-library/people", label: "People", icon: Users, item: "people" },
  { href: "/data-library/staff-devices", label: "Staff Devices", icon: Laptop, item: "staff-devices" },
  { href: "/data-library/access-vendors", label: "Access Vendors", icon: Lock, item: "access-vendors" },
  {
    href: "/data-library/change-management",
    label: "Change Management",
    icon: RefreshCw,
    item: "change-management",
  },
  {
    href: "/data-library/vulnerabilities",
    label: "Vulnerabilities",
    icon: ShieldAlert,
    item: "vulnerabilities",
  },
  { href: "/data-library/incidents", label: "Incidents", icon: Siren, item: "incidents" },
  { href: "/data-library/reviews", label: "Reviews", icon: ClipboardCheck, item: "reviews" },
  {
    href: "/data-library/workflow-checks",
    label: "Workflow Checks",
    icon: Workflow,
    item: "workflow-checks",
  },
];

export const BOTTOM_NAV_ITEMS = [{ href: "/settings", label: "Settings", icon: Settings }];

// A Dev's flat sidebar: Dashboard, Policy, Training, Device, MFA, Vendor requests, Incidents.
// Device/Incidents reuse the existing Staff Devices / Data Library Incidents pages directly
// (no duplicate page) — assigned tasks now live on the Dashboard itself instead of a separate
// nav entry (see the Dashboard page's Dev branch).
export const DEV_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/policies", label: "Policy", icon: FileCheck },
  { href: "/trainings", label: "Training", icon: GraduationCap },
  { href: "/data-library/staff-devices", label: "Device", icon: Laptop },
  { href: "/mfa", label: "MFA", icon: Fingerprint },
  { href: "/vendor-requests", label: "Vendor requests", icon: Handshake },
  { href: "/data-library/incidents", label: "Incidents", icon: Siren },
];

export function getVisibleNav(role: Role | undefined) {
  if (role === "DEV") {
    return {
      navItems: DEV_NAV_ITEMS,
      showServices: false,
      dataLibraryItems: [] as typeof DATA_LIBRARY_NAV_ITEMS,
      bottomNavItems: [] as typeof BOTTOM_NAV_ITEMS,
    };
  }
  return {
    navItems: NAV_ITEMS,
    showServices: true,
    dataLibraryItems: DATA_LIBRARY_NAV_ITEMS,
    bottomNavItems: BOTTOM_NAV_ITEMS,
  };
}
