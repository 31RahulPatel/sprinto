"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { StatusPill } from "@/components/common/StatusPill";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { canManagePolicies } from "@/lib/permissions";
import { relativeTime } from "@/lib/relative-time";
import type { Policy, PolicyStatus } from "@/types";

const STATUS_LABEL: Record<PolicyStatus, string> = {
  ACCEPTED: "Accepted",
  PENDING: "Pending",
};

const STATUS_VARIANT: Record<PolicyStatus, "default" | "secondary" | "destructive" | "outline"> = {
  ACCEPTED: "default",
  PENDING: "secondary",
};

// Keyed by policy.id from the parent so selecting a different policy remounts this with fresh
// local edit state, instead of syncing state from a changing prop via an effect.
function PolicyDetailSheetBody({ policy }: { policy: Policy }) {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(policy.title);
  const [content, setContent] = useState(policy.content);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = canManagePolicies(currentUser);

  const saveEdit = async () => {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/policies/${policy.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), content: content.trim() }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Failed to save policy.");
      return;
    }
    setEditing(false);
    await queryClient.invalidateQueries({ queryKey: ["policies"] });
  };

  const accept = async () => {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/policies/${policy.id}/accept`, { method: "POST" });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Failed to accept policy.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["policies"] });
  };

  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-2">
          <StatusPill status={policy.status} labelMap={STATUS_LABEL} variantMap={STATUS_VARIANT} />
          <span className="text-xs text-muted-foreground">v{policy.version}</span>
        </div>
        {editing ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-base font-semibold"
          />
        ) : (
          <SheetTitle>{policy.title}</SheetTitle>
        )}
        <SheetDescription>
          {policy.status === "ACCEPTED" && policy.acceptedAt
            ? `You accepted this ${relativeTime(policy.acceptedAt)}.`
            : "Read the policy below and accept it to acknowledge you understand it."}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-4 px-4 pb-6 text-sm">
        {editing ? (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[240px] text-sm"
          />
        ) : (
          <p className="whitespace-pre-wrap text-muted-foreground">{policy.content}</p>
        )}

        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          {canManage &&
            (editing ? (
              <>
                <Button variant="outline" onClick={() => setEditing(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button onClick={saveEdit} disabled={submitting || !title.trim() || !content.trim()}>
                  {submitting ? "Saving..." : "Save changes"}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setEditing(true)}>
                Edit
              </Button>
            ))}
          {!editing && (
            <Button onClick={accept} disabled={submitting || policy.status === "ACCEPTED"}>
              {policy.status === "ACCEPTED" ? "Accepted" : submitting ? "Accepting..." : "Accept policy"}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

export function PolicyDetailSheet({
  policy,
  onOpenChange,
}: {
  policy: Policy | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={policy !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {policy && <PolicyDetailSheetBody key={policy.id} policy={policy} />}
      </SheetContent>
    </Sheet>
  );
}
