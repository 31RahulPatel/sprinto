"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { useCloudAccounts, accountLabel } from "@/hooks/useCloudAccounts";
import type { AwsServiceSlug, Scan, ScanStatus } from "@/types";

async function fetchScans(params: URLSearchParams): Promise<Scan[]> {
  const qs = params.toString();
  const res = await fetch(qs ? `/api/scans?${qs}` : "/api/scans");
  if (!res.ok) throw new Error("Failed to load scans");
  return res.json();
}

const STATUS_VARIANT: Record<ScanStatus, "default" | "secondary" | "destructive" | "outline"> = {
  QUEUED: "secondary",
  RUNNING: "default",
  COMPLETED: "outline",
  FAILED: "destructive",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export function ScanHistoryTable({ service }: { service?: AwsServiceSlug } = {}) {
  const [status, setStatus] = useState("ALL");
  const [accountId, setAccountId] = useState("ALL");
  const { data: accounts } = useCloudAccounts();

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (service) p.set("service", service);
    if (status !== "ALL") p.set("status", status);
    if (accountId !== "ALL") p.set("cloudAccountId", accountId);
    return p;
  }, [service, status, accountId]);

  const { data: scans } = useQuery({
    queryKey: ["scans", params.toString()],
    queryFn: () => fetchScans(params),
    refetchInterval: (query) => {
      const data = query.state.data as Scan[] | undefined;
      const active = data?.some((s) => s.status === "QUEUED" || s.status === "RUNNING");
      return active ? 3000 : false;
    },
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Scan History</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={status} onValueChange={(v) => v && setStatus(v)}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="QUEUED">Queued</SelectItem>
                <SelectItem value="RUNNING">Running</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
            {accounts && accounts.length > 1 && (
              <Select value={accountId} onValueChange={(v) => v && setAccountId(v)}>
                <SelectTrigger className="h-8 w-[160px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All accounts</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {accountLabel(a)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!scans || scans.length === 0 ? (
            <EmptyState message="No scans match these filters." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Account</th>
                    <th className="hidden pb-2 font-medium sm:table-cell">Service</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="hidden pb-2 font-medium md:table-cell">Started</th>
                    <th className="pb-2 font-medium">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {scans.map((scan) => (
                    <tr key={scan.id} className="border-b border-border last:border-0">
                      <td className="py-2">{accountLabel(scan.cloudAccount)}</td>
                      <td className="hidden py-2 uppercase sm:table-cell">{scan.service}</td>
                      <td className="py-2">
                        <Badge variant={STATUS_VARIANT[scan.status]}>{scan.status}</Badge>
                        {scan.status === "FAILED" && scan.errorMessage && (
                          <p className="mt-1 max-w-[10rem] truncate text-xs text-danger sm:max-w-xs" title={scan.errorMessage}>
                            {scan.errorMessage}
                          </p>
                        )}
                      </td>
                      <td className="hidden py-2 text-muted-foreground md:table-cell">{formatDate(scan.startedAt)}</td>
                      <td className="py-2 text-muted-foreground">{formatDate(scan.completedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
