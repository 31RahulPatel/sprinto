"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/findings/StatusBadge";
import { EvidenceStatusBadge } from "@/components/findings/EvidenceStatusBadge";
import { FindingDetailSheet } from "@/components/findings/FindingDetailSheet";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { useAssignedTasks } from "@/hooks/useAssignedTasks";
import { useAssignedGenericTasks } from "@/hooks/useAssignedGenericTasks";
import { cn } from "@/lib/utils";
import type { Finding, Severity, Task } from "@/types";

const SEVERITY_VARIANT: Record<Severity, "default" | "secondary" | "destructive" | "outline"> = {
  CRITICAL: "destructive",
  HIGH: "destructive",
  MEDIUM: "default",
  LOW: "secondary",
  INFO: "outline",
};

function isOverdue(task: Finding) {
  return !!task.dueDate && task.status !== "RESOLVED" && new Date(task.dueDate) < new Date();
}

// Shared between the (Admin/Super Admin) "Assigned Tasks" page and the Dev dashboard, which
// folds this same summary in under its checklist cards instead of having its own nav entry.
export function AssignedWorkSummary() {
  const { data: tasks } = useAssignedTasks();
  const { data: genericTasks } = useAssignedGenericTasks();
  const [selected, setSelected] = useState<Finding | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  return (
    <>
      <Card className="border-border shadow-sm">
        <CardContent className="pt-4">
          {!tasks || tasks.length === 0 ? (
            <EmptyState message="You have no findings assigned to you right now." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Task Name</th>
                    <th className="pb-2 font-medium">Finding</th>
                    <th className="pb-2 font-medium">Compliance Control</th>
                    <th className="pb-2 font-medium">Priority</th>
                    <th className="pb-2 font-medium">Due Date</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Evidence Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => setSelected(task)}
                      className="cursor-pointer border-b border-border align-top transition-colors last:border-0 hover:bg-accent"
                    >
                      <td className="max-w-xs truncate py-2 font-medium" title={task.title}>
                        {task.title}
                      </td>
                      <td className="max-w-[10rem] truncate py-2" title={task.resource}>
                        <span className="mr-1 text-xs uppercase text-muted-foreground">
                          {task.service}
                        </span>
                        <span className="font-mono text-xs">{task.resource}</span>
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {task.control ? task.control.name ?? task.control.code : "—"}
                      </td>
                      <td className="py-2">
                        <Badge variant={SEVERITY_VARIANT[task.severity]}>{task.severity}</Badge>
                      </td>
                      <td className={cn("py-2", isOverdue(task) && "font-medium text-danger")}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-2">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="py-2">
                        <EvidenceStatusBadge status={task.evidenceStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
