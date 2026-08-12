"use client";

import { useState } from "react";
import { Cloud } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ConnectAwsAccountCard } from "@/components/scans/ConnectAwsAccountCard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { canManageCloudAccounts } from "@/lib/permissions";

export function AwsIntegrationCard() {
  const { data: currentUser } = useCurrentUser();
  const [open, setOpen] = useState(false);

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Cloud className="h-4 w-4" />
          AWS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Connect an AWS account to scan it for compliance evidence.
        </p>
        {canManageCloudAccounts(currentUser) && (
          <Dialog open={open} onOpenChange={setOpen}>
            <Button size="sm" onClick={() => setOpen(true)}>
              Connect account
            </Button>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Connect AWS Account</DialogTitle>
                <DialogDescription>
                  Give it a display name so it&apos;s easy to tell apart from other connected accounts.
                </DialogDescription>
              </DialogHeader>
              <ConnectAwsAccountCard onConnected={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
