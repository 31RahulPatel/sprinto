"use client";

import { use, useState } from "react";
import { Construction } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ConnectedAccountsList } from "@/components/scans/ConnectedAccountsList";
import { ScanHistoryTable } from "@/components/scans/ScanHistoryTable";
import { FindingsTable } from "@/components/findings/FindingsTable";
import { ReportsList } from "@/components/reports/ReportsList";
import type { AwsServiceSlug } from "@/types";

const IMPLEMENTED_SERVICES = new Set<AwsServiceSlug>(["s3", "iam", "rds", "vpc", "lambda", "cloudtrail"]);
const TABS = ["scans", "findings", "reports"] as const;
type Tab = (typeof TABS)[number];

export default function ServicePage({ params }: { params: Promise<{ service: string }> }) {
  const { service: serviceParam } = use(params);
  const [tab, setTab] = useState<Tab>("scans");

  const isAll = serviceParam === "all";
  const service = isAll ? undefined : (serviceParam as AwsServiceSlug);
  const label = isAll ? "All Services" : serviceParam.toUpperCase();

  if (!isAll && !IMPLEMENTED_SERVICES.has(serviceParam as AwsServiceSlug)) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-aws-navy dark:text-foreground">
          {label}
        </h1>
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Construction className="h-4 w-4 text-warning" />
              Not available yet
            </CardTitle>
            <CardDescription>
              AWS {label} scanning hasn&apos;t been built yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Support for {label} is planned for a later phase.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-aws-navy dark:text-foreground">{label}</h1>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium capitalize transition-colors",
              tab === t
                ? "border-aws-blue text-aws-blue"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "scans" && (
        <div className="space-y-6">
          <ConnectedAccountsList service={service} />
          <ScanHistoryTable service={service} />
        </div>
      )}

      {tab === "findings" && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <FindingsTable service={service} />
          </CardContent>
        </Card>
      )}

      {tab === "reports" && <ReportsList service={service} />}
    </div>
  );
}
