"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamMembers } from "@/components/settings/TeamMembers";
import { EvidenceVerificationSettings } from "@/components/settings/EvidenceVerificationSettings";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { canManageUsers } from "@/lib/permissions";

export default function SettingsPage() {
  const { data: user } = useCurrentUser();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-aws-navy dark:text-foreground">Settings</h1>

      {user?.organizationId && canManageUsers(user) ? (
        <TeamMembers />
      ) : (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Your Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>{user?.name}</p>
            <p>{user?.email}</p>
            <p>
              {user?.organizationId
                ? "Ask an admin if you need changes made to your account or teammates."
                : "Individual accounts don't have a team — findings you connect are assigned to you automatically."}
            </p>
          </CardContent>
        </Card>
      )}

      {canManageUsers(user) && <EvidenceVerificationSettings />}
    </div>
  );
}
