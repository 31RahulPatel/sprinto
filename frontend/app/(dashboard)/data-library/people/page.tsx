"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusPill } from "@/components/common/StatusPill";
import { PersonDetailSheet } from "@/components/people/PersonDetailSheet";
import { CreatePersonDialog } from "@/components/people/CreatePersonDialog";
import { usePeople } from "@/hooks/usePeople";
import type { Person, PersonStatus } from "@/types";

const PERSON_STATUS_LABEL: Record<PersonStatus, string> = {
  ACTIVE: "Active",
  OFFBOARDING: "Offboarding",
  INACTIVE: "Inactive",
};

const PERSON_STATUS_VARIANT: Record<PersonStatus, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  OFFBOARDING: "secondary",
  INACTIVE: "outline",
};

export default function PeoplePage() {
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Person | null>(null);

  const { data: people } = usePeople({ status, search });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-aws-navy dark:text-foreground">People</h1>
        <CreatePersonDialog />
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search people..."
                className="h-8 w-56 pl-8 text-xs"
              />
            </div>
            <Select value={status || "all"} onValueChange={(v) => setStatus(!v || v === "all" ? "" : v)}>
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {(Object.keys(PERSON_STATUS_LABEL) as PersonStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {PERSON_STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!people || people.length === 0 ? (
            <EmptyState message="No people yet — add an employee or contractor to start tracking compliance." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Department</th>
                    <th className="pb-2 font-medium">Job Title</th>
                    <th className="pb-2 font-medium">Compliance Owner</th>
                    <th className="pb-2 font-medium">Control</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {people.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-accent"
                    >
                      <td className="max-w-xs truncate py-2 font-medium" title={p.fullName}>
                        {p.fullName}
                      </td>
                      <td className="py-2 text-muted-foreground">{p.department ?? "—"}</td>
                      <td className="py-2 text-muted-foreground">{p.jobTitle ?? "—"}</td>
                      <td className="py-2 text-muted-foreground">{p.assignee?.name ?? "Unassigned"}</td>
                      <td className="py-2 text-muted-foreground">
                        {p.control ? p.control.name ?? p.control.code : "—"}
                      </td>
                      <td className="py-2">
                        <StatusPill
                          status={p.status}
                          labelMap={PERSON_STATUS_LABEL}
                          variantMap={PERSON_STATUS_VARIANT}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <PersonDetailSheet person={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
