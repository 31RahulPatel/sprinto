"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useBitbucketWorkspaces } from "@/hooks/useBitbucketWorkspaces";

export function BitbucketWorkspacePicker({ integrationId }: { integrationId: string }) {
  const queryClient = useQueryClient();
  const { data: workspaces, isLoading } = useBitbucketWorkspaces(integrationId);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectWorkspace = async (slug: string, name: string) => {
    setSubmitting(slug);
    setError(null);
    const res = await fetch(`/api/integrations/${integrationId}/workspace`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceSlug: slug, workspaceName: name }),
    });
    setSubmitting(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Failed to select workspace.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["integrations"] });
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading your Bitbucket workspaces...</p>;
  }

  if (!workspaces || workspaces.length === 0) {
    return <p className="text-sm text-muted-foreground">No workspaces found on this Bitbucket account.</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Select a workspace to connect:</p>
      <ul className="space-y-1.5">
        {workspaces.map((w) => (
          <li key={w.slug} className="flex items-center justify-between rounded-md border border-border p-2">
            <span className="text-sm font-medium">{w.name}</span>
            <Button
              size="sm"
              disabled={submitting !== null}
              onClick={() => selectWorkspace(w.slug, w.name)}
            >
              {submitting === w.slug ? "Connecting..." : "Use this workspace"}
            </Button>
          </li>
        ))}
      </ul>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
