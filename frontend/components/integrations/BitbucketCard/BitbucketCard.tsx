"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GitBranch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BitbucketWorkspacePicker } from "@/components/integrations/BitbucketWorkspacePicker";
import { BitbucketRepositorySelector } from "@/components/integrations/BitbucketRepositorySelector";
import { BitbucketRepositoryDetail } from "@/components/integrations/BitbucketRepositoryDetail";
import { useIntegrations } from "@/hooks/useIntegrations";
import { relativeTime } from "@/lib/relative-time";

export function BitbucketCard() {
  const queryClient = useQueryClient();
  const [polling, setPolling] = useState(false);
  const { data: integrations } = useIntegrations(polling ? 3000 : false);
  const integration = integrations?.find((i) => i.provider === "BITBUCKET") ?? null;

  const [manageOpen, setManageOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (polling && integration && integration.status !== "CONNECTED") {
      return;
    }
    if (polling) {
      const timeout = setTimeout(() => setPolling(false), 15000);
      return () => clearTimeout(timeout);
    }
  }, [polling, integration]);

  const connect = async () => {
    const res = await fetch("/api/integrations/bitbucket/authorize-url");
    if (!res.ok) return;
    const data = await res.json();
    window.location.href = data.url;
  };

  const disconnect = async () => {
    if (!integration) return;
    setDisconnecting(true);
    await fetch(`/api/integrations/${integration.id}`, { method: "DELETE" });
    setDisconnecting(false);
    setManageOpen(false);
    await queryClient.invalidateQueries({ queryKey: ["integrations"] });
  };

  const syncNow = async () => {
    if (!integration) return;
    setSyncing(true);
    await fetch(`/api/integrations/${integration.id}/sync`, { method: "POST" });
    setSyncing(false);
    setPolling(true);
  };

  if (!integration) {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="h-4 w-4" />
            Bitbucket
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Connect your Bitbucket workspace to automatically collect repository and security
            compliance evidence.
          </p>
          <Button size="sm" onClick={connect}>
            Connect Bitbucket
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!integration.workspaceSlug) {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="h-4 w-4" />
            Bitbucket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BitbucketWorkspacePicker integrationId={integration.id} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Bitbucket
          </span>
          {integration.status === "CONNECTED" ? (
            <Badge>Connected</Badge>
          ) : (
            <Badge variant="destructive">Connection Error</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1 text-sm">
          <p>
            Workspace: <span className="font-mono">{integration.workspaceName}</span>
          </p>
          <p>Repositories: {integration._count.repositories}</p>
          <p className="text-muted-foreground">
            Last Sync: {integration.lastSyncedAt ? relativeTime(integration.lastSyncedAt) : "Never"}
          </p>
          {integration.errorMessage && (
            <p className="text-xs text-danger">{integration.errorMessage}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setManageOpen(true)}>
            Manage
          </Button>
          <Button size="sm" disabled={syncing || polling} onClick={syncNow}>
            {syncing || polling ? "Syncing..." : "Sync Now"}
          </Button>
          <Button size="sm" variant="destructive" disabled={disconnecting} onClick={disconnect}>
            Disconnect
          </Button>
        </div>
      </CardContent>

      <Sheet open={manageOpen} onOpenChange={setManageOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Manage Bitbucket</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 px-4 pb-6">
            <BitbucketRepositorySelector integrationId={integration.id} />
            <div className="border-t border-border pt-4">
              <BitbucketRepositoryDetail integrationId={integration.id} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
