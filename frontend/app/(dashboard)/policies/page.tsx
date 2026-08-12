"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusPill } from "@/components/common/StatusPill";
import { CreatePolicyDialog } from "@/components/policies/CreatePolicyDialog";
import { PolicyDetailSheet } from "@/components/policies/PolicyDetailSheet";
import { usePolicies } from "@/hooks/usePolicies";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { canManagePolicies } from "@/lib/permissions";
import { relativeTime } from "@/lib/relative-time";
import type { PolicyStatus } from "@/types";

const STATUS_LABEL: Record<PolicyStatus, string> = {
  ACCEPTED: "Accepted",
  PENDING: "Pending",
};

const STATUS_VARIANT: Record<PolicyStatus, "default" | "secondary" | "destructive" | "outline"> = {
  ACCEPTED: "default",
  PENDING: "secondary",
};

export default function PoliciesPage() {
  const { data: currentUser } = useCurrentUser();
  const { data: policies } = usePolicies();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Derived from the live query (not a frozen snapshot) so the open sheet reflects an
  // accept/edit mutation's refetch immediately instead of only after closing and reopening.
  const selected = policies?.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-aws-navy dark:text-foreground">Policies</h1>
        {canManagePolicies(currentUser) && <CreatePolicyDialog />}
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">All Policies</CardTitle>
        </CardHeader>
        <CardContent>
          {!policies || policies.length === 0 ? (
            <EmptyState message="No policies published yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Title</th>
                    <th className="pb-2 font-medium">Version</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-accent"
                    >
                      <td className="py-2 font-medium">{p.title}</td>
                      <td className="py-2 text-muted-foreground">v{p.version}</td>
                      <td className="py-2">
                        <StatusPill status={p.status} labelMap={STATUS_LABEL} variantMap={STATUS_VARIANT} />
                      </td>
                      <td className="py-2 text-muted-foreground">{relativeTime(p.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <PolicyDetailSheet policy={selected} onOpenChange={(open) => !open && setSelectedId(null)} />
    </div>
  );
}
