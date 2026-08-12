"use client";

import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Cloud, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCloudAccounts, accountLabel } from "@/hooks/useCloudAccounts";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { canManageCloudAccounts } from "@/lib/permissions";
import type { AwsServiceSlug } from "@/types";

export function ConnectedAccountsList({ service }: { service?: AwsServiceSlug } = {}) {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const { data: accounts } = useCloudAccounts();
  const canManage = canManageCloudAccounts(currentUser);

  const runScan = async (cloudAccountId: string) => {
    await fetch("/api/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cloudAccountId, service }),
    });
    await queryClient.invalidateQueries({ queryKey: ["scans"] });
  };

  const disconnect = async (id: string) => {
    await fetch(`/api/cloud-accounts/${id}`, { method: "DELETE" });
    await queryClient.invalidateQueries({ queryKey: ["cloud-accounts"] });
    await queryClient.invalidateQueries({ queryKey: ["scans"] });
  };

  if (!accounts || accounts.length === 0) {
    return null;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Connected AWS Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex flex-col gap-3 rounded-md border border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <Cloud className="h-4 w-4 shrink-0 text-aws-blue" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{accountLabel(account)}</div>
                  <div className="text-xs text-muted-foreground">
                    {account.accountId} · {account.region}
                  </div>
                </div>
                <Badge variant="outline">{account.provider}</Badge>
              </div>
              {canManage && (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {service && (
                    <Button size="sm" onClick={() => runScan(account.id)} className="bg-aws-blue hover:brightness-110">
                      <Play className="h-3.5 w-3.5" />
                      Run {service.toUpperCase()} Scan
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => disconnect(account.id)} aria-label="Disconnect">
                    <Trash2 className="h-3.5 w-3.5 text-danger" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
