"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { Construction } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DATA_LIBRARY_NAV_ITEMS } from "@/components/layout/nav-items";

export default function DataLibraryItemPage({ params }: { params: Promise<{ item: string }> }) {
  const { item } = use(params);
  const entry = DATA_LIBRARY_NAV_ITEMS.find((i) => i.item === item);

  if (!entry) {
    notFound();
  }

  const Icon = entry.icon;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-aws-navy dark:text-foreground">{entry.label}</h1>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Construction className="h-4 w-4 text-warning" />
            Not available yet
          </CardTitle>
          <CardDescription>
            <Icon className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
            {entry.label} hasn&apos;t been built yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Support for {entry.label} is planned for a later phase.
        </CardContent>
      </Card>
    </div>
  );
}
