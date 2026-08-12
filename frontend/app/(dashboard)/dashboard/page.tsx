"use client";

import { useQuery } from "@tanstack/react-query";
import { ServiceStatusGrid } from "@/components/dashboard/ServiceStatusGrid";
import { ComplianceScoreGauge } from "@/components/dashboard/ComplianceScoreGauge";
import { RecentFindingsFeed } from "@/components/dashboard/RecentFindingsFeed";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { DevDashboard } from "@/components/dashboard/DevDashboard";
import { ScanHistoryTable } from "@/components/scans/ScanHistoryTable";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { DashboardSummary } from "@/types";

async function fetchDashboard(): Promise<DashboardSummary> {
  const res = await fetch("/api/dashboard");
  if (!res.ok) throw new Error("Failed to load dashboard");
  return res.json();
}

export default function DashboardPage() {
  const { data: currentUser } = useCurrentUser();
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    enabled: currentUser !== undefined && currentUser?.role !== "DEV",
  });

  if (currentUser?.role === "DEV") {
    return <DevDashboard />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-aws-navy dark:text-foreground">
          Security Overview
        </h1>
        <p className="text-sm text-muted-foreground">Continuous compliance for your AWS environment</p>
      </div>

      <ServiceStatusGrid services={data?.services ?? []} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ComplianceScoreGauge score={data?.complianceScore ?? null} />
            <div className="sm:col-span-2">
              <RecentFindingsFeed />
            </div>
          </div>
          <ScanHistoryTable />
        </div>

        <div className="xl:col-span-1">
          <AlertsPanel />
        </div>
      </div>
    </div>
  );
}
