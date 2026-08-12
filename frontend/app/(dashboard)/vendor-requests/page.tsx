import { Construction } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function VendorRequestsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-aws-navy dark:text-foreground">Vendor Requests</h1>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Construction className="h-4 w-4 text-warning" />
            Feature under maintenance
          </CardTitle>
          <CardDescription>Requesting access to a new vendor/tool isn&apos;t available yet.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Vendor access requests are planned for a later phase.
        </CardContent>
      </Card>
    </div>
  );
}
