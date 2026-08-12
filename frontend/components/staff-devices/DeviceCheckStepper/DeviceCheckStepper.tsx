"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/findings/StatusBadge";
import { EvidenceUploader } from "@/components/findings/EvidenceUploader";
import { EvidenceList } from "@/components/findings/EvidenceList";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTask } from "@/hooks/useTasks";
import { useInvalidateMyStaffDevice } from "@/hooks/useStaffDevices";
import { canUploadTaskEvidence } from "@/lib/permissions";
import { STAFF_DEVICE_CHECKS } from "@/lib/staff-device-checks";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types";

const SUBMITTABLE_STATUSES: TaskStatus[] = ["ASSIGNED", "IN_PROGRESS"];

export function DeviceCheckStepper({ tasks }: { tasks: Task[] }) {
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const invalidateDevice = useInvalidateMyStaffDevice();
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const activeTitle = STAFF_DEVICE_CHECKS[stepIndex];
  const activeSummary = tasks.find((t) => t.title === activeTitle);
  const { data: detail } = useTask(activeSummary?.id ?? null);
  const isLastStep = stepIndex === STAFF_DEVICE_CHECKS.length - 1;
  const allResolved = STAFF_DEVICE_CHECKS.every(
    (title) => tasks.find((t) => t.title === title)?.status === "RESOLVED",
  );

  const refresh = async () => {
    if (activeSummary) {
      await queryClient.invalidateQueries({ queryKey: ["task", activeSummary.id] });
    }
    await invalidateDevice();
  };

  const submitForReview = async () => {
    if (!detail) return;
    setSubmitting(true);
    if (detail.status === "ASSIGNED") {
      await fetch(`/api/tasks/${detail.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });
    }
    await fetch(`/api/tasks/${detail.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "EVIDENCE_SUBMITTED" }),
    });
    setSubmitting(false);
    await refresh();
    if (!isLastStep) setStepIndex((i) => i + 1);
  };

  const canSubmit =
    !!detail && SUBMITTABLE_STATUSES.includes(detail.status) && detail.evidence.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {STAFF_DEVICE_CHECKS.map((title, i) => {
          const status = tasks.find((t) => t.title === title)?.status;
          const resolved = status === "RESOLVED";
          return (
            <button
              key={title}
              type="button"
              onClick={() => setStepIndex(i)}
              className={cn(
                "flex-1 rounded-md border px-2 py-1.5 text-left text-xs transition-colors",
                i === stepIndex ? "border-aws-blue bg-aws-blue/5" : "border-border hover:bg-accent",
              )}
            >
              <div className="flex items-center gap-1 font-medium">
                {resolved ? (
                  <Check className="h-3 w-3 text-success" />
                ) : (
                  <span className="text-muted-foreground">Step {i + 1}</span>
                )}
              </div>
              <div className="truncate text-muted-foreground">{title}</div>
            </button>
          );
        })}
      </div>

      <Card className="border-border">
        <CardContent className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">{activeTitle}</h3>
            {detail && <StatusBadge status={detail.status} />}
          </div>

          {detail && (
            <>
              <div>
                <h4 className="mb-2 text-xs font-medium text-muted-foreground">Evidence</h4>
                <EvidenceList evidence={detail.evidence} basePath={`/api/tasks/${detail.id}`} />
              </div>

              {currentUser && canUploadTaskEvidence(currentUser, detail) && (
                <EvidenceUploader
                  findingId={detail.id}
                  basePath={`/api/tasks/${detail.id}`}
                  onSuccess={refresh}
                />
              )}

              {detail.status === "RESOLVED" && (
                <p className="text-xs text-success">Approved.</p>
              )}
              {detail.status === "EVIDENCE_SUBMITTED" && (
                <p className="text-xs text-muted-foreground">
                  Submitted — waiting to be picked up for review.
                </p>
              )}
              {detail.status === "UNDER_REVIEW" && (
                <p className="text-xs text-muted-foreground">Currently under admin review.</p>
              )}
            </>
          )}

          <div className="flex items-center justify-between border-t border-border pt-3">
            <Button
              variant="outline"
              size="sm"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            >
              Back
            </Button>
            <div className="flex gap-2">
              {canSubmit && (
                <Button size="sm" disabled={submitting} onClick={submitForReview}>
                  {submitting ? "Submitting..." : "Submit for review"}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                disabled={isLastStep}
                onClick={() => setStepIndex((i) => Math.min(STAFF_DEVICE_CHECKS.length - 1, i + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {allResolved && (
        <p className="text-sm font-medium text-success">
          All checks complete — your device is compliant.
        </p>
      )}
    </div>
  );
}
