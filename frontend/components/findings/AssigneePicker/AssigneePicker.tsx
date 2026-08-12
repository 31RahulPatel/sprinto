"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrgMembers } from "@/hooks/useOrgMembers";
import type { User } from "@/types";

interface AssignableRecord {
  id: string;
  assigneeId: string | null;
}

export function AssigneePicker({
  finding,
  currentUser,
  basePath,
  onSuccess,
}: {
  finding: AssignableRecord;
  currentUser: User;
  basePath?: string;
  onSuccess?: () => void | Promise<void>;
}) {
  const queryClient = useQueryClient();
  const { data: members } = useOrgMembers(true);
  const [selected, setSelected] = useState(finding.assigneeId ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const path = basePath ?? `/api/findings/${finding.id}`;

  const assign = async (assigneeId: string) => {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`${path}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeId }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Failed to assign.");
      return;
    }
    if (onSuccess) {
      await onSuccess();
    } else {
      await queryClient.invalidateQueries({ queryKey: ["finding", finding.id] });
      await queryClient.invalidateQueries({ queryKey: ["findings"] });
    }
  };

  if (!currentUser.organizationId) {
    return (
      <div className="space-y-1.5">
        <Button
          size="sm"
          disabled={submitting || finding.assigneeId === currentUser.id}
          onClick={() => assign(currentUser.id)}
        >
          {finding.assigneeId === currentUser.id ? "You own this finding" : "Take ownership"}
        </Button>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={selected} onValueChange={(v) => v && setSelected(v)}>
        <SelectTrigger className="h-8 w-[200px] text-xs">
          <SelectValue placeholder="Select a teammate" />
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
      <Button
        size="sm"
        disabled={!selected || submitting || selected === finding.assigneeId}
        onClick={() => assign(selected)}
      >
        {finding.assigneeId ? "Reassign" : "Assign"}
      </Button>
      {error && <p className="w-full text-xs text-danger">{error}</p>}
    </div>
  );
}
