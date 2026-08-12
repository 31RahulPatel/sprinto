"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Check, Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ControlLinkPicker } from "@/components/controls/ControlLinkPicker";
import { usePeople } from "@/hooks/usePeople";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { isSuperAdmin } from "@/lib/permissions";
import { OS_OPTIONS } from "@/lib/staff-device-checks";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "DEV", label: "Dev" },
];

const STEPS = [
  { title: "Account", description: "Name, email, password and role" },
  { title: "Profile", description: "Department, title and supervisor" },
  { title: "Device", description: "Register their work device" },
  { title: "Responsibilities", description: "Link a compliance control" },
  { title: "Review & Create", description: "Confirm and create the account" },
] as const;

function generatePassword(length = 14): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function ManagerPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (managerId: string | null) => void;
}) {
  const { data: people } = usePeople();
  return (
    <Select value={value ?? "none"} onValueChange={(v) => onChange(v === "none" ? null : v ?? null)}>
      <SelectTrigger className="h-8 w-full text-xs">
        <SelectValue placeholder="No supervisor" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No supervisor</SelectItem>
        {people?.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.fullName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface CreateResult {
  email: string;
  temporaryPassword: string | null;
  profileAttempted: boolean;
  profileOk: boolean;
  deviceAttempted: boolean;
  deviceOk: boolean;
}

export function AddUserWizard() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Step 1: Account
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>("DEV");

  const visibleRoleOptions = ROLE_OPTIONS.filter(
    (r) => r.value !== "SUPER_ADMIN" || isSuperAdmin(currentUser?.role),
  );

  // Step 2: Profile
  const [department, setDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [managerId, setManagerId] = useState<string | null>(null);

  // Step 3: Device
  const [deviceName, setDeviceName] = useState("");
  const [deviceOs, setDeviceOs] = useState<string>("");
  const [deviceOsVersion, setDeviceOsVersion] = useState("");

  // Step 4: Responsibilities
  const [controlId, setControlId] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateResult | null>(null);
  const [copied, setCopied] = useState(false);

  const hasProfile = !!(department || jobTitle || employmentType || managerId);
  const hasDevice = !!(deviceName.trim() && deviceOs);

  const reset = () => {
    setStepIndex(0);
    setName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setRole("DEV");
    setDepartment("");
    setJobTitle("");
    setEmploymentType("");
    setManagerId(null);
    setDeviceName("");
    setDeviceOs("");
    setDeviceOsVersion("");
    setControlId(null);
    setSubmitting(false);
    setError(null);
    setResult(null);
    setCopied(false);
  };

  const accountValid = name.trim().length > 0 && email.trim().length > 0 && password.length >= 8;
  const isLastStep = stepIndex === STEPS.length - 1;
  const canGoNext = stepIndex === 0 ? accountValid : true;

  const handleCreate = async () => {
    setSubmitting(true);
    setError(null);

    const userRes = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    if (!userRes.ok) {
      const data = await userRes.json().catch(() => ({}));
      setError(data.message ?? "Failed to create user.");
      setSubmitting(false);
      return;
    }
    const userData = await userRes.json();

    const hasAssignment = hasProfile || !!controlId;
    let profileOk = false;
    if (hasAssignment) {
      const personRes = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: name,
          email,
          jobTitle: jobTitle || undefined,
          department: department || undefined,
          employmentType: employmentType || undefined,
          managerId: managerId ?? undefined,
          controlId: controlId ?? undefined,
          linkedUserId: userData.user.id,
        }),
      });
      profileOk = personRes.ok;
      await queryClient.invalidateQueries({ queryKey: ["people"] });
    }

    let deviceOk = false;
    if (hasDevice) {
      const deviceRes = await fetch("/api/staff-devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceName: deviceName.trim(),
          os: deviceOs,
          osVersion: deviceOsVersion.trim() || undefined,
          ownerId: userData.user.id,
        }),
      });
      deviceOk = deviceRes.ok;
      await queryClient.invalidateQueries({ queryKey: ["staff-devices"] });
    }

    setSubmitting(false);
    setResult({
      email: userData.user.email,
      temporaryPassword: userData.temporaryPassword,
      profileAttempted: hasAssignment,
      profileOk,
      deviceAttempted: hasDevice,
      deviceOk,
    });
    await queryClient.invalidateQueries({ queryKey: ["org-members"] });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" />
        Add teammate
      </Button>
      <DialogContent className="w-full sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add teammate</DialogTitle>
          <DialogDescription>
            Create their account, then optionally assign a profile, device and compliance
            control — everything here except the account itself can be skipped and done later.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-6">
          <nav className="w-40 shrink-0 space-y-1">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex gap-2">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium",
                      i < stepIndex
                        ? "border-success bg-success text-white"
                        : i === stepIndex
                          ? "border-aws-blue text-aws-blue"
                          : "border-border text-muted-foreground",
                    )}
                  >
                    {i < stepIndex ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  {i < STEPS.length - 1 && <span className="mt-1 h-6 w-px bg-border" />}
                </div>
                <div className="pb-2">
                  <p
                    className={cn(
                      "text-xs font-medium",
                      i > stepIndex && "text-muted-foreground",
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </nav>

          <div className="flex-1 space-y-3">
            {stepIndex === 0 && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Password</label>
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      title="Generate password"
                      onClick={() => {
                        setPassword(generatePassword());
                        setShowPassword(true);
                      }}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You&apos;re setting their password directly — share it with them out-of-band.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Role</label>
                  <Select value={role} onValueChange={(v) => v && setRole(v as Role)}>
                    <SelectTrigger className="w-full">
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
                </div>
              </>
            )}

            {stepIndex === 1 && (
              <>
                <p className="text-xs text-muted-foreground">
                  Optional — creates a linked People record for compliance tracking.
                </p>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Department</label>
                  <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Job Title</label>
                  <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Employment Type</label>
                  <Input
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    placeholder="e.g. Full-time, Contractor"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Manager / Supervisor</label>
                  <ManagerPicker value={managerId} onChange={setManagerId} />
                </div>
              </>
            )}

            {stepIndex === 2 && (
              <>
                <p className="text-xs text-muted-foreground">
                  Optional — registers their work device and creates the same 3 compliance
                  checks (software updated, login auth, disk encryption) they&apos;d get from
                  self-registering under Data Library &gt; Staff Devices.
                </p>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Device Name</label>
                  <Input
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="e.g. Jane's MacBook Pro"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Operating System</label>
                  <Select value={deviceOs} onValueChange={(v) => v && setDeviceOs(v)}>
                    <SelectTrigger className="w-full">
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
                  <label className="text-sm font-medium">OS Version (optional)</label>
                  <Input
                    value={deviceOsVersion}
                    onChange={(e) => setDeviceOsVersion(e.target.value)}
                    placeholder="e.g. 15.2"
                  />
                </div>
              </>
            )}

            {stepIndex === 3 && (
              <>
                <p className="text-xs text-muted-foreground">
                  Optional — link this person to a compliance control they&apos;re responsible for.
                </p>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Control</label>
                  <ControlLinkPicker value={controlId} onChange={setControlId} />
                </div>
              </>
            )}

            {stepIndex === 4 && (
              <>
                {result ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Account created for {result.email}.</p>
                    {result.temporaryPassword ? (
                      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-3">
                        <code className="flex-1 break-all font-mono text-sm">
                          {result.temporaryPassword}
                        </code>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => {
                            navigator.clipboard.writeText(result.temporaryPassword ?? "");
                            setCopied(true);
                          }}
                        >
                          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        They can log in with the password you set.
                      </p>
                    )}
                    {result.profileAttempted && (
                      <p className={cn("text-xs", result.profileOk ? "text-success" : "text-danger")}>
                        {result.profileOk
                          ? "Profile and control assignment saved."
                          : "Profile/control assignment failed — add it later from Data Library > People."}
                      </p>
                    )}
                    {result.deviceAttempted && (
                      <p className={cn("text-xs", result.deviceOk ? "text-success" : "text-danger")}>
                        {result.deviceOk
                          ? "Device registered with its 3 compliance checks."
                          : "Device registration failed — add it later from Data Library > Staff Devices."}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Review</p>
                    <dl className="space-y-1 text-xs">
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Name</dt>
                        <dd>{name || "—"}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Email</dt>
                        <dd>{email || "—"}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Role</dt>
                        <dd>{ROLE_OPTIONS.find((r) => r.value === role)?.label}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Profile</dt>
                        <dd>{hasProfile ? "Will be assigned" : "Not assigned"}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Device</dt>
                        <dd>{hasDevice ? `${deviceName} (${deviceOs})` : "Not registered"}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Control</dt>
                        <dd>{controlId ? "Will be linked" : "Not linked"}</dd>
                      </div>
                    </dl>
                    {error && <p className="text-xs text-danger">{error}</p>}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          {result ? (
            <Button onClick={() => setOpen(false)}>Done</Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                disabled={stepIndex === 0}
              >
                Back
              </Button>
              {isLastStep ? (
                <Button onClick={handleCreate} disabled={submitting || !accountValid}>
                  {submitting ? "Creating..." : "Create User"}
                </Button>
              ) : (
                <Button
                  onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
                  disabled={!canGoNext}
                >
                  Next
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
