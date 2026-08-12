export type Role = "SUPER_ADMIN" | "ADMIN" | "DEV";

export type CloudProvider = "AWS" | "AZURE" | "GCP";

export type AwsServiceSlug = "s3" | "iam" | "rds" | "vpc" | "lambda" | "cloudtrail";

export type ScanStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export type FindingStatus =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "EVIDENCE_SUBMITTED"
  | "UNDER_REVIEW"
  | "RESOLVED";

export type EvidenceType = "SCREENSHOT" | "PDF" | "DOCUMENT" | "REPORT" | "OTHER";

export type EvidenceVerificationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "AUTO_VERIFIED"
  | "VERIFICATION_FAILED";

export type VerificationMethod = "AUTOMATIC" | "MANUAL";

export type EvidenceVerificationMode = "AUTO_WITH_FALLBACK" | "AUTO_ONLY" | "MANUAL_ONLY";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId?: string | null;
  organization?: { id: string; name: string } | null;
}

export interface CloudAccount {
  id: string;
  provider: CloudProvider;
  accountId: string;
  displayName: string | null;
  region: string;
  createdAt: string;
}

export interface CloudAccountSetupInfo {
  externalId: string;
  principalArn: string;
  roleName: string;
  trustPolicy: unknown;
  inlinePolicy: unknown;
  managedPolicyArns: string[];
}

export interface Scan {
  id: string;
  provider: CloudProvider;
  service: string;
  status: ScanStatus;
  startedAt: string | null;
  completedAt: string | null;
  reportPath: string | null;
  errorMessage: string | null;
  createdAt: string;
  cloudAccount: { id: string; accountId: string; displayName: string | null; region: string };
}

export interface Member {
  id: string;
  name: string;
}

export interface FindingControl {
  id: string;
  code: string;
  name: string | null;
  framework: string | null;
}

export interface Finding {
  id: string;
  scanId: string;
  title: string;
  description: string;
  severity: Severity;
  status: FindingStatus;
  resource: string;
  service: string;
  category: string;
  frameworks: string[];
  remediation: string;
  createdAt: string;
  dueDate: string | null;
  assigneeId: string | null;
  assignee: Member | null;
  controlId: string | null;
  control: FindingControl | null;
  evidenceStatus: EvidenceVerificationStatus | null;
}

export interface EvidenceItem {
  id: string;
  name: string;
  type: EvidenceType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  note: string | null;
  version: number;
  verificationStatus: EvidenceVerificationStatus;
  verificationMethod: VerificationMethod | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  uploadedBy: Member;
  reviewer: Member | null;
}

export interface FindingActivityItem {
  id: string;
  type:
    | "ASSIGNED"
    | "REASSIGNED"
    | "STATUS_CHANGED"
    | "EVIDENCE_UPLOADED"
    | "REVIEW_APPROVED"
    | "REVIEW_REJECTED"
    | "AUTO_SCAN_STARTED"
    | "AUTO_SCAN_COMPLETED"
    | "SCAN_PASSED"
    | "SCAN_FAILED";
  fromStatus: FindingStatus | null;
  toStatus: FindingStatus | null;
  note: string | null;
  createdAt: string;
  actor: Member;
}

export interface FindingDetail extends Finding {
  assignedAt: string | null;
  resolvedAt: string | null;
  rejectionReason: string | null;
  assignedBy: Member | null;
  evidence: EvidenceItem[];
  activity: FindingActivityItem[];
}

export interface Control {
  id: string;
  code: string;
  name: string | null;
  framework: string | null;
  createdAt: string;
  findingCount: number;
  compliant: boolean;
}

export interface ControlDetail extends Control {
  findings: {
    id: string;
    title: string;
    severity: Severity;
    status: FindingStatus;
    resource: string;
    service: string;
    createdAt: string;
  }[];
}

export type UserAccountStatus = "ACTIVE" | "DISABLED";

export interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserAccountStatus;
  createdAt: string;
}

export interface ServiceStatus {
  service: string;
  implemented: boolean;
  score: number | null;
  lastScanAt: string | null;
  findingCount: number;
}

export interface DashboardSummary {
  totalFindings: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  totalScans: number;
  complianceScore: number | null;
  services: ServiceStatus[];
}

