"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { MobileNav } from "@/components/layout/MobileNav";
import { AddAccountDialog } from "@/components/layout/AddAccountDialog";
import { canManageCloudAccounts } from "@/lib/permissions";

export function Navbar() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  const initial = user?.name?.[0]?.toUpperCase() ?? "?";
  const roleLabel = user
    ? user.organization
      ? `${user.role} · ${user.organization.name}`
      : user.role
    : "";

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    queryClient.setQueryData(["auth", "me"], null);
    router.push("/login");
  };

  return (
    <header className="flex h-16 items-center gap-2 border-b border-border bg-card px-3 sm:gap-4 sm:px-6">
      <MobileNav />

      <div className="relative hidden w-full max-w-sm sm:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search findings, scans, reports..." className="pl-9" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {canManageCloudAccounts(user) && <AddAccountDialog />}

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" aria-label="Notifications" />}
          >
            <Bell className="h-5 w-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Critical Finding Detected</DropdownMenuItem>
            <DropdownMenuItem>Scan Completed</DropdownMenuItem>
            <DropdownMenuItem>Report Generated</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" className="flex items-center gap-2 px-2" />}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <div className="hidden text-left text-sm leading-tight sm:block">
              <div className="font-medium">{user?.name ?? "Guest"}</div>
              <div className="text-xs text-muted-foreground">{roleLabel}</div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
