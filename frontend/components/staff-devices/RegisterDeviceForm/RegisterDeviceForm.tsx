"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInvalidateMyStaffDevice } from "@/hooks/useStaffDevices";
import { OS_OPTIONS } from "@/lib/staff-device-checks";

export function RegisterDeviceForm() {
  const invalidate = useInvalidateMyStaffDevice();
  const [deviceName, setDeviceName] = useState("");
  const [os, setOs] = useState<string>("");
  const [osVersion, setOsVersion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!deviceName.trim() || !os) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/staff-devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceName: deviceName.trim(),
        os,
        osVersion: osVersion.trim() || undefined,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Failed to register device.");
      return;
    }
    await invalidate();
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Register the device you use for work — you&apos;ll be asked to provide evidence for 3
        compliance checks.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Device Name</label>
          <Input
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder="e.g. Jane's MacBook Pro"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Operating System</label>
          <Select value={os} onValueChange={(v) => v && setOs(v)}>
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue placeholder="Select OS" />
            </SelectTrigger>
            <SelectContent>
              {OS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">OS Version (optional)</label>
          <Input
            value={osVersion}
            onChange={(e) => setOsVersion(e.target.value)}
            placeholder="e.g. 15.2"
            className="h-8 text-xs"
          />
        </div>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <Button size="sm" disabled={!deviceName.trim() || !os || submitting} onClick={submit}>
        {submitting ? "Registering..." : "Register device"}
      </Button>
    </div>
  );
}
