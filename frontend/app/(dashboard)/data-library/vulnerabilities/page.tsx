"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusPill } from "@/components/common/StatusPill";
import { VulnerabilityDetailSheet } from "@/components/vulnerabilities/VulnerabilityDetailSheet";
import { CreateVulnerabilityDialog } from "@/components/vulnerabilities/CreateVulnerabilityDialog";
import { useVulnerabilities } from "@/hooks/useVulnerabilities";
import type { Severity, Vulnerability, VulnerabilityStatus } from "@/types";

const SEVERITY_VARIANT: Record<Severity, "default" | "secondary" | "destructive" | "outline"> = {
  CRITICAL: "destructive",
  HIGH: "destructive",
  MEDIUM: "default",
  LOW: "secondary",
  INFO: "outline",
};

const VULN_STATUS_LABEL: Record<VulnerabilityStatus, string> = {
  OPEN: "Open",
  IN_REMEDIATION: "In Remediation",
  RESOLVED: "Resolved",
  ACCEPTED_RISK: "Accepted Risk",
};

const VULN_STATUS_VARIANT: Record<VulnerabilityStatus, "default" | "secondary" | "destructive" | "outline"> = {
  OPEN: "destructive",
  IN_REMEDIATION: "secondary",
  RESOLVED: "default",
  ACCEPTED_RISK: "outline",
};

export default function VulnerabilitiesPage() {
  const [severity, setSeverity] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Vulnerability | null>(null);

  const { data: vulnerabilities } = useVulnerabilities({ severity, status, search });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-aws-navy dark:text-foreground">Vulnerabilities</h1>
        <CreateVulnerabilityDialog />
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vulnerabilities..."
                className="h-8 w-56 pl-8 text-xs"
              />
            </div>
            <Select value={severity || "all"} onValueChange={(v) => setSeverity(!v || v === "all" ? "" : v)}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"] as Severity[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status || "all"} onValueChange={(v) => setStatus(!v || v === "all" ? "" : v)}>
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {(Object.keys(VULN_STATUS_LABEL) as VulnerabilityStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {VULN_STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!vulnerabilities || vulnerabilities.length === 0 ? (
            <EmptyState message="No vulnerabilities yet — report one manually, or connect a scanning integration." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Vulnerability</th>
                    <th className="pb-2 font-medium">Severity</th>
                    <th className="pb-2 font-medium">Asset</th>
                    <th className="pb-2 font-medium">Assignee</th>
                    <th className="pb-2 font-medium">Control</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vulnerabilities.map((v) => (
                    <tr
                      key={v.id}
                      onClick={() => setSelected(v)}
                      className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-accent"
                    >
                      <td className="max-w-xs truncate py-2 font-medium" title={v.title}>
                        {v.title}
                      </td>
                      <td className="py-2">
                        <Badge variant={SEVERITY_VARIANT[v.severity]}>{v.severity}</Badge>
                      </td>
                      <td className="max-w-[10rem] truncate py-2 font-mono text-xs" title={v.affectedAsset ?? undefined}>
                        {v.affectedAsset ?? "—"}
                      </td>
                      <td className="py-2 text-muted-foreground">{v.assignee?.name ?? "Unassigned"}</td>
                      <td className="py-2 text-muted-foreground">
                        {v.control ? v.control.name ?? v.control.code : "—"}
                      </td>
                      <td className="py-2">
                        <StatusPill status={v.status} labelMap={VULN_STATUS_LABEL} variantMap={VULN_STATUS_VARIANT} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <VulnerabilityDetailSheet vulnerability={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
