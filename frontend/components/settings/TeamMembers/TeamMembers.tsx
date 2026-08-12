"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UserCheck, UserX } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusPill } from "@/components/common/StatusPill";
import { AddUserWizard } from "@/components/settings/AddUserWizard";
import { EditUserDialog } from "@/components/settings/EditUserDialog";
import { useOrgMembers } from "@/hooks/useOrgMembers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { isSuperAdmin } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { OrgMember, Role, UserAccountStatus } from "@/types";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "DEV", label: "Dev" },
];

const STATUS_LABEL: Record<UserAccountStatus, string> = {
  ACTIVE: "Active",
  DISABLED: "Disabled",
};

const STATUS_VARIANT: Record<UserAccountStatus, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "secondary",
  DISABLED: "destructive",
};

function MemberRoleSelect({
  memberId,
  role,
  disabled,
  viewerIsSuperAdmin,
}: {
  memberId: string;
  role: Role;
  disabled: boolean;
  viewerIsSuperAdmin: boolean;
}) {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const handleChange = async (next: Role) => {
    setSubmitting(true);
    const res = await fetch(`/api/users/${memberId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: next }),
    });
    setSubmitting(false);
    if (res.ok) {
      await queryClient.invalidateQueries({ queryKey: ["org-members"] });
    }
  };

  const visibleRoleOptions = ROLE_OPTIONS.filter((r) => r.value !== "SUPER_ADMIN" || viewerIsSuperAdmin);

  return (
    <Select value={role} onValueChange={(v) => v && handleChange(v as Role)} disabled={disabled || submitting}>
      <SelectTrigger className="h-8 w-[140px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {visibleRoleOptions.map((r) => (
          <SelectItem key={r.value} value={r.value}>
            {r.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DeactivateToggle({
  member,
  isSelf,
  canManage,
}: {
  member: OrgMember;
  isSelf: boolean;
  canManage: boolean;
}) {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    if (member.status === "ACTIVE") {
      if (!window.confirm(`Deactivate ${member.name}? They'll be logged out and won't be able to sign in until reactivated.`)) {
        return;
      }
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/users/${member.id}${member.status === "ACTIVE" ? "" : "/reactivate"}`, {
      method: member.status === "ACTIVE" ? "DELETE" : "PATCH",
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Action failed.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["org-members"] });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="icon-sm"
        title={member.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
        disabled={submitting || isSelf || !canManage}
        onClick={toggle}
      >
        {member.status === "ACTIVE" ? (
          <UserX className="h-3.5 w-3.5" />
        ) : (
          <UserCheck className="h-3.5 w-3.5" />
        )}
      </Button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export function TeamMembers() {
  const { data: currentUser } = useCurrentUser();
  const { data: members } = useOrgMembers(true);
  const viewerIsSuperAdmin = isSuperAdmin(currentUser?.role);

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Team</CardTitle>
        <AddUserWizard />
      </CardHeader>
      <CardContent>
        {!members || members.length === 0 ? (
          <EmptyState message="No teammates yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const isSelf = m.id === currentUser?.id;
                  const canManage = viewerIsSuperAdmin || m.role !== "SUPER_ADMIN";
                  return (
                    <tr
                      key={m.id}
                      className={cn(
                        "border-b border-border last:border-0",
                        m.status === "DISABLED" && "opacity-60",
                      )}
                    >
                      <td className="py-2">{m.name}</td>
                      <td className="py-2 text-muted-foreground">{m.email}</td>
                      <td className="py-2">
                        <MemberRoleSelect
                          memberId={m.id}
                          role={m.role}
                          disabled={(isSelf && m.role === "SUPER_ADMIN") || m.status === "DISABLED" || !canManage}
                          viewerIsSuperAdmin={viewerIsSuperAdmin}
                        />
                      </td>
                      <td className="py-2">
                        <StatusPill status={m.status} labelMap={STATUS_LABEL} variantMap={STATUS_VARIANT} />
                      </td>
                      <td className="py-2">
                        <div className="flex justify-end gap-1.5">
                          <EditUserDialog member={m} disabled={!canManage} />
                          <DeactivateToggle member={m} isSelf={isSelf} canManage={canManage} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
