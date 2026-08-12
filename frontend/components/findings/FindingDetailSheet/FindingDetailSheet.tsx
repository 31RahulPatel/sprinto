"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, FileText } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/findings/StatusBadge";
import { EvidenceStatusBadge } from "@/components/findings/EvidenceStatusBadge";
import { AssigneePicker } from "@/components/findings/AssigneePicker";
import { EvidenceUploader } from "@/components/findings/EvidenceUploader";
import { ReviewActions } from "@/components/findings/ReviewActions";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useFinding } from "@/hooks/useFinding";
import { relativeTime } from "@/lib/relative-time";
import {
  canAssign,
  canClaimForReview,
  canReview,
  canStartWork,
  canSubmitForReview,
  canUploadEvidence,
  isSelfReview,
} from "@/lib/permissions";
import type { Finding, FindingStatus, Severity } from "@/types";

const SEVERITY_VARIANT: Record<Severity, "default" | "secondary" | "destructive" | "outline"> = {
  CRITICAL: "destructive",
  HIGH: "destructive",
  MEDIUM: "default",
  LOW: "secondary",
  INFO: "outline",
};

const ACTIVITY_LABEL: Record<string, string> = {
  ASSIGNED: "assigned this finding",
  REASSIGNED: "reassigned this finding",
  STATUS_CHANGED: "changed the status",
  EVIDENCE_UPLOADED: "uploaded evidence",
  REVIEW_APPROVED: "approved the evidence",
  REVIEW_REJECTED: "rejected the evidence",
  AUTO_SCAN_STARTED: "started an automatic verification scan",
  AUTO_SCAN_COMPLETED: "completed an automatic verification scan",
  SCAN_PASSED: "verified this via automatic re-scan",
  SCAN_FAILED: "found this still failing via automatic re-scan",
};

