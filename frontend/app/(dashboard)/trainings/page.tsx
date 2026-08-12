"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusPill } from "@/components/common/StatusPill";
import { CreateTrainingDialog } from "@/components/trainings/CreateTrainingDialog";
import { TrainingDetailSheet } from "@/components/trainings/TrainingDetailSheet";
import { useTrainings } from "@/hooks/useTrainings";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { canManageTrainings } from "@/lib/permissions";
import { relativeTime } from "@/lib/relative-time";
import type { TrainingStatus } from "@/types";

const STATUS_LABEL: Record<TrainingStatus, string> = {
  COMPLETED: "Completed",
  PENDING: "Pending",
};

const STATUS_VARIANT: Record<TrainingStatus, "default" | "secondary" | "destructive" | "outline"> = {
  COMPLETED: "default",
  PENDING: "secondary",
};

export default function TrainingsPage() {
  const { data: currentUser } = useCurrentUser();
  const { data: trainings } = useTrainings();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Derived from the live query (not a frozen snapshot) so the open sheet reflects a
  // complete/edit mutation's refetch immediately instead of only after closing and reopening.
  const selected = trainings?.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-aws-navy dark:text-foreground">Trainings</h1>
        {canManageTrainings(currentUser) && <CreateTrainingDialog />}
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">All Trainings</CardTitle>
        </CardHeader>
        <CardContent>
          {!trainings || trainings.length === 0 ? (
            <EmptyState message="No trainings published yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Title</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {trainings.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedId(t.id)}
                      className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-accent"
                    >
                      <td className="py-2 font-medium">{t.title}</td>
                      <td className="py-2">
                        <StatusPill status={t.status} labelMap={STATUS_LABEL} variantMap={STATUS_VARIANT} />
                      </td>
                      <td className="py-2 text-muted-foreground">{relativeTime(t.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <TrainingDetailSheet training={selected} onOpenChange={(open) => !open && setSelectedId(null)} />
    </div>
  );
}
