"use client";

import { ShieldCheck, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { useSyncedRepositories } from "@/hooks/useBitbucketRepositories";
import { useIntegrationMembers } from "@/hooks/useIntegrationMembers";
import { relativeTime } from "@/lib/relative-time";

export function BitbucketRepositoryDetail({ integrationId }: { integrationId: string }) {
  const { data: repos } = useSyncedRepositories(integrationId);
  const { data: members } = useIntegrationMembers(integrationId);

  return (
    <div className="space-y-5">
      <div>
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Synced Repositories</h4>
        {!repos || repos.length === 0 ? (
          <EmptyState message="No synced data yet — select repositories and run Sync Now." />
        ) : (
          <ul className="space-y-2">
            {repos.map((repo) => (
              <li key={repo.id} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{repo.name}</span>
                  <span className="text-xs text-muted-foreground">
                    Synced {relativeTime(repo.updatedAt)}
                  </span>
                </div>
                {repo.branches.length === 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">No branches synced.</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {repo.branches.map((branch) => (
                      <li key={branch.id} className="flex items-center gap-2 text-xs">
                        {branch.requiresApprovals ? (
                          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" />
                        ) : (
                          <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-warning" />
                        )}
                        <span className="font-mono">{branch.name}</span>
                        {branch.isMainBranch && <Badge variant="outline">main</Badge>}
                        <span className="text-muted-foreground">
                          {branch.requiresApprovals
                            ? `Requires ${branch.minApprovals ?? "?"} approval(s) to merge`
                            : "No merge-approval restriction"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Workspace Members</h4>
        {!members || members.length === 0 ? (
          <p className="text-xs text-muted-foreground">No member data synced yet.</p>
        ) : (
          <ul className="space-y-1">
            {members.map((m) => (
              <li
                key={m.accountId}
                className="flex items-center justify-between rounded-md border border-border px-2 py-1.5 text-sm"
              >
                <span>{m.displayName}</span>
                <Badge variant="outline">{m.permission}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