export type IntegrationProvider = "BITBUCKET";

export type IntegrationStatus = "CONNECTED" | "DISCONNECTED" | "ERROR";

export interface Integration {
  id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  workspaceSlug: string | null;
  workspaceName: string | null;
  errorMessage: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  _count: { repositories: number };
}

export interface BitbucketWorkspace {
  slug: string;
  name: string;
}

export interface BitbucketRepositoryLive {
  slug: string;
  name: string;
  isPrivate: boolean;
  selectedForScan: boolean;
}

export interface BitbucketBranch {
  id: string;
  name: string;
  isMainBranch: boolean;
  requiresApprovals: boolean;
  minApprovals: number | null;
}

export interface BitbucketRepositorySynced {
  id: string;
  slug: string;
  name: string;
  isPrivate: boolean;
  mainBranch: string | null;
  updatedAt: string;
  branches: BitbucketBranch[];
}

export interface IntegrationMember {
  accountId: string;
  displayName: string;
  permission: string;
}

export type TaskStatus =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "EVIDENCE_SUBMITTED"
  | "UNDER_REVIEW"
  | "RESOLVED";

export interface RecordActivityItem {
  id: string;
  entityType: string;
  entityId: string;
  type: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  createdAt: string;
  actor: Member;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Severity | null;
  createdAt: string;
  dueDate: string | null;
  entityType: string | null;
  entityId: string | null;
  assigneeId: string | null;
  assignee: Member | null;
  controlId: string | null;
  control: FindingControl | null;
  evidenceStatus: EvidenceVerificationStatus | null;
}

export interface TaskDetail extends Task {
  assignedAt: string | null;
  resolvedAt: string | null;
  rejectionReason: string | null;
  assignedBy: Member | null;
  evidence: EvidenceItem[];
  activity: RecordActivityItem[];
}

export type VulnerabilityStatus = "OPEN" | "IN_REMEDIATION" | "RESOLVED" | "ACCEPTED_RISK";

export interface Vulnerability {
  id: string;
  title: string;
  severity: Severity;
  status: VulnerabilityStatus;
  source: string | null;
  affectedAsset: string | null;
  cveId: string | null;
  createdAt: string;
  dueDate: string | null;
  resolvedAt: string | null;
  assigneeId: string | null;
  assignee: Member | null;
  controlId: string | null;
  control: FindingControl | null;
}

export interface VulnerabilityDetail extends Vulnerability {
  description: string;
  assignedAt: string | null;
  assignedBy: Member | null;
  tasks: Task[];
  activity: RecordActivityItem[];
}

export type PersonStatus = "ACTIVE" | "OFFBOARDING" | "INACTIVE";

export interface Person {
  id: string;
  fullName: string;
  email: string;
  jobTitle: string | null;
  department: string | null;
  employmentType: string | null;
  status: PersonStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  assigneeId: string | null;
  assignee: Member | null;
  controlId: string | null;
  control: FindingControl | null;
  managerId: string | null;
  manager: Member | null;
}

export interface PersonDetail extends Person {
  assignedAt: string | null;
  assignedBy: Member | null;
  linkedUserId: string | null;
  linkedUser: Member | null;
  tasks: Task[];
  activity: RecordActivityItem[];
}

export type StaffDeviceStatus = "PENDING" | "COMPLIANT";

export interface StaffDevice {
  id: string;
  deviceName: string;
  os: string;
  osVersion: string | null;
  status: StaffDeviceStatus;
  createdAt: string;
  ownerId: string;
  owner: Member & { email: string };
  controlId: string | null;
  control: FindingControl | null;
}

export interface StaffDeviceDetail extends StaffDevice {
  tasks: Task[];
  activity: RecordActivityItem[];
}

export type PolicyStatus = "ACCEPTED" | "PENDING";

export interface Policy {
  id: string;
  title: string;
  content: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  status: PolicyStatus;
  acceptedAt: string | null;
}

export type TrainingStatus = "COMPLETED" | "PENDING";

export interface Training {
  id: string;
  title: string;
  description: string;
  resourceUrl: string | null;
  createdAt: string;
  updatedAt: string;
  status: TrainingStatus;
  completedAt: string | null;
}
