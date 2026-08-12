"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { FindingDetailSheet } from "@/components/findings/FindingDetailSheet";
import { relativeTime } from "@/lib/relative-time";
import { cn } from "@/lib/utils";
import type { Finding } from "@/types";

async function fetchFindings(): Promise<Finding[]> {
  const res = await fetch("/api/findings");
  if (!res.ok) throw new Error("Failed to load findings");
  return res.json();
}

export function AlertsPanel() {
  const [selected, setSelected] = useState<Finding | null>(null);
  const { data: findings } = useQuery({ queryKey: ["findings", "all"], queryFn: fetchFindings });

  const urgent = (findings ?? []).filter((f) => f.severity === "CRITICAL" || f.severity === "HIGH").slice(0, 5);
  const warnings = (findings ?? []).filter((f) => f.severity === "MEDIUM").slice(0, 5);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="h-full border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Alerts &amp; Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-danger">
              <AlertCircle className="h-3.5 w-3.5" />
              Urgent ({urgent.length})
            </h4>
            {urgent.length === 0 ? (
              <p className="text-xs text-muted-foreground">No urgent findings.</p>
            ) : (
              <ul className="space-y-2">
                {urgent.map((f) => (
                  <AlertRow key={f.id} finding={f} tone="danger" onClick={() => setSelected(f)} />
                ))}
              </ul>
            )}
          </div>

          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-warning">
              <AlertTriangle className="h-3.5 w-3.5" />
              Warnings ({warnings.length})
            </h4>
            {warnings.length === 0 ? (
              <p className="text-xs text-muted-foreground">No warnings.</p>
            ) : (
              <ul className="space-y-2">
                {warnings.map((f) => (
                  <AlertRow key={f.id} finding={f} tone="warning" onClick={() => setSelected(f)} />
                ))}
              </ul>
            )}
          </div>

          {(findings?.length ?? 0) === 0 && (
            <EmptyState message="No alerts yet — findings from scans will appear here." />
          )}
        </CardContent>
      </Card>

      <FindingDetailSheet finding={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </motion.div>
  );
}

function AlertRow({
  finding,
  tone,
  onClick,
}: {
  finding: Finding;
  tone: "danger" | "warning";
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-start gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-accent"
      >
        <span
          className={cn(
            "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
            tone === "danger" ? "bg-danger" : "bg-warning",
          )}
        />
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">{finding.title}</p>
          <p className="text-[11px] text-muted-foreground">{relativeTime(finding.createdAt)}</p>
        </div>
      </button>
    </li>
  );
}
