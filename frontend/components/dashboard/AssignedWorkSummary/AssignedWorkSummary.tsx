"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FindingsAssignedTable } from "@/components/findings/FindingsAssignedTable";
import { FindingDetailSheet } from "@/components/findings/FindingDetailSheet";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { useAssignedTasks } from "@/hooks/useAssignedTasks";
import { useAssignedGenericTasks } from "@/hooks/useAssignedGenericTasks";
import { useFindingsNeedingReview } from "@/hooks/useFindingsNeedingReview";
import { useTasksNeedingReview } from "@/hooks/useTasksNeedingReview";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { canReview, canReviewTask } from "@/lib/permissions";
import type { Finding, Task } from "@/types";

// Shared between the (Admin/Super Admin) "Assigned Tasks" page and the Dev dashboard, which
// folds this same summary in under its checklist cards instead of having its own nav entry.
// The "needs your review" sections only fetch/render for roles with review permission — a
// Dev never sees them, since canReview/canReviewTask gate both the query and the section.
export function AssignedWorkSummary() {
  const { data: currentUser } = useCurrentUser();
  const { data: tasks } = useAssignedTasks();
  const { data: genericTasks } = useAssignedGenericTasks();
  const { data: findingsToReview } = useFindingsNeedingReview();
  const { data: tasksToReview } = useTasksNeedingReview();
  const [selected, setSelected] = useState<Finding | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const showFindingReview = canReview(currentUser);
  const showTaskReview = canReviewTask(currentUser);

  return (
    <>
      {showFindingReview && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-aws-navy dark:text-foreground">
            Findings needing your review
          </h2>
          <Card className="border-border shadow-sm">
            <CardContent className="pt-4">
              <FindingsAssignedTable
                findings={findingsToReview ?? []}
                onSelect={setSelected}
                emptyMessage="Nothing is waiting on your review right now."
                showAssignee
              />
            </CardContent>
          </Card>
        </div>
      )}

      {showTaskReview && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-aws-navy dark:text-foreground">
            Tasks needing your review
          </h2>
          <Card className="border-border shadow-sm">
            <CardContent className="pt-4">
              <TaskList
                tasks={tasksToReview ?? []}
                onSelect={setSelectedTask}
                emptyMessage="Nothing is waiting on your review right now."
              />
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-border shadow-sm">
        <CardContent className="pt-4">
          <FindingsAssignedTable
            findings={tasks ?? []}
            onSelect={setSelected}
            emptyMessage="You have no findings assigned to you right now."
          />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-aws-navy dark:text-foreground">Tasks assigned to me</h2>
        <Card className="border-border shadow-sm">
          <CardContent className="pt-4">
            <TaskList
              tasks={genericTasks ?? []}
              onSelect={setSelectedTask}
              emptyMessage="You have no Data Library tasks assigned to you right now."
            />
          </CardContent>
        </Card>
      </div>

      <FindingDetailSheet finding={selected} onOpenChange={(open) => !open && setSelected(null)} />
      <TaskDetailSheet task={selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)} />
    </>
  );
}
