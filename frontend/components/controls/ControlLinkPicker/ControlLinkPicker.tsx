"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useControls } from "@/hooks/useControls";

export function ControlLinkPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (controlId: string | null) => void;
}) {
  const { data: controls } = useControls();

  return (
    <Select value={value ?? "none"} onValueChange={(v) => onChange(v === "none" ? null : v ?? null)}>
      <SelectTrigger className="h-8 w-full text-xs">
        <SelectValue placeholder="No control linked" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No control linked</SelectItem>
        {controls?.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name ?? c.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
