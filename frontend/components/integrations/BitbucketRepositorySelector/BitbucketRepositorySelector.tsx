"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Lock, Globe } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { useBitbucketRepositories } from "@/hooks/useBitbucketRepositories";

export function BitbucketRepositorySelector({ integrationId }: { integrationId: string }) {
  const queryClient = useQueryClient();
  const { data: repos, isLoading, error: loadError } = useBitbucketRepositories(integrationId, true);
  const [pending, setPending] = useState<string | null>(null);

  const toggle = async (slug: string, selected: boolean) => {
    setPending(slug);
    await fetch(`/api/integrations/${integrationId}/repositories/${slug}/selection`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected }),
    });
    setPending(null);
    await queryClient.invalidateQueries({ queryKey: ["bitbucket-repositories", integrationId] });
    await queryClient.invalidateQueries({ queryKey: ["integrations"] });
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading repositories from Bitbucket...</p>;
  }

  if (loadError) {
    return (
      <p className="text-sm text-danger">
        Couldn&apos;t load repositories — the connection may need reauthorizing.
      </p>
    );
  }

  if (!repos || repos.length === 0) {
    return <EmptyState message="No repositories found in this workspace." />;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Select which repositories Sprinto can scan for compliance-relevant configuration.
      </p>
      <ul className="max-h-72 space-y-1 overflow-y-auto">
        {repos.map((repo) => (
          <li
            key={repo.slug}
            className="flex items-center justify-between gap-2 rounded-md border border-border p-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              {repo.isPrivate ? (
                <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate text-sm">{repo.name}</span>
            </div>
            <input
              type="checkbox"
              checked={repo.selectedForScan}
              disabled={pending === repo.slug}
              onChange={(e) => toggle(repo.slug, e.target.checked)}
              className="h-4 w-4 shrink-0 accent-aws-blue"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
