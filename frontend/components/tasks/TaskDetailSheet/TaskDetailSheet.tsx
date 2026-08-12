"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/findings/StatusBadge";
import { AssigneePicker } from "@/components/findings/AssigneePicker";
import { EvidenceUploader } from "@/components/findings/EvidenceUploader";
import { EvidenceList } from "@/components/findings/EvidenceList";
import { ReviewActions } from "@/components/findings/ReviewActions";
import { ActivityTimeline } from "@/components/common/ActivityTimeline";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTask } from "@/hooks/useTasks";
import {
  canAssignTask,
  canClaimTaskForReview,
  canReviewTask,
  canStartTaskWork,
  canSubmitTaskForReview,
  canUploadTaskEvidence,
} from "@/lib/permissions";
import type { Severity, Task, TaskStatus } from "@/types";

const SEVERITY_VARIANT: Record<Severity, "default" | "secondary" | "destructive" | "outline"> = {
  CRITICAL: "destructive",
  HIGH: "destructive",
  MEDIUM: "default",
  LOW: "secondary",
  INFO: "outline",
};

const TASK_ACTIVITY_LABEL: Record<string, string> = {
  TASK_CREATED: "created this task",
  ASSIGNED: "assigned this task",
  REASSIGNED: "reassigned this task",
  STATUS_CHANGED: "changed the status",
  EVIDENCE_UPLOADED: "uploaded evidence",
  REVIEW_APPROVED: "approved the evidence",
  REVIEW_REJECTED: "rejected the evidence",
};

function TaskStatusTransitionButton({
  taskId,
  label,
  targetStatus,
}: {
  taskId: string;
  label: string;
  targetStatus: TaskStatus;
}) {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const handleClick = async () => {
    setSubmitting(true);
    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: targetStatus }),
    });
    setSubmitting(false);
    if (res.ok) {
      await queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  };

  return (
    <Button size="sm" disabled={submitting} onClick={handleClick}>
      {label}
    </Button>
  );
}

export function TaskDetailSheet({
  task,
  onOpenChange,
}: {
  task: Task | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: currentUser } = useCurrentUser();
  const { data: detail } = useTask(task?.id ?? null);
  const queryClient = useQueryClient();

  const invalidateTask = async (id: string) => {
    await queryClient.invalidateQueries({ queryKey: ["task", id] });
    await queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };

  return (
    <Sheet open={task !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {task && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                {task.priority && (
                  <Badge variant={SEVERITY_VARIANT[task.priority]}>{task.priority}</Badge>
                )}
                {detail && <StatusBadge status={detail.status} />}
              </div>
              <SheetTitle>{task.title}</SheetTitle>
              {task.description && <SheetDescription>{task.description}</SheetDescription>}
            </SheetHeader>

            <div className="space-y-5 px-4 pb-6 text-sm">
              {detail?.dueDate && (
                <div>
                  <h4 className="mb-1 font-medium text-muted-foreground">Due Date</h4>
                  <p>{new Date(detail.dueDate).toLocaleDateString()}</p>
                </div>
              )}

              {detail?.control && (
                <div>
                  <h4 className="mb-1 font-medium text-muted-foreground">Linked Control</h4>
                  <p>{detail.control.name ?? detail.control.code}</p>
                </div>
              )}

              {detail && (
                <>
                  <div className="space-y-2 border-t border-border pt-4">
                    <h4 className="font-medium text-muted-foreground">Assignee</h4>
                    {currentUser && canAssignTask(currentUser) ? (
                      <AssigneePicker
                        finding={detail}
                        currentUser={currentUser}
                        basePath={`/api/tasks/${detail.id}`}
                        onSuccess={() => invalidateTask(detail.id)}
                      />
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

                  <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                    {currentUser && canStartTaskWork(currentUser, detail) && (
                      <TaskStatusTransitionButton
                        taskId={detail.id}
                        label="Start work"
                        targetStatus="IN_PROGRESS"
                      />
                    )}
                    {currentUser && canSubmitTaskForReview(currentUser, detail) && (
                      <TaskStatusTransitionButton
                        taskId={detail.id}
                        label="Submit for review"
                        targetStatus="EVIDENCE_SUBMITTED"
                      />
                    )}
                    {currentUser && canClaimTaskForReview(currentUser, detail) && (
                      <TaskStatusTransitionButton
                        taskId={detail.id}
                        label="Claim for review"
                        targetStatus="UNDER_REVIEW"
                      />
                    )}
                    {currentUser && detail.status === "UNDER_REVIEW" && canReviewTask(currentUser) && (
                      <ReviewActions
                        findingId={detail.id}
                        basePath={`/api/tasks/${detail.id}`}
                        onSuccess={() => invalidateTask(detail.id)}
                      />
                    )}
                  </div>

                  <div className="space-y-3 border-t border-border pt-4">
                    <h4 className="font-medium text-muted-foreground">Evidence</h4>
                    <EvidenceList evidence={detail.evidence} basePath={`/api/tasks/${detail.id}`} />
                    {canUploadTaskEvidence(currentUser, detail) && (
                      <EvidenceUploader
                        findingId={detail.id}
                        basePath={`/api/tasks/${detail.id}`}
                        onSuccess={() => invalidateTask(detail.id)}
                      />
                    )}
                  </div>

                  <div className="space-y-3 border-t border-border pt-4">
                    <h4 className="font-medium text-muted-foreground">Activity</h4>
                    <ActivityTimeline activity={detail.activity} labelMap={TASK_ACTIVITY_LABEL} />
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
