"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useOrgMembers } from "@/hooks/useOrgMembers";
import type { Severity } from "@/types";

const PRIORITY_OPTIONS: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];

export function CreateTaskDialog({
  entityType,
  entityId,
  invalidateKeys,
  triggerLabel = "Add task",
}: {
  entityType?: string;
  entityId?: string;
  invalidateKeys: string[][];
  triggerLabel?: string;
}) {
  const queryClient = useQueryClient();
  const { data: members } = useOrgMembers(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Severity | "">("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setDescription("");
    setPriority("");
    setAssigneeId("");
    setDueDate("");
    setError(null);
  };

  const submit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || undefined,
        priority: priority || undefined,
        assigneeId: assigneeId || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        entityType,
        entityId,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Failed to create task.");
      return;
    }
    setOpen(false);
    reset();
    await Promise.all(invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: key })));
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create task</DialogTitle>
            <DialogDescription>Assign follow-up work and track it to resolution.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Renew vendor contract"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                <Select value={priority} onValueChange={(v) => setPriority((v as Severity) || "")}>
                  <SelectTrigger className="h-8 w-full text-xs">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Due date</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Assignee</label>
              <Select value={assigneeId} onValueChange={(v) => setAssigneeId(v || "")}>
                <SelectTrigger className="h-8 w-full text-xs">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {members
                    ?.filter((m) => m.status === "ACTIVE")
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-xs text-danger">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!title.trim() || submitting} onClick={submit}>
              {submitting ? "Creating..." : "Create task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
