"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEvidenceVerificationMode } from "@/hooks/useEvidenceVerificationMode";
import type { EvidenceVerificationMode } from "@/types";

const OPTIONS: { value: EvidenceVerificationMode; label: string; description: string }[] = [
  {
    value: "AUTO_WITH_FALLBACK",
    label: "Automatic + Manual Fallback",
    description:
      "Re-scan the affected resource after evidence is submitted. If the system can verify the finding automatically, approve the evidence. If the scan fails or cannot verify the evidence, send it to a reviewer for manual review.",
  },
  {
    value: "AUTO_ONLY",
    label: "Automatic Scan Only",
    description:
      "Always re-scan the affected resource. If the scan passes, the evidence is automatically verified. If it fails, the finding is sent back to the assignee — never automatically marked compliant.",
  },
  {
    value: "MANUAL_ONLY",
    label: "Manual Verification Only",
    description:
      "No automatic re-scan. A reviewer or admin must manually approve or reject every piece of evidence submitted.",
  },
];

export function EvidenceVerificationSettings() {
  const queryClient = useQueryClient();
  const { data } = useEvidenceVerificationMode(true);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = async (mode: EvidenceVerificationMode) => {
    setSubmitting(true);
    await fetch("/api/settings/evidence-verification", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    setSubmitting(false);
    await queryClient.invalidateQueries({ queryKey: ["evidence-verification-mode"] });
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Evidence Verification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:bg-accent"
          >
            <input
              type="radio"
              name="evidence-verification-mode"
              checked={data?.mode === opt.value}
              disabled={submitting}
              onChange={() => handleChange(opt.value)}
              className="mt-1 h-4 w-4 shrink-0 accent-aws-blue"
            />
            <div>
              <p className="text-sm font-medium">
                {opt.label}
                {opt.value === "AUTO_WITH_FALLBACK" && (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    (Recommended)
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{opt.description}</p>
            </div>
          </label>
        ))}
      </CardContent>
    </Card>
  );
}
