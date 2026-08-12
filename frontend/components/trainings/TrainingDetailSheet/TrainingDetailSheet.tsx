"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { StatusPill } from "@/components/common/StatusPill";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { canManageTrainings } from "@/lib/permissions";
import { relativeTime } from "@/lib/relative-time";
import type { Training, TrainingStatus } from "@/types";

const STATUS_LABEL: Record<TrainingStatus, string> = {
  COMPLETED: "Completed",
  PENDING: "Pending",
};

const STATUS_VARIANT: Record<TrainingStatus, "default" | "secondary" | "destructive" | "outline"> = {
  COMPLETED: "default",
  PENDING: "secondary",
};

// Keyed by training.id from the parent so selecting a different training remounts this with
// fresh local edit state, instead of syncing state from a changing prop via an effect.
function TrainingDetailSheetBody({ training }: { training: Training }) {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(training.title);
  const [description, setDescription] = useState(training.description);
  const [resourceUrl, setResourceUrl] = useState(training.resourceUrl ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = canManageTrainings(currentUser);

  const saveEdit = async () => {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/trainings/${training.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        resourceUrl: resourceUrl.trim() || undefined,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Failed to save training.");
      return;
    }
    setEditing(false);
    await queryClient.invalidateQueries({ queryKey: ["trainings"] });
  };

  const complete = async () => {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/trainings/${training.id}/complete`, { method: "POST" });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Failed to mark training complete.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["trainings"] });
  };

  return (
    <>
      <SheetHeader>
        <StatusPill status={training.status} labelMap={STATUS_LABEL} variantMap={STATUS_VARIANT} />
        {editing ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-base font-semibold"
          />
        ) : (
          <SheetTitle>{training.title}</SheetTitle>
        )}
        <SheetDescription>
          {training.status === "COMPLETED" && training.completedAt
            ? `You completed this ${relativeTime(training.completedAt)}.`
            : "Review the training material below, then mark it complete."}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-4 px-4 pb-6 text-sm">
        {editing ? (
          <>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[140px] text-sm"
            />
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Resource link</label>
              <Input value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} placeholder="https://..." />
            </div>
          </>
        ) : (
          <>
            <p className="whitespace-pre-wrap text-muted-foreground">{training.description}</p>
            {training.resourceUrl && (
              <a
                href={training.resourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-aws-blue hover:underline"
              >
                Open training material <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </>
        )}

        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          {canManage &&
            (editing ? (
              <>
                <Button variant="outline" onClick={() => setEditing(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button onClick={saveEdit} disabled={submitting || !title.trim() || !description.trim()}>
                  {submitting ? "Saving..." : "Save changes"}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setEditing(true)}>
                Edit
              </Button>
            ))}
          {!editing && (
            <Button onClick={complete} disabled={submitting || training.status === "COMPLETED"}>
              {training.status === "COMPLETED"
                ? "Completed"
                : submitting
                  ? "Saving..."
                  : "Mark complete"}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

export function TrainingDetailSheet({
  training,
  onOpenChange,
}: {
  training: Training | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={training !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {training && <TrainingDetailSheetBody key={training.id} training={training} />}
      </SheetContent>
    </Sheet>
  );
}
