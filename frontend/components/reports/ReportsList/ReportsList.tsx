"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { accountLabel } from "@/hooks/useCloudAccounts";
import type { AwsServiceSlug, Scan, ScanStatus } from "@/types";

async function fetchScans(service?: AwsServiceSlug): Promise<Scan[]> {
  const qs = service ? `?service=${service}` : "";
  const res = await fetch(`/api/scans${qs}`);
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

export function ReportsList({ service }: { service?: AwsServiceSlug } = {}) {
  const { data: scans } = useQuery({
    queryKey: ["scans", service ?? "all"],
    queryFn: () => fetchScans(service),
  });

  if (!scans || scans.length === 0) {
    return <EmptyState message="No scans yet — reports appear here once a scan completes." />;
  }

  return (
    <div className="space-y-3">
      {scans.map((scan, i) => (
        <motion.div
          key={scan.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.04 }}
        >
          <Card className="border-border shadow-sm">
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{accountLabel(scan.cloudAccount)}</span>
                  <span className="text-xs uppercase text-muted-foreground">{scan.service}</span>
                  <Badge variant={STATUS_VARIANT[scan.status]}>{scan.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Completed {formatDate(scan.completedAt)}
                </p>
              </div>

              {scan.status === "COMPLETED" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-2 self-start sm:self-auto"
                  nativeButton={false}
                  render={<a href={`/api/findings/export?scanId=${scan.id}`} download />}
                >
                  <Download className="h-4 w-4" />
                  Download CSV
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {scan.status === "FAILED" ? "Scan failed — no report" : "Report pending"}
                </span>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
