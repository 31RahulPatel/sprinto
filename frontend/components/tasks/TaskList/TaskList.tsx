import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/findings/StatusBadge";
import { EvidenceStatusBadge } from "@/components/findings/EvidenceStatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";
import type { Severity, Task } from "@/types";

const SEVERITY_VARIANT: Record<Severity, "default" | "secondary" | "destructive" | "outline"> = {
  CRITICAL: "destructive",
  HIGH: "destructive",
  MEDIUM: "default",
  LOW: "secondary",
  INFO: "outline",
};

function isOverdue(task: Task) {
  return !!task.dueDate && task.status !== "RESOLVED" && new Date(task.dueDate) < new Date();
}

export function TaskList({
  tasks,
  onSelect,
  emptyMessage = "No tasks yet.",
}: {
  tasks: Task[];
  onSelect: (task: Task) => void;
  emptyMessage?: string;
}) {
  if (tasks.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="pb-2 font-medium">Task</th>
            <th className="pb-2 font-medium">Priority</th>
            <th className="pb-2 font-medium">Assignee</th>
            <th className="pb-2 font-medium">Due Date</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Evidence</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr
              key={task.id}
              onClick={() => onSelect(task)}
              className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-accent"
            >
              <td className="max-w-xs truncate py-2 font-medium" title={task.title}>
                {task.title}
              </td>
              <td className="py-2">
                {task.priority ? (
                  <Badge variant={SEVERITY_VARIANT[task.priority]}>{task.priority}</Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="py-2 text-muted-foreground">{task.assignee?.name ?? "Unassigned"}</td>
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
  );
}
