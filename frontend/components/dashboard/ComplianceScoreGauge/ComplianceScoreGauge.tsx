"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function statusFor(score: number | null) {
  if (score === null) return { label: "No data", color: "var(--color-muted-foreground)" };
  if (score >= 80) return { label: "Good", color: "var(--color-success)" };
  if (score >= 50) return { label: "Needs Attention", color: "var(--color-warning)" };
  return { label: "Critical", color: "var(--color-danger)" };
}

export function ComplianceScoreGauge({ score }: { score: number | null }) {
  const { label, color } = statusFor(score);
  const pct = score ?? 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="h-full border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Overall Compliance Score</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-4">
          <div className="relative h-32 w-32">
            <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="10"
              />
              <motion.circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-semibold text-aws-navy dark:text-foreground">
                {score === null ? "—" : `${score}%`}
              </span>
            </div>
          </div>
          <span className="text-sm font-medium" style={{ color }}>
            {label}
          </span>
        </CardContent>
      </Card>
    </motion.div>
  );
}
