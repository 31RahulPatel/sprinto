"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { StatusPill } from "@/components/common/StatusPill";
import { ActivityTimeline } from "@/components/common/ActivityTimeline";
import { AssigneePicker } from "@/components/findings/AssigneePicker";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePerson } from "@/hooks/usePeople";
import { canAssignPerson, canAssignTask } from "@/lib/permissions";
import type { Person, PersonStatus, Task } from "@/types";

const PERSON_STATUS_LABEL: Record<PersonStatus, string> = {
  ACTIVE: "Active",
  OFFBOARDING: "Offboarding",
  INACTIVE: "Inactive",
};

const PERSON_STATUS_VARIANT: Record<PersonStatus, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  OFFBOARDING: "secondary",
  INACTIVE: "outline",
};

const ACTIVITY_LABEL: Record<string, string> = {
  RECORD_CREATED: "added this person",
  RECORD_UPDATED: "updated this person",
  CONTROL_LINKED: "linked a compliance control",
  ASSIGNED: "assigned this",
  REASSIGNED: "reassigned this",
  STATUS_CHANGED: "changed the status",
  TASK_CREATED: "created a task",
  EVIDENCE_UPLOADED: "uploaded evidence",
  REVIEW_APPROVED: "approved the evidence",
  REVIEW_REJECTED: "rejected the evidence",
};

export function PersonDetailSheet({
  person,
  onOpenChange,
}: {
  person: Person | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: currentUser } = useCurrentUser();
  const { data: detail } = usePerson(person?.id ?? null);
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  return (
    <>
      <Sheet open={person !== null} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {person && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  {detail && (
                    <StatusPill
                      status={detail.status}
                      labelMap={PERSON_STATUS_LABEL}
                      variantMap={PERSON_STATUS_VARIANT}
                    />
                  )}
                  {detail?.department && (
                    <span className="text-xs uppercase text-muted-foreground">{detail.department}</span>
                  )}
                </div>
                <SheetTitle>{person.fullName}</SheetTitle>
                {detail?.jobTitle && <SheetDescription>{detail.jobTitle}</SheetDescription>}
              </SheetHeader>

              <div className="space-y-5 px-4 pb-6 text-sm">
                <div>
                  <h4 className="mb-1 font-medium text-muted-foreground">Email</h4>
                  <p>{person.email}</p>
                </div>

                {detail?.employmentType && (
                  <div>
                    <h4 className="mb-1 font-medium text-muted-foreground">Employment Type</h4>
                    <p>{detail.employmentType}</p>
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
                      <h4 className="font-medium text-muted-foreground">Compliance Owner</h4>
                      {currentUser && canAssignPerson(currentUser) ? (
                        <AssigneePicker
                          finding={detail}
                          currentUser={currentUser}
                          basePath={`/api/people/${detail.id}`}
                          onSuccess={async () => {
                            await queryClient.invalidateQueries({ queryKey: ["person", detail.id] });
                            await queryClient.invalidateQueries({ queryKey: ["people"] });
                          }}
                        />
                      ) : (
                        <p>{detail.assignee?.name ?? "Unassigned"}</p>
                      )}
                    </div>

                    <div className="space-y-3 border-t border-border pt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-muted-foreground">Tasks ({detail.tasks.length})</h4>
                        {currentUser && canAssignTask(currentUser) && (
                          <CreateTaskDialog
                            entityType="PERSON"
                            entityId={detail.id}
                            invalidateKeys={[["person", detail.id], ["tasks"]]}
                          />
                        )}
                      </div>
                      <TaskList
                        tasks={detail.tasks}
                        onSelect={setSelectedTask}
                        emptyMessage="No tasks yet — assign a compliance owner to create one."
                      />
                    </div>

                    <div className="space-y-3 border-t border-border pt-4">
                      <h4 className="font-medium text-muted-foreground">Activity</h4>
                      <ActivityTimeline activity={detail.activity} labelMap={ACTIVITY_LABEL} />
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <TaskDetailSheet task={selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)} />
    </>
  );
}
