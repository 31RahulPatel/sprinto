import { Badge } from "@/components/ui/badge";
import type { EvidenceVerificationStatus } from "@/types";

const EVIDENCE_STATUS_LABEL: Record<EvidenceVerificationStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  AUTO_VERIFIED: "Auto-Verified",
  VERIFICATION_FAILED: "Verification Failed",
};

const EVIDENCE_STATUS_VARIANT: Record<
  EvidenceVerificationStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
  AUTO_VERIFIED: "default",
  VERIFICATION_FAILED: "destructive",
};

export function EvidenceStatusBadge({
  status,
  className,
}: {
  status: EvidenceVerificationStatus | null;
  className?: string;
}) {
  if (!status) {
    return (
      <Badge variant="outline" className={className}>
        No Evidence
      </Badge>
    );
  }

  return (
    <Badge variant={EVIDENCE_STATUS_VARIANT[status]} className={className}>
      {EVIDENCE_STATUS_LABEL[status]}
    </Badge>
  );
}
