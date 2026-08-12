import { Badge } from "@/components/ui/badge";

export function StatusPill<T extends string>({
  status,
  labelMap,
  variantMap,
  className,
}: {
  status: T;
  labelMap: Record<T, string>;
  variantMap: Record<T, "default" | "secondary" | "destructive" | "outline">;
  className?: string;
}) {
  return (
    <Badge variant={variantMap[status]} className={className}>
      {labelMap[status]}
    </Badge>
  );
}
