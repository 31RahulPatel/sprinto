"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CloudAccountSetupInfo } from "@/types";

const AWS_REGIONS = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "eu-west-1",
  "eu-central-1",
  "ap-southeast-1",
  "ap-southeast-2",
];

async function fetchSetupInfo(): Promise<CloudAccountSetupInfo> {
  const res = await fetch("/api/cloud-accounts/setup-info");
  if (!res.ok) throw new Error("Failed to load setup info");
  return res.json();
}

export function ConnectAwsAccountCard({ onConnected }: { onConnected?: () => void } = {}) {
  const queryClient = useQueryClient();
  const [showInstructions, setShowInstructions] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [roleArn, setRoleArn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: setupInfo, isLoading } = useQuery({
    queryKey: ["cloud-accounts", "setup-info"],
    queryFn: fetchSetupInfo,
    // The External ID is derived deterministically from the account (HMAC, not random), so it's
    // stable across refetches — no need to pin staleTime to avoid a mismatch.
    staleTime: 5 * 60 * 1000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupInfo) return;
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/cloud-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId,
        displayName: displayName.trim() || undefined,
        region,
        roleArn,
        externalId: setupInfo.externalId,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Failed to connect account.");
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["cloud-accounts"] });
    onConnected?.();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Connect an AWS account via IAM role assumption to start scanning S3, IAM, RDS, VPC,
        Lambda, and CloudTrail.
      </p>

      <button
        type="button"
        onClick={() => setShowInstructions((v) => !v)}
        className="flex items-center gap-1 text-sm font-medium text-aws-blue hover:underline"
      >
        {showInstructions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        Setup instructions
      </button>

      {showInstructions && setupInfo && (
        <div className="max-h-64 space-y-3 overflow-y-auto rounded-md border border-border bg-muted/40 p-4 text-sm">
          <ol className="list-decimal space-y-2 pl-4">
            <li>
              In the AWS Console, create an IAM role named{" "}
              <code className="rounded bg-muted px-1 py-0.5">{setupInfo.roleName}</code> (or
              any name you like) using the trust policy below.
            </li>
            <li>Attach the inline policy below to that role (read-only, S3 only).</li>
            <li>
              Also attach the AWS managed policies below (read-only, one per service) so IAM,
              RDS, VPC, Lambda, and CloudTrail scans work too.
            </li>
            <li>Copy the resulting Role ARN into the form and submit.</li>
          </ol>
          <div>
            <p className="mb-1 font-medium">Trust policy</p>
            <pre className="overflow-x-auto rounded bg-background p-2 text-xs">
              {JSON.stringify(setupInfo.trustPolicy, null, 2)}
            </pre>
          </div>
          <div>
            <p className="mb-1 font-medium">Inline policy (read-only, S3 only)</p>
            <pre className="overflow-x-auto rounded bg-background p-2 text-xs">
              {JSON.stringify(setupInfo.inlinePolicy, null, 2)}
            </pre>
          </div>
          <div>
            <p className="mb-1 font-medium">AWS managed policies to attach (read-only)</p>
            <ul className="list-disc space-y-0.5 pl-4 font-mono text-xs">
              {setupInfo.managedPolicyArns.map((arn) => (
                <li key={arn} className="rounded bg-background p-1">
                  {arn}
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-muted-foreground">
              In the role&apos;s Permissions tab: Add permissions → Attach policies → search
              for and attach each policy name above (the part after the last{" "}
              <code className="rounded bg-muted px-1 py-0.5">/</code>).
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            External ID: <code className="rounded bg-muted px-1 py-0.5">{setupInfo.externalId}</code>{" "}
            (already included in the trust policy above)
          </p>
        </div>
      )}

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Display name (optional)</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Production account"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">AWS Account ID</label>
            <Input
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="123456789012"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Region</label>
            <Select value={region} onValueChange={(value) => value && setRegion(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AWS_REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Role ARN</label>
          <Input
            value={roleArn}
            onChange={(e) => setRoleArn(e.target.value)}
            placeholder="arn:aws:iam::123456789012:role/CompliancePlatformScannerRole"
            required
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button
          type="submit"
          disabled={isLoading || submitting}
          className="w-full bg-aws-blue hover:brightness-110"
        >
          {submitting ? "Connecting..." : "Connect account"}
        </Button>
      </form>
    </div>
  );
}
