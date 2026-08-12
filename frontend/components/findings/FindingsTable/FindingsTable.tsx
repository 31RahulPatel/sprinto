"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { FindingDetailSheet } from "@/components/findings/FindingDetailSheet";
import { StatusBadge } from "@/components/findings/StatusBadge";
import { useCloudAccounts, accountLabel } from "@/hooks/useCloudAccounts";
import type { AwsServiceSlug, Finding, FindingStatus, Severity } from "@/types";

const STATUS_FILTER_OPTIONS: { value: FindingStatus; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "EVIDENCE_SUBMITTED", label: "Evidence Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "RESOLVED", label: "Resolved" },
];

async function fetchFindings(params: URLSearchParams): Promise<Finding[]> {
  const qs = params.toString();
  const res = await fetch(qs ? `/api/findings?${qs}` : "/api/findings");
  if (!res.ok) throw new Error("Failed to load findings");
  return res.json();
}

const SEVERITY_VARIANT: Record<Severity, "default" | "secondary" | "destructive" | "outline"> = {
  CRITICAL: "destructive",
  HIGH: "destructive",
  MEDIUM: "default",
  LOW: "secondary",
  INFO: "outline",
};

export function FindingsTable({ service, scanId }: { service?: AwsServiceSlug; scanId?: string }) {
  const [selected, setSelected] = useState<Finding | null>(null);
  const [severity, setSeverity] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [accountId, setAccountId] = useState("ALL");
  const [search, setSearch] = useState("");

  const { data: accounts } = useCloudAccounts();

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (scanId) p.set("scanId", scanId);
    if (service) p.set("service", service);
    if (severity !== "ALL") p.set("severity", severity);
    if (status !== "ALL") p.set("status", status);
    if (accountId !== "ALL") p.set("cloudAccountId", accountId);
    if (search.trim()) p.set("search", search.trim());
    return p;
  }, [scanId, service, severity, status, accountId, search]);

  const { data: findings } = useQuery({
    queryKey: ["findings", params.toString()],
    queryFn: () => fetchFindings(params),
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search title or resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Select value={severity} onValueChange={(v) => v && setSeverity(v)}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All severities</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="INFO">Info</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => v && setStatus(v)}>
          <SelectTrigger className="h-8 w-[150px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUS_FILTER_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
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

      {!findings || findings.length === 0 ? (
        <EmptyState message="No findings match these filters." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Severity</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Service</th>
                <th className="pb-2 font-medium">Resource</th>
                <th className="hidden pb-2 font-medium sm:table-cell">Category</th>
                <th className="pb-2 font-medium">Title</th>
                <th className="hidden pb-2 font-medium md:table-cell">Assignee</th>
              </tr>
            </thead>
            <tbody>
              {findings.map((finding) => (
                <tr
                  key={finding.id}
                  onClick={() => setSelected(finding)}
                  className="cursor-pointer border-b border-border align-top transition-colors last:border-0 hover:bg-accent"
                >
                  <td className="py-2">
                    <Badge variant={SEVERITY_VARIANT[finding.severity]}>{finding.severity}</Badge>
                  </td>
                  <td className="py-2">
                    <StatusBadge status={finding.status} />
                  </td>
                  <td className="py-2 uppercase">{finding.service}</td>
                  <td className="max-w-[10rem] truncate py-2 font-mono text-xs" title={finding.resource}>
                    {finding.resource}
                  </td>
                  <td className="hidden py-2 sm:table-cell">{finding.category}</td>
                  <td className="max-w-xs truncate py-2" title={finding.title}>
                    {finding.title}
                  </td>
                  <td className="hidden py-2 text-muted-foreground md:table-cell">
                    {finding.assignee?.name ?? "Unassigned"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FindingDetailSheet finding={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
