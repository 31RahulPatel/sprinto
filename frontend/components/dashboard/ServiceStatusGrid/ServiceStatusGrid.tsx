"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Archive, KeyRound, Server, Network, Database, Zap, ScrollText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ServiceStatus } from "@/types";

const SERVICE_META: Record<string, { label: string; icon: typeof Archive }> = {
  s3: { label: "AWS S3", icon: Archive },
  iam: { label: "AWS IAM", icon: KeyRound },
  ec2: { label: "AWS EC2", icon: Server },
  vpc: { label: "AWS VPC", icon: Network },
  rds: { label: "AWS RDS", icon: Database },
  lambda: { label: "AWS Lambda", icon: Zap },
  cloudtrail: { label: "AWS CloudTrail", icon: ScrollText },
};

function statusFor(s: ServiceStatus) {
  if (!s.implemented) {
    return { label: "Not yet scanned", border: "border-border", dot: "bg-muted-foreground" };
  }
  if (s.score === null) {
    return { label: "No scans yet", border: "border-border", dot: "bg-muted-foreground" };
  }
  if (s.score >= 80) {
    return { label: "Compliant", border: "border-success/40", dot: "bg-success" };
  }
  if (s.score >= 50) {
    return { label: "Attention Required", border: "border-warning/40", dot: "bg-warning" };
  }
  return { label: "Critical Findings", border: "border-danger/40", dot: "bg-danger" };
}

function formatLastScan(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString();
}

export function ServiceStatusGrid({ services }: { services: ServiceStatus[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {services.map((s, i) => {
        const meta = SERVICE_META[s.service] ?? { label: s.service.toUpperCase(), icon: Archive };
        const Icon = meta.icon;
        const status = statusFor(s);
        const lastScan = formatLastScan(s.lastScanAt);

        return (
          <motion.div
            key={s.service}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            whileHover={{ scale: 1.01 }}
          >
            <Link href={`/services/${s.service}`}>
              <Card
                className={cn(
                  "h-full cursor-pointer border shadow-sm transition-shadow hover:shadow-lg",
                  status.border,
                )}
              >
                <CardContent className="flex items-start justify-between gap-3 py-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0 text-aws-blue" />
                      <span className="truncate text-sm font-medium">{meta.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                      {status.label}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {lastScan ? `Scan details: ${lastScan}` : "Scan details: —"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xl font-semibold text-aws-navy dark:text-foreground">
                      {s.score === null ? "—" : `${s.score}%`}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
