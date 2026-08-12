import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/findings/StatusBadge";
import { EvidenceStatusBadge } from "@/components/findings/EvidenceStatusBadge";
import { cn } from "@/lib/utils";
import type { Finding, Severity } from "@/types";

const SEVERITY_VARIANT: Record<Severity, "default" | "secondary" | "destructive" | "outline"> = {
  CRITICAL: "destructive",
  HIGH: "destructive",
  MEDIUM: "default",
  LOW: "secondary",
  INFO: "outline",
};

function isOverdue(finding: Finding) {
  return !!finding.dueDate && finding.status !== "RESOLVED" && new Date(finding.dueDate) < new Date();
}

// Shared by the "assigned to me" and "needs my review" findings tables on the Assigned
// Tasks page — the only difference between the two is whether the submitter's name matters.
export function FindingsAssignedTable({
  findings,
  onSelect,
  emptyMessage,
  showAssignee = false,
}: {
  findings: Finding[];
  onSelect: (finding: Finding) => void;
  emptyMessage: string;
  showAssignee?: boolean;
}) {
  if (findings.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="pb-2 font-medium">Task Name</th>
            <th className="pb-2 font-medium">Finding</th>
            <th className="pb-2 font-medium">Compliance Control</th>
            {showAssignee && <th className="pb-2 font-medium">Submitted By</th>}
            <th className="pb-2 font-medium">Priority</th>
            <th className="pb-2 font-medium">Due Date</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Evidence Status</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((finding) => (
            <tr
              key={finding.id}
              onClick={() => onSelect(finding)}
              className="cursor-pointer border-b border-border align-top transition-colors last:border-0 hover:bg-accent"
            >
              <td className="max-w-xs truncate py-2 font-medium" title={finding.title}>
                {finding.title}
              </td>
              <td className="max-w-[10rem] truncate py-2" title={finding.resource}>
                <span className="mr-1 text-xs uppercase text-muted-foreground">
                  {finding.service}
                </span>
                <span className="font-mono text-xs">{finding.resource}</span>
              </td>
              <td className="py-2 text-muted-foreground">
                {finding.control ? finding.control.name ?? finding.control.code : "—"}
              </td>
              {showAssignee && (
                <td className="py-2 text-muted-foreground">
                  {finding.assignee?.name ?? "Unassigned"}
                </td>
              )}
              <td className="py-2">
                <Badge variant={SEVERITY_VARIANT[finding.severity]}>{finding.severity}</Badge>
              </td>
              <td className={cn("py-2", isOverdue(finding) && "font-medium text-danger")}>
                {finding.dueDate ? new Date(finding.dueDate).toLocaleDateString() : "—"}
              </td>
              <td className="py-2">
                <StatusBadge status={finding.status} />
              </td>
              <td className="py-2">
                <EvidenceStatusBadge status={finding.evidenceStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
