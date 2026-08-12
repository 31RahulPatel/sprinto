"use client";

import Link from "next/link";
import { FileCheck, GraduationCap, Laptop, Fingerprint, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AssignedWorkSummary } from "@/components/dashboard/AssignedWorkSummary";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePolicies } from "@/hooks/usePolicies";
import { useTrainings } from "@/hooks/useTrainings";
import { useMyStaffDevice } from "@/hooks/useStaffDevices";

const QUOTE = "Security is everyone's job — thank you for helping keep your organization safe.";

function ChecklistCard({
  icon: Icon,
  title,
  done,
  doneLabel,
  pendingLabel,
  href,
  ctaLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  done: boolean;
  doneLabel: string;
  pendingLabel: string;
  href: string;
  ctaLabel: string;
}) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {done ? (
          <p className="flex items-center gap-1.5 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" />
            {doneLabel}
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{pendingLabel}</p>
            <Button size="sm" nativeButton={false} render={<Link href={href} />}>
              {ctaLabel}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function DevDashboard() {
  const { data: currentUser } = useCurrentUser();
  const { data: policies } = usePolicies();
  const { data: trainings } = useTrainings();
  const { data: myDevice } = useMyStaffDevice();

  const pendingPolicies = policies?.filter((p) => p.status === "PENDING").length ?? 0;
  const pendingTrainings = trainings?.filter((t) => t.status === "PENDING").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-aws-navy dark:text-foreground">
          Welcome, {currentUser?.name ?? "there"}
        </h1>
        <p className="text-sm text-muted-foreground">{QUOTE}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ChecklistCard
          icon={FileCheck}
          title="Policy"
          done={pendingPolicies === 0 && !!policies?.length}
          doneLabel="All policies accepted"
          pendingLabel={
            policies === undefined
              ? "Loading..."
              : pendingPolicies > 0
                ? `${pendingPolicies} policy${pendingPolicies === 1 ? "" : "ies"} need your review`
                : "No policies published yet"
          }
          href="/policies"
          ctaLabel="View and accept policy"
        />
        <ChecklistCard
          icon={GraduationCap}
          title="Training"
          done={pendingTrainings === 0 && !!trainings?.length}
          doneLabel="All trainings complete"
          pendingLabel={
            trainings === undefined
              ? "Loading..."
              : pendingTrainings > 0
                ? `${pendingTrainings} training${pendingTrainings === 1 ? "" : "s"} to complete`
                : "No trainings published yet"
          }
          href="/trainings"
          ctaLabel="Complete your training"
        />
        <ChecklistCard
          icon={Laptop}
          title="Device"
          done={myDevice?.status === "COMPLIANT"}
          doneLabel="Device compliant"
          pendingLabel={
            myDevice
              ? "Your device is registered — finish the compliance checks below to mark it compliant."
              : "Register your work device so we can track its compliance checks."
          }
          href="/data-library/staff-devices"
          ctaLabel={myDevice ? "View compliance checks" : "Report your device"}
        />
        <ChecklistCard
          icon={Fingerprint}
          title="MFA"
          done={false}
          doneLabel="MFA enabled"
          pendingLabel="Add an extra layer of security to your account."
          href="/mfa"
          ctaLabel="Enable MFA"
        />
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-aws-navy dark:text-foreground">Your assigned work</h2>
        <AssignedWorkSummary />
      </div>
    </div>
  );
}
