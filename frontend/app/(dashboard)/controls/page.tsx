"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/findings/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { useControls, useControl } from "@/hooks/useControls";
import type { Severity } from "@/types";

const SEVERITY_VARIANT: Record<Severity, "default" | "secondary" | "destructive" | "outline"> = {
  CRITICAL: "destructive",
  HIGH: "destructive",
  MEDIUM: "default",
  LOW: "secondary",
  INFO: "outline",
};

function ControlDetailSheet({ id, onOpenChange }: { id: string | null; onOpenChange: (open: boolean) => void }) {
  const { data: control } = useControl(id);

  return (
    <Sheet open={id !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {control && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <Badge variant={control.compliant ? "default" : "destructive"}>
                  {control.compliant ? "Compliant" : "Non-Compliant"}
                </Badge>
                {control.framework && (
                  <span className="text-xs uppercase text-muted-foreground">{control.framework}</span>
                )}
              </div>
              <SheetTitle>{control.name ?? control.code}</SheetTitle>
            </SheetHeader>
            <div className="space-y-3 px-4 pb-6 text-sm">
              <h4 className="font-medium text-muted-foreground">Findings ({control.findingCount})</h4>
              {control.findings.length === 0 ? (
                <p className="text-xs text-muted-foreground">No findings mapped to this control.</p>
              ) : (
                <ul className="space-y-2">
                  {control.findings.map((f) => (
                    <li key={f.id} className="rounded-md border border-border p-2">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={SEVERITY_VARIANT[f.severity]}>{f.severity}</Badge>
                        <StatusBadge status={f.status} />
                      </div>
                      <p className="mt-1 truncate text-xs font-medium">{f.title}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">{f.resource}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function ControlsPage() {
  const { data: controls } = useControls();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-aws-navy dark:text-foreground">Controls</h1>

      <Card className="border-border shadow-sm">
        <CardContent className="pt-4">
          {!controls || controls.length === 0 ? (
            <EmptyState message="No controls yet — they're created automatically as scans map findings to compliance frameworks." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Control</th>
                    <th className="pb-2 font-medium">Framework</th>
                    <th className="pb-2 font-medium">Findings</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {controls.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-accent"
                    >
                      <td className="py-2 font-medium">{c.name ?? c.code}</td>
                      <td className="py-2 text-muted-foreground">{c.framework ?? "—"}</td>
                      <td className="py-2">{c.findingCount}</td>
                      <td className="py-2">
                        <Badge variant={c.compliant ? "default" : "destructive"}>
                          {c.compliant ? "Compliant" : "Non-Compliant"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ControlDetailSheet id={selectedId} onOpenChange={(open) => !open && setSelectedId(null)} />
    </div>
  );
}
