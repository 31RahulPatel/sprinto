import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/findings/StatusBadge";
import { EvidenceStatusBadge } from "@/components/findings/EvidenceStatusBadge";
import { STAFF_DEVICE_CHECKS } from "@/lib/staff-device-checks";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

export function StaffDeviceCheckBoxes({
  tasks,
  onSelect,
}: {
  tasks: Task[];
  onSelect: (task: Task) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {STAFF_DEVICE_CHECKS.map((title) => {
        const task = tasks.find((t) => t.title === title);
        return (
          <Card
            key={title}
            onClick={() => task && onSelect(task)}
            className={cn(
              "border-border shadow-sm transition-colors",
              task && "cursor-pointer hover:bg-accent",
            )}
          >
            <CardContent className="space-y-2 pt-4">
              <p className="text-sm font-medium">{title}</p>
              {task ? (
                <>
                  <StatusBadge status={task.status} />
                  <div>
                    <EvidenceStatusBadge status={task.evidenceStatus} className="text-[10px]" />
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Not available</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