function StatusTransitionButton({
  findingId,
  label,
  targetStatus,
}: {
  findingId: string;
  label: string;
  targetStatus: FindingStatus;
}) {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const handleClick = async () => {
    setSubmitting(true);
    const res = await fetch(`/api/findings/${findingId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: targetStatus }),
    });
    setSubmitting(false);
    if (res.ok) {
      await queryClient.invalidateQueries({ queryKey: ["finding", findingId] });
      await queryClient.invalidateQueries({ queryKey: ["findings"] });
    }
  };

  return (
    <Button size="sm" disabled={submitting} onClick={handleClick}>
      {label}
    </Button>
  );
}

export function FindingDetailSheet({
  finding,
  onOpenChange,
}: {
  finding: Finding | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: currentUser } = useCurrentUser();
  const { data: detail } = useFinding(finding?.id ?? null);

  return (
    <Sheet open={finding !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {finding && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <Badge variant={SEVERITY_VARIANT[finding.severity]}>{finding.severity}</Badge>
                {detail && <StatusBadge status={detail.status} />}
                <span className="text-xs uppercase text-muted-foreground">{finding.service}</span>
              </div>
              <SheetTitle>{finding.title}</SheetTitle>
              <SheetDescription>{finding.description}</SheetDescription>
            </SheetHeader>

            <div className="space-y-5 px-4 pb-6 text-sm">
              <div>
                <h4 className="mb-1 font-medium text-muted-foreground">Affected Resource</h4>
                <p className="break-all font-mono text-xs">{finding.resource}</p>
              </div>

              <div>
                <h4 className="mb-1 font-medium text-muted-foreground">Category</h4>
                <p>{finding.category}</p>
              </div>

              {detail?.dueDate && (
                <div>
                  <h4 className="mb-1 font-medium text-muted-foreground">Due Date</h4>
                  <p>{new Date(detail.dueDate).toLocaleDateString()}</p>
                </div>
              )}

              {finding.frameworks.length > 0 && (
                <div>
                  <h4 className="mb-2 font-medium text-muted-foreground">Compliance Mapping</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {finding.frameworks.map((fw) => (
                      <Badge key={fw} variant="outline">
                        {fw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-md border border-aws-blue/30 bg-aws-blue/5 p-3">
                <h4 className="mb-1 font-medium text-aws-blue">Action Needed</h4>
                <p>{finding.remediation || "No remediation guidance provided for this check."}</p>
              </div>

              {detail && (
                <>
                  <div className="space-y-2 border-t border-border pt-4">
                    <h4 className="font-medium text-muted-foreground">Assignee</h4>
                    {currentUser && canAssign(currentUser) ? (
                      <AssigneePicker finding={detail} currentUser={currentUser} />
                    ) : (
                      <p>{detail.assignee?.name ?? "Unassigned"}</p>
                    )}
                  </div>

                  {detail.rejectionReason && (
                    <div className="rounded-md border border-danger/30 bg-danger/5 p-3">
                      <h4 className="mb-1 font-medium text-danger">Sent back for changes</h4>
                      <p>{detail.rejectionReason}</p>
                    </div>
                  )}

                  {currentUser && isSelfReview(currentUser, detail) && detail.status === "UNDER_REVIEW" && (
                    <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                      You are approving evidence you submitted yourself.
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                    {currentUser && canStartWork(currentUser, detail) && (
                      <StatusTransitionButton
                        findingId={detail.id}
                        label="Start work"
                        targetStatus="IN_PROGRESS"
                      />
                    )}
                    {currentUser && canSubmitForReview(currentUser, detail) && (
                      <StatusTransitionButton
                        findingId={detail.id}
                        label="Submit for review"
                        targetStatus="EVIDENCE_SUBMITTED"
                      />
                    )}
                    {currentUser && canClaimForReview(currentUser, detail) && (
                      <StatusTransitionButton
                        findingId={detail.id}
                        label="Claim for review"
                        targetStatus="UNDER_REVIEW"
                      />
                    )}
                    {currentUser &&
                      detail.status === "UNDER_REVIEW" &&
                      canReview(currentUser) && <ReviewActions findingId={detail.id} />}
                  </div>

                  <div className="space-y-3 border-t border-border pt-4">
                    <h4 className="font-medium text-muted-foreground">Evidence</h4>
                    {detail.evidence.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No evidence uploaded yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {detail.evidence.map((e) => (
                          <li key={e.id} className="flex items-start gap-2 rounded-md border border-border p-2">
                            {e.mimeType.startsWith("image/") ? (
                              <a
                                href={`/api/findings/${detail.id}/evidence/${e.id}/file`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <img
                                  src={`/api/findings/${detail.id}/evidence/${e.id}/file`}
                                  alt={e.fileName}
                                  className="h-12 w-12 rounded object-cover"
                                />
                              </a>
                            ) : (
                              <a
                                href={`/api/findings/${detail.id}/evidence/${e.id}/file`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex h-12 w-12 items-center justify-center rounded bg-muted"
                              >
                                <FileText className="h-5 w-5 text-muted-foreground" />
                              </a>
                            )}
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <p className="truncate text-xs font-medium">{e.name}</p>
                                <Badge variant="outline" className="shrink-0 text-[10px]">
                                  v{e.version}
                                </Badge>
                                <EvidenceStatusBadge
                                  status={e.verificationStatus}
                                  className="shrink-0 text-[10px]"
                                />
                              </div>
                              <p className="truncate text-xs text-muted-foreground">{e.fileName}</p>
                              {e.note && <p className="text-xs text-muted-foreground">{e.note}</p>}
                              {e.rejectionReason && (
                                <p className="text-xs text-danger">Rejected: {e.rejectionReason}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {e.uploadedBy.name} · {relativeTime(e.createdAt)}
                                {e.verificationMethod === "AUTOMATIC" && " · Automatic"}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    {canUploadEvidence(currentUser, detail) && (
                      <EvidenceUploader findingId={detail.id} />
                    )}
                  </div>

                  <div className="space-y-3 border-t border-border pt-4">
                    <h4 className="font-medium text-muted-foreground">Activity</h4>
                    <ul className="space-y-2">
                      {detail.activity.map((a) => (
                        <li key={a.id} className="flex items-start gap-2 text-xs">
                          <Clock className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                          <p>
                            <span className="font-medium">{a.actor.name}</span>{" "}
                            {ACTIVITY_LABEL[a.type] ?? a.type}
                            {a.note ? `: ${a.note}` : ""}
                            <span className="text-muted-foreground"> · {relativeTime(a.createdAt)}</span>
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
