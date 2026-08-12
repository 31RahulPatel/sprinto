import { Badge } from "@/components/ui/badge";
import type { FindingStatus, TaskStatus } from "@/types";

const STATUS_LABEL: Record<FindingStatus | TaskStatus, string> = {
  OPEN: "Open",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  EVIDENCE_SUBMITTED: "Evidence Submitted",
  UNDER_REVIEW: "Under Review",
  RESOLVED: "Resolved",
};

const STATUS_VARIANT: Record<
  FindingStatus | TaskStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  OPEN: "outline",
  ASSIGNED: "secondary",
  IN_PROGRESS: "secondary",
  EVIDENCE_SUBMITTED: "default",
  UNDER_REVIEW: "default",
  RESOLVED: "outline",
};

export function StatusBadge({
  status,
  className,
}: {
  status: FindingStatus | TaskStatus;
  className?: string;
}) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={className}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
