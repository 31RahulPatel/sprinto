"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { FindingDetailSheet } from "@/components/findings/FindingDetailSheet";
import { relativeTime } from "@/lib/relative-time";
import type { Finding, Severity } from "@/types";

async function fetchFindings(): Promise<Finding[]> {
  const res = await fetch("/api/findings");
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

export function RecentFindingsFeed() {
  const [selected, setSelected] = useState<Finding | null>(null);
  const { data: findings } = useQuery({ queryKey: ["findings", "all"], queryFn: fetchFindings });
  const recent = findings?.slice(0, 5) ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="h-full border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Findings</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <EmptyState message="No findings yet — run a scan to populate this feed." />
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(f)}
                    className="flex w-full items-start justify-between gap-3 py-2.5 text-left transition-colors hover:bg-accent"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{f.title}</p>
                      <p className="text-xs text-muted-foreground">{relativeTime(f.createdAt)}</p>
                    </div>
                    <Badge variant={SEVERITY_VARIANT[f.severity]} className="shrink-0">
                      {f.severity}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <FindingDetailSheet finding={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </motion.div>
  );
}
