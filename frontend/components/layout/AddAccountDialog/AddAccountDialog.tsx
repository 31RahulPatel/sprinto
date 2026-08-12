"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ConnectAwsAccountCard } from "@/components/scans/ConnectAwsAccountCard";

export function AddAccountDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Add Account</span>
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
  );
}
