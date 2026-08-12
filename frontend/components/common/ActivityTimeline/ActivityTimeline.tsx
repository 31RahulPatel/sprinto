import { Clock } from "lucide-react";
import { relativeTime } from "@/lib/relative-time";
import type { RecordActivityItem } from "@/types";

export function ActivityTimeline({
  activity,
  labelMap,
}: {
  activity: RecordActivityItem[];
  labelMap: Record<string, string>;
}) {
  if (activity.length === 0) {
    return <p className="text-xs text-muted-foreground">No activity yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {activity.map((a) => (
        <li key={a.id} className="flex items-start gap-2 text-xs">
          <Clock className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
          <p>
            <span className="font-medium">{a.actor.name}</span> {labelMap[a.type] ?? a.type}
            {a.note ? `: ${a.note}` : ""}
            <span className="text-muted-foreground"> · {relativeTime(a.createdAt)}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}
