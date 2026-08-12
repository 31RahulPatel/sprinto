"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function ReviewActions({
  findingId,
  basePath,
  onSuccess,
}: {
  findingId: string;
  basePath?: string;
  onSuccess?: () => void | Promise<void>;
}) {
  const queryClient = useQueryClient();
  const path = basePath ?? `/api/findings/${findingId}`;
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitReview = async (decision: "APPROVE" | "REJECT", rejectReason?: string) => {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`${path}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, reason: rejectReason }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Failed to submit review.");
      return;
    }

    setRejectOpen(false);
    setReason("");
    if (onSuccess) {
      await onSuccess();
    } else {
      await queryClient.invalidateQueries({ queryKey: ["finding", findingId] });
      await queryClient.invalidateQueries({ queryKey: ["findings"] });
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" disabled={submitting} onClick={() => submitReview("APPROVE")}>
          Approve
        </Button>
        <Button size="sm" variant="outline" disabled={submitting} onClick={() => setRejectOpen(true)}>
          Reject
        </Button>
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject evidence</DialogTitle>
            <DialogDescription>
              Explain what&apos;s missing or incorrect — this is sent back to the assignee.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="e.g. Screenshot doesn't show Block Public Access enabled"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!reason.trim() || submitting}
              onClick={() => submitReview("REJECT", reason.trim())}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
